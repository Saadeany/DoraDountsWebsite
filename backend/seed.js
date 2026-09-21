require("dotenv").config();
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");

const {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  Order,
  OrderItem,
  Review,
  Coupon,
  Zone,
} = require("./models");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@doradonuts.com";
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD_PLAIN || process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
const isProd = process.env.NODE_ENV === "production";

const { savePlaceholderImage } = require("./utils/generatePlaceholder");
const generateOrderNumber = require("./utils/generateOrderNumber");

const productsUploadDir = path.join(__dirname, "uploads", "products");
const categoriesUploadDir = path.join(__dirname, "uploads", "categories");
fs.mkdirSync(productsUploadDir, { recursive: true });
fs.mkdirSync(categoriesUploadDir, { recursive: true });

// Category names kept exactly as spelled in the current build; add more
// bakery categories here any time without touching the schema.
const CATEGORY_LIST = [
  { name: "Donut",  description: "Freshly fried, glazed and filled donuts made daily." },
  { name: "Muffin", description: "Soft-baked muffins in classic and seasonal flavors." },
  { name: "Waffle", description: "Warm, crisp-edged waffles topped to order." },
  { name: "Pastry", description: "Laminated and cream-filled pastries baked fresh each morning." },
];

const ZONE_LIST = [
  { name: "Nasr City",       shipping_price: 30, is_deliverable: true,  sort_order: 1 },
  { name: "Masr El Gedida",  shipping_price: 30, is_deliverable: true,  sort_order: 2 },
  { name: "Zahraa El Maadi", shipping_price: 40, is_deliverable: true,  sort_order: 3 },
  { name: "Maadi",           shipping_price: 40, is_deliverable: true,  sort_order: 4 },
  { name: "Downtown Cairo",  shipping_price: 35, is_deliverable: true,  sort_order: 5 },
  { name: "Zamalek",         shipping_price: 35, is_deliverable: true,  sort_order: 6 },
  { name: "6th of October",  shipping_price: 60, is_deliverable: false, sort_order: 7 },
  { name: "New Cairo",       shipping_price: 50, is_deliverable: true,  sort_order: 8 },
];

