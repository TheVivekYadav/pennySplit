import User from "../models/user.model.js";

export const updateUserRole = async (userId, role) => {
  if (!["admin", "user"].includes(role)) {
    throw new Error("Invalid role");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.isAdmin = role === "admin";
  await user.save();
  return user;
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("Target user not found");
  }
  return user;
};

export const softDeleteUserById = async (id) => {
  const user = await getUserById(id);
  user.isActive = false;
  await user.save();
  return user;
};