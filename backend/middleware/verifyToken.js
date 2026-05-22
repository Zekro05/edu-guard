import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    console.log("===== AUTH DEBUG =====");
    console.log("Authorization Header:", req.headers.authorization);
    console.log("Cookies:", req.cookies);

    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      _id: decoded.id,
      role: decoded.role,
      name: decoded.name || "Zekro Admin",
    };

    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};