// Realistic EGP bakery pricing. No sizes/colors — each product is a single,
// complete item (a donut, a muffin, a waffle, a pastry).
const PRODUCT_CATALOG = [
  // ---- Donut ----
  { name: "Classic Sugar Donut",   category: "Donut", price: 35, discount: 0,  stock: 120, tags: ["best_seller"], description: "Our original fried donut, hand-rolled in cinnamon sugar while still warm." },
  { name: "Chocolate Donut",       category: "Donut", price: 40, discount: 0,  stock: 100, tags: ["best_seller", "trending"], description: "Dipped in rich chocolate glaze and finished with a chocolate drizzle." },
  { name: "Strawberry Donut",      category: "Donut", price: 40, discount: 0,  stock: 90,  tags: ["new"], description: "Pink strawberry glaze with a light strawberry filling." },
  { name: "Lotus Donut",           category: "Donut", price: 55, discount: 0,  stock: 60,  tags: ["best_seller", "trending"], description: "Topped with Lotus Biscoff spread and crushed biscuit crumble." },
  { name: "Vanilla Glazed Donut",  category: "Donut", price: 35, discount: 0,  stock: 100, tags: [], description: "A simple, glossy vanilla glaze over our classic fried dough." },
  { name: "Kinder Donut",          category: "Donut", price: 60, discount: 10, stock: 50,  tags: ["sale", "trending"], description: "Filled with Kinder chocolate cream and topped with crushed Kinder pieces." },
  { name: "Pistachio Donut",       category: "Donut", price: 65, discount: 0,  stock: 40,  tags: ["new"], description: "Pistachio glaze finished with roasted pistachio crumbs." },
  { name: "Nutella Filled Donut",  category: "Donut", price: 55, discount: 0,  stock: 55,  tags: ["best_seller"], description: "Piped full of Nutella, dusted with powdered sugar." },

  // ---- Muffin ----
  { name: "Chocolate Muffin",   category: "Muffin", price: 60, discount: 0,  stock: 45, tags: ["best_seller"], description: "A moist double-chocolate muffin loaded with chocolate chips." },
  { name: "Blueberry Muffin",   category: "Muffin", price: 60, discount: 0,  stock: 45, tags: ["trending"], description: "Studded with real blueberries and topped with a light sugar crumble." },
  { name: "Vanilla Muffin",     category: "Muffin", price: 55, discount: 0,  stock: 40, tags: [], description: "A classic vanilla bean muffin with a golden domed top." },
  { name: "Banana Walnut Muffin", category: "Muffin", price: 65, discount: 0, stock: 30, tags: ["new"], description: "Ripe banana batter folded with toasted walnuts." },

  // ---- Waffle ----
  { name: "Classic Waffle",     category: "Waffle", price: 70,  discount: 0,  stock: 35, tags: ["best_seller"], description: "A crisp Belgian-style waffle served with maple syrup and butter." },
  { name: "Chocolate Waffle",   category: "Waffle", price: 85,  discount: 0,  stock: 30, tags: ["trending"], description: "Topped with warm chocolate sauce and chocolate shavings." },
  { name: "Strawberry Waffle",  category: "Waffle", price: 90,  discount: 0,  stock: 25, tags: ["new"], description: "Fresh strawberry slices, whipped cream, and strawberry syrup." },
  { name: "Lotus Waffle",       category: "Waffle", price: 95,  discount: 15, stock: 25, tags: ["sale", "best_seller"], description: "Lotus spread, crushed biscuits, and a scoop of vanilla drizzle." },

  // ---- Pastry ----
  { name: "Chocolate Pastry",   category: "Pastry", price: 50, discount: 0, stock: 40, tags: ["best_seller"], description: "Flaky laminated pastry wrapped around a warm chocolate center." },
  { name: "Croissant",          category: "Pastry", price: 45, discount: 0, stock: 50, tags: ["best_seller", "trending"], description: "A buttery, all-butter croissant baked fresh every morning." },
  { name: "Cinnamon Pastry",    category: "Pastry", price: 55, discount: 0, stock: 35, tags: ["new"], description: "Rolled with cinnamon sugar and finished with a sweet glaze icing." },
  { name: "Cream Pastry",       category: "Pastry", price: 60, discount: 0, stock: 30, tags: [], description: "Light pastry layers filled with vanilla pastry cream." },
];

