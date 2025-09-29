import { prisma } from "../config/database.js";

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function updateUser(id, updateData) {
  return prisma.user.update({ where: { id }, data: updateData });
}

async function deleteUser(id) {
  try {
    await prisma.user.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export { getUserById, updateUser, deleteUser };
