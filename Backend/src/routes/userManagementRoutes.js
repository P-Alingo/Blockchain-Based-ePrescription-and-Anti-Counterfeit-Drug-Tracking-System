import express from 'express';
import {
  getAllUsers,
  getUserById,
  searchUsers,
  addUser,
  updateUser,
  deleteUser,
  syncUserToBlockchain,
  restoreUser,
  getDeletedUsers
} from '../controllers/userManagementController.js';

const router = express.Router();

// ------------------------------
// User Management Routes
// ------------------------------

// Search users (must come before '/:id' to avoid route conflicts)
router.get('/search', searchUsers);

// Get all users
router.get('/', getAllUsers);

// Get deleted users (admin only)
router.get('/deleted', getDeletedUsers);

// Get single user by ID
router.get('/:id', getUserById);

// Add new user
router.post('/', addUser);

// Update user by ID
router.put('/:id', updateUser);

// Delete user by ID (soft delete)
router.delete('/:id', deleteUser);

// Restore soft-deleted user
router.patch('/:id/restore', restoreUser);

// Sync user to blockchain (sets status to active)
router.post('/:id/sync-blockchain', syncUserToBlockchain);

export default router;