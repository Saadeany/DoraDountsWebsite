const { Sequelize } = require("sequelize");
require("dotenv").config();

// ── MySQL 8 compatibility notes ───────────────────────────────────────────
// • Default auth plugin in MySQL 8 is caching_sha2_password (not mysql_native_password).
//   mysql2 ≥ 3 supports it natively; no extra flags needed when the user was
//   created with caching_sha2_password.
// • ssl is set to false for local dev. In production set DB_SSL=true to enable
//   TLS (required by most managed MySQL 8 providers).
// • timezone: "+02:00" matches Egypt Standard Time.  Change to "Z" for UTC or
//   whatever your production DB server is set to.
// • charset and collation are forced to utf8mb4 / utf8mb4_0900_ai_ci (MySQL 8
//   default collation) so Arabic product names / descriptions are stored safely.
// ─────────────────────────────────────────────────────────────────────────

const useSSL = process.env.DB_SSL === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? false : false,

    // ── MySQL 8 specific ──────────────────────────────────────────────────
    dialectOptions: {
      // Forces utf8mb4 at the connection level (critical for emoji / Arabic)
      charset: "utf8mb4",
      // SSL: leave empty object for local; set ca/cert/key strings for production
      ...(useSSL
        ? {
            ssl: {
              rejectUnauthorized: true,
              // In production, load the CA cert:
              // ca: require("fs").readFileSync(process.env.DB_SSL_CA),
            },
          }
        : {}),
      // mysql2 will negotiate caching_sha2_password automatically;
      // this line is a no-op safeguard kept for documentation clarity.
      connectTimeout: 20000,
    },

    // Store dates as UTC in the DB, read them back as UTC
    timezone: "+00:00",

    define: {
      timestamps: true,
      underscored: true,
      // Explicit charset/collation on every table DDL
      charset: "utf8mb4",
      collate: "utf8mb4_0900_ai_ci",
    },

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // Confirm the exact server version on startup so misconfiguration is obvious
    const [[{ version }]] = await sequelize.query("SELECT VERSION() AS version");
    const major = parseInt(version.split(".")[0], 10);
    if (major < 8) {
      console.error(
        `❌ MySQL ${version} detected — Felt & Form requires MySQL 8.0 or higher.`
      );
      process.exit(1);
    }
    console.log(`✅ MySQL ${version} connected (pool max: 10)`);
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
