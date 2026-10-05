import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // 1. Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let bearerToken = null;
    if (authHeader && typeof authHeader === "string") {
      if (authHeader.startsWith("Bearer ")) {
        bearerToken = authHeader.split(" ")[1];
      } else {
        bearerToken = authHeader;
      }
    }

    // 2. Fallback to cookie or custom token headers
    const token =
      bearerToken ||
      req.cookies?.token ||
      req.headers["x-access-token"] ||
      req.headers["token"];

    if (!token) {
      return res.status(401).json({
        message: "User not authenticated .",
      });
    }

    const decode = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decode) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    req.id = decode.userId;
    next();
  } catch (error) {
    console.log("Authentication error:", error?.message || error);
    return res.status(401).json({
      message: "User not authenticated .",
    });
  }
};

export default isAuthenticated;