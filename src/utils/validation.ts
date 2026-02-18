import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password cannot exceed 100 characters'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Link schemas
export const createLinkSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters')
        .trim(),
    url: z.string().url('Invalid URL format'),
    description: z
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    category: z.enum([
        'Technology',
        'Design',
        'Business',
        'Science',
        'Entertainment',
        'Health',
        'Education',
        'Other',
    ]),
    tags: z.array(z.string()).max(10, 'Cannot have more than 10 tags').default([]),
});

export const updateLinkSchema = createLinkSchema.partial();

// Comment schemas
export const createCommentSchema = z.object({
    content: z
        .string()
        .min(1, 'Comment cannot be empty')
        .max(2000, 'Comment cannot exceed 2000 characters')
        .trim(),
    linkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid link ID'),
    parentCommentId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid comment ID')
        .optional(),
});

// Query schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const linkFilterSchema = paginationSchema.extend({
    category: z.string().optional(),
    tags: z.string().optional(), // comma-separated tags
    sort: z.enum(['latest', 'trending', 'top']).default('latest'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type LinkFilterInput = z.infer<typeof linkFilterSchema>;
