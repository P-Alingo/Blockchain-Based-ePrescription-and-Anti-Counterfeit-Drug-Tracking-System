import express from "express";
import { uploadFile, getFile, deleteFile } from "../controllers/fileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/upload", uploadFile);
router.get("/:filename", getFile);
router.delete("/:filename", deleteFile);

export default router;
