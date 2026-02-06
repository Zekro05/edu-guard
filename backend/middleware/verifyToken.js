import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Token can be in cookie or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach full user info to req.user
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role || "admin", // default to admin
    };

    req.userId = decoded.id; // keep this if controllers use it
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(401).json({ message: "Unauthorized - invalid token" });
  }
};
