// Middleware kiểm tra quyền role
module.exports = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Unauthorized - No user info"
        });
      }

      // Kiểm tra role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}`
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }
  };
};
