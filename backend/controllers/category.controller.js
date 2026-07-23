const Category = require("../models/Category");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

exports.getCategories = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = search?.trim()
      ? {
          $or: [
            { name: { $regex: search.trim(), $options: "i" } },
            { slug: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
          ],
        }
      : {};

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Category.countDocuments(query),
    ]);

    res.json({
      message: "Lấy danh sách ngành nghề thành công",
      categories,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: error.message || "Lỗi lấy danh sách ngành nghề" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Ngành nghề không tồn tại" });
    }

    res.json({ message: "Lấy chi tiết ngành nghề thành công", category });
  } catch (error) {
    console.error("Get category detail error:", error);
    res.status(500).json({ message: error.message || "Lỗi lấy chi tiết ngành nghề" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, isActive, sortOrder } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Tên ngành nghề là bắt buộc" });
    }

    const finalSlug = (slug?.trim() || name).trim();
    const normalizedSlug = slugify(finalSlug);

    if (!normalizedSlug) {
      return res.status(400).json({ message: "Slug không hợp lệ" });
    }

    const exists = await Category.findOne({ $or: [{ name: name.trim() }, { slug: normalizedSlug }] });
    if (exists) {
      return res.status(409).json({ message: "Tên hoặc slug ngành nghề đã tồn tại" });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: normalizedSlug,
      description: description?.trim() || "",
      icon: icon?.trim() || "",
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    });

    res.status(201).json({ message: "Tạo ngành nghề thành công", category });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: error.message || "Lỗi tạo ngành nghề" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, isActive, sortOrder } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Ngành nghề không tồn tại" });
    }

    const normalizedSlug = slugify(slug?.trim() || name?.trim() || category.slug);

    if (!normalizedSlug) {
      return res.status(400).json({ message: "Slug không hợp lệ" });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      $or: [{ name: name?.trim() || category.name }, { slug: normalizedSlug }],
    });

    if (duplicate) {
      return res.status(409).json({ message: "Tên hoặc slug ngành nghề đã tồn tại" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: name?.trim() || category.name,
          slug: normalizedSlug,
          description: description !== undefined ? description.trim() : category.description,
          icon: icon !== undefined ? icon.trim() : category.icon,
          isActive: isActive !== undefined ? isActive : category.isActive,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : category.sortOrder,
        },
      },
      { new: true, runValidators: true }
    );

    res.json({ message: "Cập nhật ngành nghề thành công", category: updatedCategory });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: error.message || "Lỗi cập nhật ngành nghề" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Ngành nghề không tồn tại" });
    }

    res.json({ message: "Xóa ngành nghề thành công" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: error.message || "Lỗi xóa ngành nghề" });
  }
};
