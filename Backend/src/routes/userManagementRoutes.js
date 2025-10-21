import express from 'express';
import {
  getAllUsers,
  getUserById,
  searchUsers,
  addUser,
  updateUser,
  deleteUser,
  syncUserToBlockchain
} from '../controllers/userManagementController.js';

const router = express.Router();

// ------------------------------
// User Management Routes
// ------------------------------

// Search users (must come before '/:id' to avoid route conflicts)
router.get('/search', searchUsers);

// Get all users
router.get('/', getAllUsers);

// Get single user by ID
router.get('/:id', getUserById);

// Add new user
router.post('/', addUser);

// Update user by ID
router.put('/:id', updateUser);

// Delete user by ID
router.delete('/:id', deleteUser);

// Sync user to blockchain (sets status to active)
router.post('/:id/sync-blockchain', syncUserToBlockchain);

export default router;
