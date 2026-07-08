const User = require("../models/User");

// ===== GET ALL USERS =====
// GET /api/admin/users?search=&role=&status=&page=1&limit=10
exports.getUsers = async (req, res) => {
    try {
        const {
            search = "",
            role,
            status,
            page = 1,
            limit = 10,
        } = req.query;

        const query = {};

        // Search theo fullName hoặc email
        if (search.trim()) {
            query.$or = [
                { fullName: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
            ];
        }

        // Filter role
        if (role && ["admin", "candidate", "business"].includes(role)) {
            query.role = role;
        }

        // Filter status
        if (status && ["active", "banned", "pending"].includes(status)) {
            query.status = status;
        }

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        const [users, total] = await Promise.all([
            User.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            User.countDocuments(query),
        ]);

        res.json({
            message: "Lấy danh sách người dùng thành công",
            users,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            message: error.message || "Lỗi lấy danh sách người dùng",
        });
    }
};

// ===== GET USER DETAIL =====
// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        res.json({
            message: "Lấy thông tin người dùng thành công",
            user,
        });
    } catch (error) {
        console.error("Get user detail error:", error);
        res.status(500).json({
            message: error.message || "Lỗi lấy thông tin người dùng",
        });
    }
};

// ===== UPDATE USER INFO =====
// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            address,
            companyName,
            website,
            companySize,
            title,
            aboutMe,
            skills,
            avatar,
            cvUrl,
        } = req.body;

        const updateData = {};

        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (companyName !== undefined) updateData.companyName = companyName;
        if (website !== undefined) updateData.website = website;
        if (companySize !== undefined) updateData.companySize = companySize;
        if (title !== undefined) updateData.title = title;
        if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
        if (skills !== undefined) updateData.skills = skills;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (cvUrl !== undefined) updateData.cvUrl = cvUrl;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        res.json({
            message: "Cập nhật người dùng thành công",
            user,
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            message: error.message || "Lỗi cập nhật người dùng",
        });
    }
};

// ===== UPDATE USER STATUS =====
// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["active", "banned", "pending"].includes(status)) {
            return res.status(400).json({
                message: "Trạng thái không hợp lệ. Chỉ chấp nhận active, banned hoặc pending",
            });
        }

        // Không cho admin tự khóa chính mình
        if (req.params.id === req.user.id && status === "banned") {
            return res.status(400).json({
                message: "Bạn không thể tự khóa tài khoản của chính mình",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        res.json({
            message:
                status === "banned"
                    ? "Khóa tài khoản thành công"
                    : "Cập nhật trạng thái tài khoản thành công",
            user,
        });
    } catch (error) {
        console.error("Update user status error:", error);
        res.status(500).json({
            message: error.message || "Lỗi cập nhật trạng thái tài khoản",
        });
    }
};

// ===== UPDATE USER ROLE =====
// PATCH /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!["admin", "candidate", "business"].includes(role)) {
            return res.status(400).json({
                message: "Vai trò không hợp lệ. Chỉ chấp nhận admin, candidate hoặc business",
            });
        }

        // Không cho admin tự hạ quyền chính mình
        if (req.params.id === req.user.id && role !== "admin") {
            return res.status(400).json({
                message: "Bạn không thể tự thay đổi quyền admin của chính mình",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { role } },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        res.json({
            message: "Phân quyền người dùng thành công",
            user,
        });
    } catch (error) {
        console.error("Update user role error:", error);
        res.status(500).json({
            message: error.message || "Lỗi phân quyền người dùng",
        });
    }
};