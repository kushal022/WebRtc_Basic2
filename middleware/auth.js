import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  console.log('authHeader: ', authHeader)
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (err) {
    console.log("Invalid token: auth err ", err)
    return res.status(401).json({success:false, message: "Invalid token" });
  }
};
