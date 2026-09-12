const { Op, fn, col, literal } = require("sequelize");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const {
  Product,
  ProductImage,
  Category,
  Size,
  Color,
  Review,
  sequelize,
} = require("../models");

const PRODUCT_INCLUDES = [
  { model: Category, attributes: ["id", "name", "slug"] },
  { model: ProductImage, as: "images", attributes: ["id", "image_url", "is_primary", "sort_order"] },
  { model: Size, as: "sizes", attributes: ["id", "name"], through: { attributes: ["stock"] } },
  { model: Color, as: "colors", attributes: ["id", "name", "hex_code"], through: { attributes: [] } },
];

// Computes average rating + review count for one or more product ids
const attachRatings = async (products) => {
  const ids = products.map((p) => p.id);
  if (ids.length === 0) return products;

  const stats = await Review.findAll({
    where: { product_id: { [Op.in]: ids } },
    attributes: [
      "product_id",
      [fn("AVG", col("rating")), "avg_rating"],
      [fn("COUNT", col("id")), "review_count"],
    ],
    group: ["product_id"],
    raw: true,
  });

  const map = {};
  stats.forEach((s) => {
    map[s.product_id] = {
      avg_rating: parseFloat(s.avg_rating).toFixed(1),
      review_count: parseInt(s.review_count, 10),
    };
  });

  return products.map((p) => {
    const json = p.toJSON ? p.toJSON() : p;
    return {
      ...json,
      rating: map[p.id]?.avg_rating ? parseFloat(map[p.id].avg_rating) : 0,
      review_count: map[p.id]?.review_count || 0,
      final_price: parseFloat((json.price * (1 - (json.discount || 0) / 100)).toFixed(2)),
    };
  });
};

// @route GET /api/products
// Supports search, filters (category, price range, size, color, gender, tag),
// sorting, and pagination — used by both the Shop page and the live search bar.
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      min_price,
      max_price,
      size,
      color,
      gender,
      tag,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const where = { is_active: true };
    const include = PRODUCT_INCLUDES.map((inc) => ({ ...inc }));

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { material: { [Op.like]: `%${search}%` } },
      ];
    }

    if (category) {
      include[0] = { ...include[0], where: { slug: category }, required: true };
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    if (gender) where.gender = gender;

    if (tag) {
      where.tags = { [Op.like]: `%"${tag}"%` };
    }

    if (size) {
      include[2] = { ...include[2], where: { name: size }, required: true };
    }

    if (color) {
      include[3] = { ...include[3], where: { name: color }, required: true };
    }

    let order = [["createdAt", "DESC"]];
    if (sort === "price_low") order = [["price", "ASC"]];
    if (sort === "price_high") order = [["price", "DESC"]];
    if (sort === "newest") order = [["createdAt", "DESC"]];

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 12, 50);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include,
      order,
      distinct: true,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    let withRatings = await attachRatings(rows);

    // "most_popular" and "best_rated" need rating data, so sort in JS after fetch
    if (sort === "best_rated") {
      withRatings = withRatings.sort((a, b) => b.rating - a.rating);
    } else if (sort === "most_popular") {
      withRatings = withRatings.sort((a, b) => b.review_count - a.review_count);
    }

    res.json({
      products: withRatings,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/products/search-suggestions?q=...
// Lightweight endpoint for the navbar's instant-suggestions dropdown.
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ suggestions: [] });

    const products = await Product.findAll({
      where: {
        is_active: true,
        [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { description: { [Op.like]: `%${q}%` } }],
      },
      attributes: ["id", "name", "slug", "price", "discount"],
      include: [{ model: ProductImage, as: "images", attributes: ["image_url"], limit: 1 }],
      limit: 6,
    });

    res.json({ suggestions: products });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug, is_active: true },
      include: PRODUCT_INCLUDES,
    });
    if (!product) return res.status(404).json({ message: "Product not found." });

    const [withRating] = await attachRatings([product]);

    const reviews = await Review.findAll({
      where: { product_id: product.id },
      include: [{ association: "User", attributes: ["id", "first_name", "last_name"] }],
      order: [["createdAt", "DESC"]],
    });

    // Similar products: same category, excluding the current product
    const similar = await Product.findAll({
      where: { category_id: product.category_id, id: { [Op.ne]: product.id }, is_active: true },
      include: PRODUCT_INCLUDES,
      limit: 4,
    });
    const similarWithRatings = await attachRatings(similar);

    res.json({ product: withRating, reviews, similar_products: similarWithRatings });
  } catch (error) {
    next(error);
  }
};

const generateUniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Product.findOne({ where });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
};

// @route POST /api/admin/products  (admin only)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      stock,
      category_id,
      material,
      brand,
      gender,
      tags,
      sizes, // [{ size_id, stock }]
      colors, // [color_id]
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Product name and price are required." });
    }

    const slug = await generateUniqueSlug(name);

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      discount: discount || 0,
      stock: stock || 0,
      category_id: category_id || null,
      material,
      brand,
      gender: gender || "unisex",
      tags: typeof tags === "string" ? JSON.parse(tags) : tags || [],
    });

    if (req.files && req.files.length > 0) {
      const images = req.files.map((file, idx) => ({
        product_id: product.id,
        image_url: `/uploads/products/${file.filename}`,
        is_primary: idx === 0,
        sort_order: idx,
      }));
      await ProductImage.bulkCreate(images);
    }

    const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
      await product.addSizes(
        parsedSizes.map((s) => s.size_id),
        { through: { stock: 0 } }
      );
      // Set per-size stock individually since bulk-add through options apply uniformly
      for (const s of parsedSizes) {
        await sequelize.models.ProductSize.update(
          { stock: s.stock || 0 },
          { where: { product_id: product.id, size_id: s.size_id } }
        );
      }
    }

    const parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors;
    if (Array.isArray(parsedColors) && parsedColors.length > 0) {
      await product.addColors(parsedColors);
    }

    const full = await Product.findByPk(product.id, { include: PRODUCT_INCLUDES });
    res.status(201).json({ message: "Product created successfully.", product: full });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/products/:id  (admin only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const {
      name,
      description,
      price,
      discount,
      stock,
      category_id,
      material,
      brand,
      gender,
      tags,
      is_active,
      sizes,
      colors,
    } = req.body;

    if (name && name !== product.name) {
      product.slug = await generateUniqueSlug(name, product.id);
      product.name = name;
    }
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (discount !== undefined) product.discount = discount;
    if (stock !== undefined) product.stock = stock;
    if (category_id !== undefined) product.category_id = category_id || null;
    if (material !== undefined) product.material = material;
    if (brand !== undefined) product.brand = brand;
    if (gender !== undefined) product.gender = gender;
    if (tags !== undefined) product.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
    if (is_active !== undefined) product.is_active = is_active;

    await product.save();

    if (req.files && req.files.length > 0) {
      const existingCount = await ProductImage.count({ where: { product_id: product.id } });
      const images = req.files.map((file, idx) => ({
        product_id: product.id,
        image_url: `/uploads/products/${file.filename}`,
        is_primary: existingCount === 0 && idx === 0,
        sort_order: existingCount + idx,
      }));
      await ProductImage.bulkCreate(images);
    }

    const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    if (Array.isArray(parsedSizes)) {
      await product.setSizes([]);
      for (const s of parsedSizes) {
        await product.addSize(s.size_id, { through: { stock: s.stock || 0 } });
      }
    }

    const parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors;
    if (Array.isArray(parsedColors)) {
      await product.setColors(parsedColors);
    }

    const full = await Product.findByPk(product.id, { include: PRODUCT_INCLUDES });
    res.json({ message: "Product updated successfully.", product: full });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/products/:id  (admin only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, { include: PRODUCT_INCLUDES });
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Remove image files from disk
    for (const img of product.images || []) {
      const filePath = path.join(__dirname, "..", img.image_url);
      fs.unlink(filePath, () => {});
    }

    await product.destroy();
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/products/:id/images/:imageId
const deleteProductImage = async (req, res, next) => {
  try {
    const image = await ProductImage.findOne({
      where: { id: req.params.imageId, product_id: req.params.id },
    });
    if (!image) return res.status(404).json({ message: "Image not found." });

    const filePath = path.join(__dirname, "..", image.image_url);
    fs.unlink(filePath, () => {});
    await image.destroy();
    res.json({ message: "Image removed." });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/products  (admin only — includes inactive products, no pagination cap)
const getAllProductsAdmin = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: PRODUCT_INCLUDES,
      order: [["createdAt", "DESC"]],
      distinct: true,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    res.json({
      products: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, total_pages: Math.ceil(count / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getSearchSuggestions,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getAllProductsAdmin,
};
