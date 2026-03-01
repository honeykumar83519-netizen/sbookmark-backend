import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Blog from '../models/Blog';

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req: Request, res: Response) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Search parameters
        const search = req.query.search as string || '';
        const category = req.query.category as string || '';

        // Build query
        const query: any = {};

        // Search by title
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Get total count for pagination
        const total = await Blog.countDocuments(query);

        // Get blogs with pagination
        const blogs = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: blogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
export const getBlogById = async (req: Request, res: Response) => {
    try {
        const query = mongoose.isValidObjectId(req.params.id)
            ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
            : { slug: req.params.id };

        const blog = await Blog.findOne(query);
        if (blog) {
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = async (req: Request, res: Response) => {
    // Create a blog
    try {
        const { title, content, excerpt, category, tags } = req.body;
        let imagePath = '';

        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const existing = await Blog.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        const blog = new Blog({
            title,
            content,
            excerpt,
            image: imagePath,
            category,
            tags,
            slug,
            author: 'SBookmark Team', // Set to SBookmark Team instead of Admin
        });

        const createdBlog = await blog.save();
        res.status(201).json(createdBlog);
    } catch (error: any) {
        res.status(400).json({ message: 'Invalid blog data', error: error.message });
    }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req: Request, res: Response) => {
    // Update a blog
    try {
        const { title, content, excerpt, category, tags } = req.body;

        const blog = await Blog.findById(req.params.id);

        if (blog) {
            blog.title = title || blog.title;
            blog.content = content || blog.content;
            blog.excerpt = excerpt || blog.excerpt;
            blog.category = category || blog.category;
            blog.tags = tags || blog.tags;

            if (req.file) {
                // Delete old image if it exists and is stored locally
                if (blog.image && blog.image.startsWith('/uploads/')) {
                    const { deleteOldAvatar } = require('../config/multer'); // Reusing helper or FS
                    // If helper not exported, use fs
                    // But assume deleteOldAvatar is reusable or use fs directly
                    deleteOldAvatar(blog.image);
                }
                blog.image = `/uploads/${req.file.filename}`;
            }

            const updatedBlog = await blog.save();
            res.json(updatedBlog);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req: Request, res: Response) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (blog) {
            await blog.deleteOne();
            res.json({ message: 'Blog removed' });
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
