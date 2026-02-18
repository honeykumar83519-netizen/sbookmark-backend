import { Response } from 'express';
import { asyncHandler, AppError, AuthRequest } from '../utils/errorHandler';
import User from '../models/User';
import Link from '../models/Link';
import Comment from '../models/Comment';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Get user stats
    const [linkCount, commentCount, totalUpvotes] = await Promise.all([
        Link.countDocuments({ author: user._id }),
        Comment.countDocuments({ author: user._id }),
        Link.aggregate([
            { $match: { author: user._id } },
            { $group: { _id: null, total: { $sum: '$upvoteCount' } } },
        ]),
    ]);

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
                createdAt: user.createdAt,
            },
            stats: {
                linksSubmitted: linkCount,
                commentsPosted: commentCount,
                totalUpvotes: totalUpvotes[0]?.total || 0,
            },
        },
    });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check if user is updating their own profile
    if (req.params.id !== req.userId?.toString()) {
        throw new AppError('Not authorized to update this profile', 403);
    }

    const { username, bio } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Update username if provided
    if (username) user.username = username;

    // Update bio if provided
    if (bio !== undefined) user.bio = bio;

    // Handle avatar upload with multer (file stored in /uploads folder)
    if (req.file) {
        // Delete old avatar file if exists
        if (user.avatar && user.avatar.startsWith('/uploads/')) {
            const { deleteOldAvatar } = require('../config/multer');
            deleteOldAvatar(user.avatar);
        }

        // Store new avatar path as /uploads/filename.ext
        user.avatar = `/uploads/${req.file.filename}`;
    } else if (req.body.removeAvatar === 'true') {
        // Handle avatar removal
        if (user.avatar && user.avatar.startsWith('/uploads/')) {
            const { deleteOldAvatar } = require('../config/multer');
            deleteOldAvatar(user.avatar);
        }
        user.avatar = '';
    }

    /* OLD CODE - Base64 storage (commented out)
    // Old way: storing base64 strings directly in database
    if (avatar !== undefined) {
        user.avatar = avatar; // This stored full base64 string
    }
    */

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
        },
    });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Search parameters
    const search = req.query.search as string || '';
    const role = req.query.role as string || '';
    const status = req.query.status as string || ''; // 'active' | 'banned' | ''

    // Build query
    const query: any = {};

    // Search by username or email
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Filter by role
    if (role) {
        query.role = role;
    }

    // Filter by status
    if (status === 'active') {
        query.isDeleted = false;
    } else if (status === 'banned') {
        query.isDeleted = true;
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        success: true,
        data: users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role,
            status: user.status,
            isDeleted: user.isDeleted,
            deletedAt: user.deletedAt,
            createdAt: user.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Toggle user status (Ban/Activate) (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Prevent modifying admin users
    if (user.role === 'admin') {
        throw new AppError('Cannot modify admin users', 403);
    }

    // Toggle status
    user.isDeleted = !user.isDeleted;
    user.status = user.isDeleted ? 'banned' : 'active';

    if (user.isDeleted) {
        user.deletedAt = new Date();
    } else {
        user.deletedAt = undefined;
    }

    await user.save();

    res.json({
        success: true,
        message: `User ${user.isDeleted ? 'banned' : 'activated'} successfully`,
        data: {
            id: user._id,
            isDeleted: user.isDeleted,
            status: user.status
        }
    });
});
