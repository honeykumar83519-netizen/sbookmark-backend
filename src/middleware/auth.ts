import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError, AuthRequest } from '../utils/errorHandler';
import User from '../models/User';
import { Types } from 'mongoose';

export const protect = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // Check for token in Authorization header
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check for token in cookies
        else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            throw new AppError('Not authorized, no token provided', 401);
        }

        // Verify token
        const decoded = verifyToken(token);

        // Check if user still exists
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AppError('User no longer exists', 401);
        }

        // Attach user ID and user object to request
        req.userId = new Types.ObjectId(decoded.userId);
        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};

export const admin = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        next(new AppError('Not authorized as an admin', 403));
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);

            if (user) {
                req.userId = new Types.ObjectId(decoded.userId);
            }
        }

        next();
    } catch (_error) {
        // Continue without auth
        next();
    }
};
