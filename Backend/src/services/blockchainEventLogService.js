import { query } from "../config/database.js";


async function listEvents() {
  const { rows } = await query("SELECT * FROM blockchainEventLog ORDER BY createdAt DESC");
  return rows;
}


async function getEventById(id) {
  const { rows } = await query("SELECT * FROM blockchainEventLog WHERE id = $1", [id]);
  return rows[0] || null;
}

export { listEvents, getEventById };
