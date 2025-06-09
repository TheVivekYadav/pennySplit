import User from "../models/user.model.js";
import { LoginSchema, UserSchema } from "../validations/user.validation.js";

const register = async (req, res) => {
  const input = req.body.user;
  try {
    const parsed = UserSchema.safeParse(input);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }

    const existingUser = await User.findOne({ email: parsed.data.email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = await new User(parsed.data);

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error });
    console.log(error);
  }
};

const login = async (req, res) => {
  try {
    const input = req.body.user;
    const result = LoginSchema.safeParse(input);

    if (!result.success) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const { email, password } = result.data;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const tokens = user.generateAuthTokens();
    await user.incrementLoginCount();

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
      })
      .status(200)
      .json({ message: "Login Success", status: 1 });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const user = await User.findByRefreshToken(refreshToken);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const tokens = user.generateAuthTokens();

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
      })
      .status(200)
      .json({ message: "Token refreshed", status: 1 });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired refresh token",
      error: err.message,
    });
  }
};

// validation left
const verify = async (req, res) => {
  const accessToken = req.cookies.token;
  const user = await User.findByAccessToken(accessToken);

  res.status(200).json({ message: "success", user });
};

export { login, refreshAccessToken, register, verify };
