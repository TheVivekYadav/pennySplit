import { v4 as uuidv4 } from 'uuid';
import User from "../models/user.model.js";
import { softDeleteUserById, updateUserRole } from '../services/auth.service.js';
import { sendMail } from '../utils/mail/mailService.js';
import { emailVerificationMailGenContent } from '../utils/mail/mailTemplates.js';
import { generateLink } from "../utils/url.js";
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

    const emailVerificationToken = await uuidv4();
    const newUser = await new User({ ...parsed.data, emailVerificationToken, isActive: false });

    await newUser.save();

    const verificationLink = generateLink(`/api/auth/verify/${emailVerificationToken}/email`)
    await sendMail({
      email: parsed.data.email,
      subject: "Verify you Email",
      mailGenContent: emailVerificationMailGenContent(newUser.name, verificationLink)
    })

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

    const clientType = req.headers["x-client-type"];

    if (clientType === "mobile") {
      return res.status(200).json({
        message: "Login Success",
        status: 1,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } else {
      // web
      return res
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
    }
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
}

const verify = async (req, res) => {
  const accessToken = req.cookies.token;
  if (!accessToken) {
    return res.status(401).json({ message: "Access token missing" });
  }
  const user = await User.findByAccessToken(accessToken);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ message: "success", user });
}

const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Failed to logout" });
  }
}

const emailVerification = async (req, res) => {
  try {

    const token = req.params.token;
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(404).json({ message: 'Invalid token' });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(404).json({ "message": "Email verification failed", error: error.message });
  }

}

//  forgot password
const forgotPassword = async (req, res) => {
  // send reset mail to reset password

}

const resetPassword = async (req, res) => {
  try {
    const token = req.cookies.token;
    const password = req.body.password;

    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findByAccessToken(token);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.updatePassword(password);
    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ message: "Error in resetting password", error: error.message });
  }
}


// Admin level controller
// fetch all users
const getAllUsers = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(404).json({ "message": "Token not provided" })
    }
    if (!req.user.isAdmin) {
      return res.status(404).json({ "message": "unauthorized" })
    }

    const users = await User.find({}, "-password -__v");
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}


// delete user by id
const deleteUserById = async (req, res) => {
  try {
    const token = req.cookies.token;
    const { id } = req.params;

    if (!token) {
      return res.status(404).json({ "message": "Token not provided" });
    }
    if (!id) {
      return res.status(404).json({ "message": "user id is required" })
    }
    const user = await User.findByAccessToken(token);
    if (!user) {
      return res.status(404).json({ "messaage": "User not found" })
    }
    if (!user.isAdmin) {
      return res.status(404).json({ "message": "unauthorized" });
    }
    const deletedUser = await softDeleteUserById(id);
    res.status(200).json({ "message": "User soft deleted", user: deletedUser })
  } catch (error) {
    res.status(400).json({ error: err.message });
  }
}

// update user role
const updateRole = async (req, res) => {
  try {
    const token = req.cookies.token;
    const { id, role } = req.params; // this is id of user who  we want to update role

    if (!token) {
      return res.status(404).json({ "message": "Token not provided" });
    }
    if (!id) {
      return res.status(404).json({ "message": "user id is required" })
    }
    const user = await User.findByAccessToken(token);
    if (!user) {
      return res.status(404).json({ "messaage": "User not found" })
    }
    if (!user.isAdmin) {
      return res.status(404).json({ "message": "unauthorized" });
    }
    await updateUserRole(id, role.toLowerCase())
    res.status(200).json({ "message": "success" });
  } catch (error) {
    res.status(500).json({ "message": "error in updating role", error: error.message });
  }
}

export default logout;

export {
  deleteUserById, emailVerification, getAllUsers,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
  updateRole,
  verify
};

