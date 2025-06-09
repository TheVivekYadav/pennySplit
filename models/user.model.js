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
    loginCount: {
      type: Number,
      default: 0,
    },
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
      throw new Error("Invalid token format");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await this.findOne({ _id: decoded._id });
  } catch (err) {
    console.error("Error in findByAccessToken:", err.message);
    throw err;
  }
};

userSchema.statics.findByRefreshToken = async function (token) {
  try {
    if (!token || typeof token !== "string" || !token.trim().startsWith("ey")) {
      throw new Error("Invalid token format");
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return await this.findOne({ _id: decoded._id });
  } catch (err) {
    console.error("Error in findByRefreshToken:", err.message);
    throw err;
  }
};

const User = mongoose.model("User", userSchema);

export default User;
