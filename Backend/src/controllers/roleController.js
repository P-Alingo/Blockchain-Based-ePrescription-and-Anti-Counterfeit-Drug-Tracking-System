import * as roleService from "../services/roleService.js";

async function getRoles(req, res, next) {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
}

export { getRoles };
