import User from '../models/user.model.js';

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
        return res.status(403).json({ message: "Invalid or expired token", error: err.message });
    }
};
