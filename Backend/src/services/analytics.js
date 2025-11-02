import { query } from "../config/database.js";


async function getLogsByUserId(userId) {
  const { rows } = await query(
    "SELECT * FROM activityLog WHERE userId = $1 ORDER BY createdAt DESC",
    [userId]
  );
  return rows;
}

export { getLogsByUserId };
