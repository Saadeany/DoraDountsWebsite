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
  Size,
  Color,
  Order,
  OrderItem,
  Review,
  Coupon,
  Zone,
} = require("./models");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD_PLAIN;
const isProd = process.env.NODE_ENV === "production";

const { savePlaceholderImage } = require("./utils/generatePlaceholder");
const generateOrderNumber = require("./utils/generateOrderNumber");

const productsUploadDir = path.join(__dirname, "uploads", "products");
const categoriesUploadDir = path.join(__dirname, "uploads", "categories");
fs.mkdirSync(productsUploadDir, { recursive: true });
fs.mkdirSync(categoriesUploadDir, { recursive: true });

const SIZE_LIST = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const COLOR_LIST = [
  { name: "Black", hex_code: "#1A1A1A" },
  { name: "White", hex_code: "#F7F5F0" },
  { name: "Beige", hex_code: "#D8C9AE" },
  { name: "Grey", hex_code: "#8A8A8A" },
  { name: "Charcoal", hex_code: "#3B3B3B" },
  { name: "Navy", hex_code: "#23344D" },
  { name: "Olive", hex_code: "#5C5F45" },
  { name: "Brown", hex_code: "#6B4A33" },
  { name: "Cream", hex_code: "#EFE6D6" },
  { name: "Stone", hex_code: "#A89F8E" },
];

const CATEGORY_LIST = [
  { name: "Men", description: "Everyday essentials and statement pieces, cut for the modern man." },
  { name: "Women", description: "Considered silhouettes and soft fabrics, designed to move with you." },
  { name: "Hoodies", description: "Heavyweight fleece, brushed interiors, built for year-round layering." },
  { name: "T-Shirts", description: "The foundation of the wardrobe — premium cotton, honest fit." },
  { name: "Pants", description: "Tailored, relaxed, and everything in between." },
  { name: "Oversized", description: "Dropped shoulders, generous cuts, deliberately undone." },
  { name: "Accessories", description: "The small details that finish a look." },
];

