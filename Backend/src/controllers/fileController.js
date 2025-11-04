import * as fileService from "../services/fileService.js";

export async function uploadFile(req, res, next) {
  try {
    const file = await fileService.uploadFile(req);
    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
}

export async function getFile(req, res, next) {
  try {
    const file = await fileService.getFile(req.params.filename);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.sendFile(file.path);
  } catch (error) {
    next(error);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const result = await fileService.deleteFile(req.params.filename);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
