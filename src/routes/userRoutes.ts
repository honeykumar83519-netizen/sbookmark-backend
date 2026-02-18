import express from 'express';
import {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    toggleUserStatus,
} from '../controllers/userController';
import { protect, admin } from '../middleware/auth';
import { upload } from '../config/multer';

const router = express.Router();

// Admin routes
router.get('/', protect, admin, getAllUsers);
router.patch('/:id/status', protect, admin, toggleUserStatus);

// User routes
router.get('/:id', getUserProfile);
// Use multer middleware to handle file upload (single file named 'avatar')
router.put('/:id', protect, upload.single('avatar'), updateUserProfile);

export default router;
