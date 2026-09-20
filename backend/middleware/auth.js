import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Please log in again.",
    });
  }

  try {
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    req.user = { id: token_decode.id, role: token_decode.role || 'user' };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    } else {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
  }
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'user';
    const normalizedRole = (userRole === 'admin') ? 'manager' : userRole;
    const normalizedAllowed = allowedRoles.map(r => r === 'admin' ? 'manager' : r);

    if (!normalizedAllowed.includes(normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Tindakan ini membutuhkan hak akses Manager / Owner."
      });
    }
    next();
  };
};

export default authMiddleware;