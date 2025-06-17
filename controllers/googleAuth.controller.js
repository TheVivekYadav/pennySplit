import axios from 'axios';
import crypto from 'crypto';
import User from '../models/user.model.js';

export const googleAuthRedirect = async (req, res) => {
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    res.redirect(redirectUrl);
    console.log(redirectUrl)
};

export const googleAuthCallback = async (req, res) => {
    const { code } = req.query;

    try {
        // 1. Exchange code for access token
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        });

        const { access_token } = tokenRes.data;

        // 2. Get user info
        const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { email, name, picture } = userInfoRes.data;

        // 3. Check or create user
        let user = await User.findOne({ email });

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString("hex");
            user = new User({
                name,
                email,
                avatarUrl: picture,
                password: randomPassword,
                isActive: true,
                authProvider: "google", // flag for auth source
            });
            await user.save();
        }

        // 4. Generate tokens
        const tokens = user.generateAuthTokens();
        await user.incrementLoginCount();

        // 5. Set cookies and respond (or redirect for web)
        res
            .cookie("token", tokens.accessToken, {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
            })
            .cookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
            });

        if (req.query.platform === "android") {
            res.status(200).json({
                message: "Login success",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                },
                tokens,
            });
        } else {
            res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        }
    } catch (err) {
        console.error("Google login failed:", err.message);
        res.status(500).json({ message: "Google login failed", error: err.message });
    }
};
