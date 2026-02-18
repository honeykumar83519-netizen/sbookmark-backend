import { Response } from 'express';
import { asyncHandler, AppError, AuthRequest } from '../utils/errorHandler';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, email, password } = req.body;

    // Create user
    const user = await User.create({
        username,
        email,
        password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
            },
            token,
        },
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
            },
            token,
        },
    });
});

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public (Admin only)
export const adminLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if user is admin
    if (user.role !== 'admin') {
        throw new AppError('Not authorized as an admin', 403);
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Admin login successful',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                role: user.role,
            },
            token,
        },
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        success: true,
        data: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role,
            createdAt: user.createdAt,
        },
    });
});
