import { query } from "../config/database.js";


async function getDistributorByUserId(userId) {
  const { rows } = await query("SELECT * FROM distributor WHERE userid = $1", [userId]);
  return rows[0] || null;
}


async function updateDistributorByUserId(userId, updateData) {
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = [userId, ...keys.map(k => updateData[k])];
  await query(`UPDATE distributor SET ${setClause} WHERE userid = $1`, values);
  const { rows } = await query("SELECT * FROM distributor WHERE userid = $1", [userId]);
  return rows[0] || null;
}

export { getDistributorByUserId, updateDistributorByUserId };
