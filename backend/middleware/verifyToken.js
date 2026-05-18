import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    console.log("AUTH HEADER:", req.headers.authorization);
    console.log("COOKIES:", req.cookies);

    const token =
      req.cookies.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED TOKEN:", decoded); // 🔥 DEBUG

    req.user = {
      id: decoded.id,
      role: decoded.role || "student", // safe fallback
    };

    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Token Verification Error:", error);

    return res.status(401).json({
      message: "Unauthorized - invalid token",
    });
  }
};