const seed = async () => {
  try {
    console.log("⏳ Syncing database schema (this drops and recreates all tables)...");
    await sequelize.sync({ force: true });

    console.log("⏳ Seeding categories...");
    const categoryRecords = {};
    for (let i = 0; i < CATEGORY_LIST.length; i++) {
      const cat = CATEGORY_LIST[i];
      const slug = slugify(cat.name, { lower: true, strict: true });
      const filename = savePlaceholderImage(categoriesUploadDir, cat.name, `cat-${i}`);
      const category = await Category.create({
        name: cat.name,
        slug,
        description: cat.description,
        image: `/uploads/categories/${filename}`,
      });
      categoryRecords[cat.name] = category;
    }

    console.log("⏳ Seeding delivery zones...");
    for (const z of ZONE_LIST) {
      await Zone.create(z);
    }

    console.log("⏳ Seeding admin account...");
    const adminPassword = await bcrypt.hash(ADMIN_PASSWORD_PLAIN, 12);
    const admin = await User.create({
      first_name: "Dora",
      last_name: "Admin",
      email: ADMIN_EMAIL,
      password: adminPassword,
      role: "admin",
      is_email_verified: true,
    });

    // Demo customer only exists in local/dev seeding.
    let demoCustomer = null;
    if (!isProd) {
      const demoPassword = await bcrypt.hash("Customer@123", 12);
      demoCustomer = await User.create({
        first_name: "Demo",
        last_name: "Customer",
        email: "customer@doradonuts.com",
        password: demoPassword,
        role: "customer",
        phone: "+201000000000",
        is_email_verified: true,
      });
    }

    console.log("⏳ Seeding products...");
    let imgSeed = 0;
    for (const item of PRODUCT_CATALOG) {
      const slug = slugify(item.name, { lower: true, strict: true });
      const product = await Product.create({
        name: item.name,
        slug,
        description: item.description,
        price: item.price,
        discount: item.discount,
        stock: item.stock,
        category_id: categoryRecords[item.category].id,
        tags: item.tags,
      });

      for (let i = 0; i < 2; i++) {
        const filename = savePlaceholderImage(productsUploadDir, item.name, `p${product.id}-${imgSeed++}`);
        await ProductImage.create({
          product_id: product.id,
          image_url: `/uploads/products/${filename}`,
          is_primary: i === 0,
          sort_order: i,
        });
      }
    }

    console.log("⏳ Seeding coupons...");
    const today = new Date();
    const inOneMonth = new Date();
    inOneMonth.setMonth(inOneMonth.getMonth() + 1);
    const toDateOnly = (d) => d.toISOString().slice(0, 10);

    await Coupon.create({
      code: "WELCOME10",
      discount: 10,
      start_date: toDateOnly(today),
      expiry_date: toDateOnly(inOneMonth),
      usage_limit: 1000,
    });
    await Coupon.create({
      code: "DORA20",
      discount: 20,
      start_date: toDateOnly(today),
      expiry_date: toDateOnly(inOneMonth),
      usage_limit: 200,
    });

    if (!isProd && demoCustomer) {
      console.log("⏳ Seeding a sample delivered order + review for the demo customer...");
      const sampleProduct = await Product.findOne({ where: { name: "Chocolate Donut" } });
      const nasrCityZone = await Zone.findOne({ where: { name: "Nasr City" } });
      const order = await Order.create({
        order_number: generateOrderNumber(),
        user_id: demoCustomer.id,
        subtotal: sampleProduct.price,
        discount_amount: 0,
        tax: parseFloat((sampleProduct.price * 0.14).toFixed(2)),
        shipping_cost: nasrCityZone ? nasrCityZone.shipping_price : 30,
        total_amount: parseFloat((sampleProduct.price * 1.14 + (nasrCityZone ? parseFloat(nasrCityZone.shipping_price) : 30)).toFixed(2)),
        status: "delivered",
        payment_method: "cash_on_delivery",
        payment_status: "paid",
        shipping_full_name: "Demo Customer",
        shipping_phone: "+201000000000",
        shipping_email: "customer@doradonuts.com",
        shipping_country: "Egypt",
        shipping_city: "Cairo",
        shipping_address: "12 Tahrir Square, Downtown",
        zone_id: nasrCityZone ? nasrCityZone.id : null,
        shipping_area: nasrCityZone ? nasrCityZone.name : null,
        shipping_building: "12",
        shipping_floor: "3",
        shipping_apartment: "8",
      });
      await OrderItem.create({
        order_id: order.id,
        product_id: sampleProduct.id,
        product_name: sampleProduct.name,
        quantity: 2,
        price: sampleProduct.price,
      });
      await Review.create({
        user_id: demoCustomer.id,
        product_id: sampleProduct.id,
        rating: 5,
        comment: "Still warm when it arrived and the glaze was perfect. Ordering again this week.",
      });
    }

    console.log("\n✅ Seed complete!");
    console.log("----------------------------------------------------");
    console.log(`Categories: ${CATEGORY_LIST.length} (Donut, Muffin, Waffle, Pastry)`);
    console.log(`Products:   ${PRODUCT_CATALOG.length}`);
    console.log(`Zones:      ${ZONE_LIST.length}`);
    console.log(`Coupons:    WELCOME10 (10%), DORA20 (20%)`);
    console.log("----------------------------------------------------");
    console.log("Admin login:");
    console.log(`  email:    ${admin.email}`);
    console.log(`  password: ${ADMIN_PASSWORD_PLAIN}`);
    if (demoCustomer) {
      console.log("Demo customer login:");
      console.log(`  email:    ${demoCustomer.email}`);
      console.log(`  password: Customer@123`);
    }
    console.log("----------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();