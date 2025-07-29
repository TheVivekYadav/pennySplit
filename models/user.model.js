import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password must be at most 128 characters"],
    },
    avatarUrl: String,
    emailVerificationToken: { type: String },
    loginCount: {
      type: Number,
      default: 0,
    },
    authProvider: { type: String, enum: ["email", "google"], default: "email" },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true },
);

// Pre-save password hashing
userSchema.pre("save", async function () {
  const user = this;
  if (!user.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Increment login count
userSchema.methods.incrementLoginCount = async function () {
  this.loginCount += 1;
  return await this.save();
};

console.log(typeof process)
// Generate JWT
userSchema.methods.generateAuthTokens = function () {
  try {
    const accessToken = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { _id: this._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    return { accessToken, refreshToken };
  } catch (err) {
    console.error("Error in findByToken:", err.message);
    throw err;
  }
};

// Find user by JWT
userSchema.statics.findByAccessToken = async function (token) {
  try {
    if (!token || typeof token !== "string" || !token.trim().startsWith("ey")) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded._id) {
      throw null;
    }
    return await this.findOne({ _id: decoded._id });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      console.error("Authentication error:", err.message);
      return null;
    }
    throw err;
  }
};

userSchema.statics.findByRefreshToken = async function (token) {
  try {
    if (!token || typeof token !== "string" || !token.trim().startsWith("ey")) {
      throw new Error("Invalid refresh token format");
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    // Optionally log decoded payload for debugging
    // console.log("Decoded refresh token payload:", decoded);
    if (!decoded || !decoded._id) {
      throw new Error("Invalid refresh token payload");
    }
    return await this.findOne({ _id: decoded._id });
  } catch (err) {
    // More specific error logging
    if (err.name === "TokenExpiredError") {
      console.error("Refresh token expired:", err.message);
    } else if (err.name === "JsonWebTokenError") {
      console.error("Invalid refresh token signature:", err.message);
    } else {
      console.error("Error in findByRefreshToken:", err.message);
    }
    throw err;
  }
};

// update password or reset password
userSchema.methods.updatePassword = async function (password) {
  this.password = password;
  await this.save();
}


const User = mongoose.model("User", userSchema);

export default User;