// Starter delivery zones — Cairo areas the store can/can't ship to, and
// the shipping price per area. Edit freely from Admin > Zones after seeding.
const ZONE_LIST = [
  { name: "Nasr City",       shipping_price: 60, is_deliverable: true,  sort_order: 1 },
  { name: "Masr El Gedida",  shipping_price: 60, is_deliverable: true,  sort_order: 2 },
  { name: "Zahraa El Maadi", shipping_price: 70, is_deliverable: true,  sort_order: 3 },
  { name: "Maadi",           shipping_price: 70, is_deliverable: true,  sort_order: 4 },
  { name: "Downtown Cairo",  shipping_price: 60, is_deliverable: true,  sort_order: 5 },
  { name: "Zamalek",         shipping_price: 65, is_deliverable: true,  sort_order: 6 },
  { name: "6th of October",  shipping_price: 90, is_deliverable: false, sort_order: 7 },
  { name: "New Cairo",       shipping_price: 80, is_deliverable: true,  sort_order: 8 },
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const ACCESSORY_SIZES = ["One Size"];

// 33 products spanning every category, each with realistic Egyptian-market pricing in EGP.
const PRODUCT_CATALOG = [
  // ---- T-Shirts (Men) ----
  { name: "Essential Crew Neck Tee", category: "T-Shirts", gender: "men", price: 380, discount: 0, stock: 60, material: "100% Combed Cotton", colors: ["Black", "White", "Stone"], sizes: APPAREL_SIZES, tags: ["best_seller"], description: "A heavyweight 220gsm crew neck built to hold its shape wash after wash. The everyday tee, done properly." },
  { name: "Heavyweight Pocket Tee", category: "T-Shirts", gender: "men", price: 420, discount: 10, stock: 45, material: "100% Cotton", colors: ["Charcoal", "Olive", "Black"], sizes: APPAREL_SIZES, tags: ["sale", "trending"], description: "A boxier take on the classic tee with a structured chest pocket and reinforced collar seam." },
  { name: "Ribbed Henley Tee", category: "T-Shirts", gender: "men", price: 460, discount: 0, stock: 38, material: "Cotton-Modal Blend", colors: ["Brown", "Black"], sizes: APPAREL_SIZES, tags: ["new"], description: "A three-button henley in a soft ribbed knit that drapes close without clinging." },
  { name: "Striped Boxy Tee", category: "T-Shirts", gender: "men", price: 400, discount: 0, stock: 50, material: "100% Cotton", colors: ["Navy", "White"], sizes: APPAREL_SIZES, tags: [], description: "Fine horizontal stripes on a slightly boxy block, finished with a dropped hem." },
  { name: "Graphic Logo Tee", category: "T-Shirts", gender: "men", price: 450, discount: 0, stock: 55, material: "100% Cotton", colors: ["Black", "Beige"], sizes: APPAREL_SIZES, tags: ["best_seller", "trending"], description: "Our house wordmark, screen-printed in puff ink across the chest." },

  // ---- T-Shirts (Women) ----
  { name: "Fitted Crop Tee", category: "T-Shirts", gender: "women", price: 360, discount: 0, stock: 40, material: "Cotton-Lycra Blend", colors: ["White", "Black", "Cream"], sizes: APPAREL_SIZES, tags: ["new"], description: "A cropped length with just enough stretch to keep its shape through the day." },
  { name: "Relaxed V-Neck Tee", category: "T-Shirts", gender: "women", price: 390, discount: 15, stock: 33, material: "100% Cotton", colors: ["Beige", "Grey"], sizes: APPAREL_SIZES, tags: ["sale"], description: "A relaxed-fit V-neck in brushed cotton, soft enough to wear on repeat." },
  { name: "Ribbed Tank Tee", category: "T-Shirts", gender: "women", price: 340, discount: 0, stock: 47, material: "Cotton-Modal Blend", colors: ["Black", "White", "Stone"], sizes: APPAREL_SIZES, tags: ["best_seller"], description: "A fine-rib tank built for layering or wearing solo in the heat." },

  // ---- Hoodies ----
  { name: "Classic Pullover Hoodie", category: "Hoodies", gender: "unisex", price: 950, discount: 0, stock: 42, material: "Brushed Fleece Cotton", colors: ["Black", "Grey", "Navy"], sizes: APPAREL_SIZES, tags: ["best_seller", "trending"], description: "Our signature 400gsm fleece hoodie — brushed inside, structured outside, built to last seasons." },
  { name: "Oversized Zip Hoodie", category: "Hoodies", gender: "unisex", price: 1100, discount: 0, stock: 30, material: "Heavyweight Fleece", colors: ["Charcoal", "Olive"], sizes: APPAREL_SIZES, tags: ["new", "trending"], description: "A dropped-shoulder zip hoodie with an oversized hood and kangaroo pocket." },
  { name: "Fleece-Lined Hoodie", category: "Hoodies", gender: "men", price: 1050, discount: 20, stock: 25, material: "Cotton-Poly Fleece", colors: ["Black", "Stone"], sizes: APPAREL_SIZES, tags: ["sale"], description: "Sherpa-lined hood and pocket for the colder months, without the bulk." },
  { name: "Cropped Hoodie", category: "Hoodies", gender: "women", price: 880, discount: 0, stock: 36, material: "Brushed Fleece Cotton", colors: ["Beige", "Black", "Cream"], sizes: APPAREL_SIZES, tags: ["new"], description: "A cropped silhouette with raw-cut hem and ribbed cuffs." },
  { name: "Graphic Back-Print Hoodie", category: "Hoodies", gender: "unisex", price: 980, discount: 0, stock: 28, material: "Heavyweight Fleece", colors: ["Black", "Navy"], sizes: APPAREL_SIZES, tags: ["best_seller"], description: "An oversized back print on our heaviest fleece base." },
  { name: "Half-Zip Heavyweight Hoodie", category: "Hoodies", gender: "men", price: 1150, discount: 0, stock: 22, material: "Brushed Fleece Cotton", colors: ["Olive", "Charcoal"], sizes: APPAREL_SIZES, tags: ["trending"], description: "A half-zip funnel neck for layering days when a full hoodie is too much." },

  // ---- Oversized ----
  { name: "Oversized Boxy Tee", category: "Oversized", gender: "unisex", price: 470, discount: 0, stock: 50, material: "100% Cotton", colors: ["Black", "White", "Stone"], sizes: APPAREL_SIZES, tags: ["best_seller"], description: "A dropped shoulder and squared hem for an intentionally undone fit." },
  { name: "Oversized Drop-Shoulder Sweatshirt", category: "Oversized", gender: "unisex", price: 890, discount: 0, stock: 34, material: "French Terry Cotton", colors: ["Grey", "Beige"], sizes: APPAREL_SIZES, tags: ["new", "trending"], description: "Raw-edge ribbing and a deep drop shoulder, in soft French terry." },
  { name: "Oversized Denim Shirt", category: "Oversized", gender: "unisex", price: 1050, discount: 10, stock: 20, material: "Washed Denim", colors: ["Navy", "Black"], sizes: APPAREL_SIZES, tags: ["sale"], description: "A worn-in denim overshirt cut several sizes large, on purpose." },
  { name: "Oversized Cargo Jacket", category: "Oversized", gender: "unisex", price: 1450, discount: 0, stock: 18, material: "Cotton Canvas", colors: ["Olive", "Black"], sizes: APPAREL_SIZES, tags: ["new"], description: "A boxy field jacket with utility pockets and an adjustable drawcord hem." },

  // ---- Pants ----
  { name: "Tapered Cargo Pants", category: "Pants", gender: "men", price: 850, discount: 0, stock: 32, material: "Cotton Twill", colors: ["Black", "Olive", "Stone"], sizes: APPAREL_SIZES, tags: ["best_seller"], description: "Six-pocket cargos with a tapered leg so the silhouette stays clean." },
  { name: "Relaxed Fit Sweatpants", category: "Pants", gender: "unisex", price: 700, discount: 0, stock: 48, material: "Brushed Fleece Cotton", colors: ["Grey", "Black", "Navy"], sizes: APPAREL_SIZES, tags: ["trending"], description: "An elastic waist and tapered ankle cuff, our most-worn pant in-house." },
  { name: "Straight Leg Denim", category: "Pants", gender: "men", price: 950, discount: 15, stock: 27, material: "Rigid Denim", colors: ["Navy", "Black"], sizes: APPAREL_SIZES, tags: ["sale"], description: "A mid-rise straight leg in rigid denim that breaks in with wear." },
  { name: "Wide Leg Trousers", category: "Pants", gender: "women", price: 880, discount: 0, stock: 30, material: "Linen-Cotton Blend", colors: ["Cream", "Black", "Beige"], sizes: APPAREL_SIZES, tags: ["new"], description: "A high-waisted, wide-leg trouser with a fluid drape for warm days." },
  { name: "Jogger Pants with Ribbed Cuffs", category: "Pants", gender: "unisex", price: 750, discount: 0, stock: 40, material: "Cotton-Poly Fleece", colors: ["Black", "Charcoal"], sizes: APPAREL_SIZES, tags: [], description: "A tapered jogger with ribbed cuffs and a zip side pocket." },

  // ---- Accessories ----
  { name: "Embroidered Logo Cap", category: "Accessories", gender: "unisex", price: 320, discount: 0, stock: 70, material: "Cotton Twill", colors: ["Black", "Beige", "Navy"], sizes: ACCESSORY_SIZES, tags: ["best_seller"], description: "A structured six-panel cap with embroidered logo and adjustable strap." },
  { name: "Ribbed Beanie", category: "Accessories", gender: "unisex", price: 280, discount: 0, stock: 65, material: "Acrylic-Wool Blend", colors: ["Black", "Grey", "Olive"], sizes: ACCESSORY_SIZES, tags: ["new"], description: "A double-layer ribbed knit beanie for cold mornings." },
  { name: "Canvas Tote Bag", category: "Accessories", gender: "unisex", price: 350, discount: 0, stock: 55, material: "Heavy Cotton Canvas", colors: ["Beige", "Black"], sizes: ACCESSORY_SIZES, tags: [], description: "A roomy tote in heavyweight canvas with reinforced handles." },
  { name: "Leather Belt", category: "Accessories", gender: "men", price: 450, discount: 0, stock: 40, material: "Genuine Leather", colors: ["Brown", "Black"], sizes: ACCESSORY_SIZES, tags: ["trending"], description: "A full-grain leather belt with a matte brushed buckle." },
  { name: "Crew Socks (3-Pack)", category: "Accessories", gender: "unisex", price: 220, discount: 0, stock: 80, material: "Cotton Blend", colors: ["Black", "White", "Grey"], sizes: ACCESSORY_SIZES, tags: [], description: "Three pairs of cushioned crew socks with reinforced heel and toe." },

  // ---- Women extras ----
  { name: "Satin Slip Dress", category: "Women", gender: "women", price: 1200, discount: 0, stock: 20, material: "Satin Viscose", colors: ["Black", "Cream"], sizes: APPAREL_SIZES, tags: ["new", "trending"], description: "A bias-cut slip dress that falls cleanly from a thin adjustable strap." },
  { name: "Oversized Knit Cardigan", category: "Women", gender: "women", price: 980, discount: 0, stock: 24, material: "Wool-Acrylic Blend", colors: ["Beige", "Brown"], sizes: APPAREL_SIZES, tags: ["best_seller"], description: "A chunky knit cardigan with horn buttons and dropped shoulders." },
  { name: "High-Waist Wide Pants", category: "Women", gender: "women", price: 890, discount: 12, stock: 28, material: "Crepe Polyester", colors: ["Black", "Stone"], sizes: APPAREL_SIZES, tags: ["sale"], description: "A fluid, high-waisted trouser with a clean wide leg and hidden side zip." },

  // ---- Men extras ----
  { name: "Quarter-Zip Pullover", category: "Men", gender: "men", price: 920, discount: 0, stock: 26, material: "Cotton-Wool Blend", colors: ["Navy", "Charcoal"], sizes: APPAREL_SIZES, tags: ["new"], description: "A textured knit quarter-zip layered for shoulder-season weather." },
  { name: "Utility Vest", category: "Men", gender: "men", price: 880, discount: 0, stock: 22, material: "Cotton Canvas", colors: ["Olive", "Black"], sizes: APPAREL_SIZES, tags: ["trending"], description: "A multi-pocket utility vest, cut to layer over tees and hoodies alike." },
];

const seed = async () => {
  try {
    console.log("⏳ Syncing database schema (this drops and recreates all tables)...");
    await sequelize.sync({ force: true });

    console.log("⏳ Seeding sizes...");
    const sizeRecords = {};
    for (let i = 0; i < SIZE_LIST.length; i++) {
      const size = await Size.create({ name: SIZE_LIST[i], sort_order: i });
      sizeRecords[size.name] = size;
    }

    console.log("⏳ Seeding colors...");
    const colorRecords = {};
    for (const c of COLOR_LIST) {
      const color = await Color.create(c);
      colorRecords[color.name] = color;
    }

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
      first_name: "Store",
      last_name: "Admin",
      email: ADMIN_EMAIL,
      password: adminPassword,
      role: "admin",
    });

    // Demo customer only exists in local/dev seeding — never created in production,
    // so there's no publicly-known credential pair that can reach production data.
    let demoCustomer = null;
    if (!isProd) {
      const demoPassword = await bcrypt.hash("Customer@123", 12);
      demoCustomer = await User.create({
        first_name: "Demo",
        last_name: "Customer",
        email: "customer@feltandform.com",
        password: demoPassword,
        role: "customer",
        phone: "+201000000000",
      });
    }

    console.log("⏳ Seeding products (this includes generating placeholder images)...");
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
        material: item.material,
        gender: item.gender,
        tags: item.tags,
      });

      // 2 placeholder images per product (primary + detail shot)
      for (let i = 0; i < 2; i++) {
        const filename = savePlaceholderImage(productsUploadDir, item.name, `p${product.id}-${imgSeed++}`);
        await ProductImage.create({
          product_id: product.id,
          image_url: `/uploads/products/${filename}`,
          is_primary: i === 0,
          sort_order: i,
        });
      }

      // Distribute total stock evenly across sizes
      const perSizeStock = Math.max(Math.floor(item.stock / item.sizes.length), 1);
      for (const sizeName of item.sizes) {
        await product.addSize(sizeRecords[sizeName].id, { through: { stock: perSizeStock } });
      }

      await product.addColors(item.colors.map((c) => colorRecords[c].id));
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
      code: "FORM20",
      discount: 20,
      start_date: toDateOnly(today),
      expiry_date: toDateOnly(inOneMonth),
      usage_limit: 200,
    });

    console.log("⏳ Seeding a sample delivered order + review for the demo customer...");
    const sampleProduct = await Product.findOne({ where: { name: "Essential Crew Neck Tee" } });
    const nasrCityZone = await Zone.findOne({ where: { name: "Nasr City" } });
    const order = await Order.create({
      order_number: generateOrderNumber(),
      user_id: demoCustomer.id,
      subtotal: sampleProduct.price,
      discount_amount: 0,
      tax: parseFloat((sampleProduct.price * 0.14).toFixed(2)),
      shipping_cost: nasrCityZone ? nasrCityZone.shipping_price : 60,
      total_amount: parseFloat((sampleProduct.price * 1.14 + (nasrCityZone ? parseFloat(nasrCityZone.shipping_price) : 60)).toFixed(2)),
      status: "delivered",
      payment_method: "cash_on_delivery",
      payment_status: "paid",
      shipping_full_name: "Demo Customer",
      shipping_phone: "+201000000000",
      shipping_email: "customer@feltandform.com",
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
      size: "M",
      color: "Black",
      quantity: 1,
      price: sampleProduct.price,
    });
    await Review.create({
      user_id: demoCustomer.id,
      product_id: sampleProduct.id,
      rating: 5,
      comment: "Fits true to size and the fabric feels noticeably heavier than other tees I own. Repurchasing in two more colors.",
    });

    console.log("\n✅ Seed complete!");
    console.log("----------------------------------------------------");
    console.log(`Categories: ${CATEGORY_LIST.length}`);
    console.log(`Products:   ${PRODUCT_CATALOG.length}`);
    console.log(`Sizes:      ${SIZE_LIST.length}`);
    console.log(`Colors:     ${COLOR_LIST.length}`);
    console.log(`Zones:      ${ZONE_LIST.length}`);
    console.log(`Coupons:    WELCOME10 (10%), FORM20 (20%)`);
    console.log("----------------------------------------------------");
    console.log("Admin login:");
    console.log(`  email:    ${admin.email}`);
    console.log(`  password: ${process.env.SEED_ADMIN_PASSWORD || "Admin@12345"}`);
    console.log("Demo customer login:");
    console.log(`  email:    ${demoCustomer.email}`);
    console.log(`  password: Customer@123`);
    console.log("----------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
