import express from "express";
import { getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { updateUserSchema } from "../utils/validator.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:id", roleMiddleware(["ADMIN"]), getUserById);
router.put("/:id", roleMiddleware(["ADMIN"]), validateRequest(updateUserSchema), updateUser);
router.delete("/:id", roleMiddleware(["ADMIN"]), deleteUser);

export default router;
