const User = require("../models/User");

// ===== GET PROFILE =====
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại"
      });
    }

    res.json(user);

  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: error.message || "Lỗi lấy thông tin profile"
    });
  }
};

// ===== UPDATE PROFILE =====
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      address,
      avatar,
      title,
      aboutMe,
      skills,
      experience,
      education,
      cvUrl,
      companyName,
      website,
      email
    } = req.body;

    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (title !== undefined) updateData.title = title;
    if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
    if (skills !== undefined) updateData.skills = skills;
    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;
    if (cvUrl !== undefined) updateData.cvUrl = cvUrl;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (website !== undefined) updateData.website = website;

    // Không cho cập nhật email ở API này
    void email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: updateData
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại"
      });
    }

    res.json({
      message: "Cập nhật thông tin thành công",
      user
    });

  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: error.message || "Lỗi cập nhật profile"
    });
  }
};

// ===== UPLOAD AVATAR =====
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng chọn một file ảnh"
      });
    }

    // Relative static URL path to return and save
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar path in the database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: { avatar: avatarUrl }
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại"
      });
    }

    res.json({
      message: "Tải ảnh đại diện thành công",
      avatarUrl,
      user
    });

  } catch (error) {
    console.error("Upload avatar error:", error);

    res.status(500).json({
      message: error.message || "Lỗi tải ảnh đại diện lên"
    });
  }
};