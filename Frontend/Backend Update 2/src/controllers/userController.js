import * as userService from "../services/userService.js";

async function getUserById(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { passwordHash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const updateData = req.body;
    const updatedUser = await userService.updateUser(userId, updateData);
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    const { passwordHash, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const deleted = await userService.deleteUser(userId);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
}

export { getUserById, updateUser, deleteUser };
