import { prisma } from "../config/database.js";

async function getDoctorByUserId(userId) {
  return prisma.doctor.findUnique({ where: { userId } });
}

async function updateDoctorByUserId(userId, updateData) {
  return prisma.doctor.update({ where: { userId }, data: updateData });
}

export { getDoctorByUserId, updateDoctorByUserId };
