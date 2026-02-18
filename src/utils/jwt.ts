import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JWTPayload {
    userId: string;
}

export const generateToken = (userId: Types.ObjectId): string => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
        { userId: userId.toString() },
        secret,
        { expiresIn } as jwt.SignOptions
    );
};

export const verifyToken = (token: string): JWTPayload => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';

    try {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};
