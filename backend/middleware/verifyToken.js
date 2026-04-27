import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ STANDARDIZED USER OBJECT
    req.user = {
      _id: decoded.id,   // 🔥 FIXED (important)
      id: decoded.id,
      role: decoded.role || "student",
    };

    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(401).json({ message: "Unauthorized - invalid token" });
  }
};