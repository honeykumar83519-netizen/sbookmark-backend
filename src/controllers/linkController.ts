import { Response } from 'express';
import { asyncHandler, AppError, AuthRequest } from '../utils/errorHandler';
import Link from '../models/Link';
import Comment from '../models/Comment';
import { fetchLinkMetadata } from '../utils/linkMetadata';

// @desc    Get all links with filters
// @route   GET /api/links
// @access  Public
export const getLinks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        page = 1,
        limit = 20,
        category,
        tags,
        sort = 'latest',
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (category) filter.category = category;
    if (tags) filter.tags = { $in: (tags as string).split(',') };

    // Build sort
    let sortOption: any = { createdAt: -1 }; // latest
    if (sort === 'trending') {
        // Trending: combination of recent + upvotes
        sortOption = { upvoteCount: -1, createdAt: -1 };
    } else if (sort === 'top') {
        sortOption = { upvoteCount: -1 };
    }

    const [links, total] = await Promise.all([
        Link.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .populate('author', 'username avatar')
            .lean(),
        Link.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: {
            links,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        },
    });
});

// @desc    Get single link by ID
// @route   GET /api/links/:id
// @access  Public
export const getLinkById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const link = await Link.findById(req.params.id)
        .populate('author', 'username avatar bio');

    if (!link) {
        throw new AppError('Link not found', 404);
    }

    // Increment view count
    link.views += 1;
    await link.save();

    res.json({
        success: true,
        data: link,
    });
});

// @desc    Create new link
// @route   POST /api/links
// @access  Private
export const createLink = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, url, description, imageUrl, category, tags } = req.body;

    const link = await Link.create({
        title,
        url,
        description,
        imageUrl,
        category,
        tags,
        author: req.userId,
    });

    await link.populate('author', 'username avatar');

    res.status(201).json({
        success: true,
        message: 'Link created successfully',
        data: link,
    });
});

// @desc    Update link
// @route   PUT /api/links/:id
// @access  Private
export const updateLink = asyncHandler(async (req: AuthRequest, res: Response) => {
    const link = await Link.findById(req.params.id);

    if (!link) {
        throw new AppError('Link not found', 404);
    }

    // Check ownership
    if (link.author.toString() !== req.userId?.toString()) {
        throw new AppError('Not authorized to update this link', 403);
    }

    const { title, url, description, imageUrl, category, tags } = req.body;

    link.title = title || link.title;
    link.url = url || link.url;
    link.description = description ?? link.description;
    link.imageUrl = imageUrl ?? link.imageUrl;
    link.category = category || link.category;
    link.tags = tags || link.tags;

    await link.save();
    await link.populate('author', 'username avatar');

    res.json({
        success: true,
        message: 'Link updated successfully',
        data: link,
    });
});

// @desc    Delete link
// @route   DELETE /api/links/:id
// @access  Private
export const deleteLink = asyncHandler(async (req: AuthRequest, res: Response) => {
    const link = await Link.findById(req.params.id);

    if (!link) {
        throw new AppError('Link not found', 404);
    }

    // Check ownership
    if (link.author.toString() !== req.userId?.toString()) {
        throw new AppError('Not authorized to delete this link', 403);
    }

    await Link.findByIdAndDelete(req.params.id);

    // Delete associated comments
    await Comment.deleteMany({ link: req.params.id });

    res.json({
        success: true,
        message: 'Link deleted successfully',
    });
});

// @desc    Upvote/Remove upvote from link
// @route   POST /api/links/:id/upvote
// @access  Private
export const toggleUpvote = asyncHandler(async (req: AuthRequest, res: Response) => {
    const link = await Link.findById(req.params.id);

    if (!link) {
        throw new AppError('Link not found', 404);
    }

    const userIdString = req.userId?.toString();
    const hasUpvoted = link.upvotes.some(id => id.toString() === userIdString);

    if (hasUpvoted) {
        // Remove upvote
        link.upvotes = link.upvotes.filter(id => id.toString() !== userIdString);
        link.upvoteCount = Math.max(0, link.upvoteCount - 1);
    } else {
        // Add upvote
        link.upvotes.push(req.userId!);
        link.upvoteCount += 1;
    }

    await link.save();

    res.json({
        success: true,
        message: hasUpvoted ? 'Upvote removed' : 'Link upvoted',
        data: {
            upvoteCount: link.upvoteCount,
            hasUpvoted: !hasUpvoted,
        },
    });
});

// @desc    Get user's submitted links
// @route   GET /api/links/user/:userId
// @access  Public
export const getUserLinks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [links, total] = await Promise.all([
        Link.find({ author: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('author', 'username avatar')
            .lean(),
        Link.countDocuments({ author: userId }),
    ]);

    res.json({
        success: true,
        data: {
            links,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        },
    });
});

// @desc    Fetch link preview/metadata
// @route   POST /api/links/preview
// @access  Public
export const fetchLinkPreview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { url } = req.body;

    if (!url) {
        throw new AppError('URL is required', 400);
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (error) {
        throw new AppError('Invalid URL format', 400);
    }

    const metadata = await fetchLinkMetadata(url);

    res.json({
        success: true,
        data: metadata,
    });
});
