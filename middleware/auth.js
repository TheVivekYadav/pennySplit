import User from "../models/user.model.js";

export const isLoggedIn = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const user = await User.findByAccessToken(token);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired token", error: err.message });
  }
};

export const isAdmin = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }
  try {
    if (req.user && req.user.isAdmin) {
      return next();
    }
    return res.status(403).json({ error: 'Admins only' });
  } catch (error) {
    return res.status(500).json({ "message": "is admin middleware failed" })
  }
}