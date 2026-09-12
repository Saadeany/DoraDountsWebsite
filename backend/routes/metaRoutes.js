const express = require("express");
const router = express.Router();
const { getFilterOptions } = require("../controllers/metaController");

router.get("/filters", getFilterOptions);

module.exports = router;
