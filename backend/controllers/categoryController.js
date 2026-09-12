const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { Category, Product } = require("../models");

// @route GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [["name", "ASC"]] });
    res.json({ categories });
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
    const existing = await Category.findOne({ where });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
};

// @route POST /api/admin/categories (admin only)
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required." });

    const slug = await generateUniqueSlug(name);
    const category = await Category.create({
      name,
      slug,
      description,
      image: req.file ? `/uploads/categories/${req.file.filename}` : null,
    });
    res.status(201).json({ message: "Category created.", category });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/categories/:id (admin only)
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });

    const { name, description } = req.body;
    if (name && name !== category.name) {
      category.slug = await generateUniqueSlug(name, category.id);
      category.name = name;
    }
    if (description !== undefined) category.description = description;
    if (req.file) {
      if (category.image) {
        fs.unlink(path.join(__dirname, "..", category.image), () => {});
      }
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    await category.save();
    res.json({ message: "Category updated.", category });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/categories/:id (admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });

    const productCount = await Product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) are still assigned to this category. Reassign them first.`,
      });
    }

    if (category.image) {
      fs.unlink(path.join(__dirname, "..", category.image), () => {});
    }
    await category.destroy();
    res.json({ message: "Category deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
