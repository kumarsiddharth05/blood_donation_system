/**
 * Middleware factory: Checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER verifyToken middleware.
 * @param {...string} roles - Allowed role strings ('admin', 'donor', 'recipient')
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User not authenticated.',
        data: null,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        data: null,
      });
    }

    next();
  };
};

module.exports = checkRole;
