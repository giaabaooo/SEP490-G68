const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const categoryController = require("../controllers/category.controller");

router.use(auth);
router.use(authorize(["admin"]));

router.get("/", categoryController.getCategories);
router.post("/", categoryController.createCategory);
router.get("/:id", categoryController.getCategoryById);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
