import { Response } from 'express';
import { asyncHandler, AppError, AuthRequest } from '../utils/errorHandler';
import Comment from '../models/Comment';
import Link from '../models/Link';

// @desc    Get comments for a link
// @route   GET /api/comments/:linkId
// @access  Public
export const getCommentsByLink = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { linkId } = req.params;

    // Get top-level comments (no parent)
    const comments = await Comment.find({ link: linkId, parentComment: null })
        .sort({ createdAt: -1 })
        .populate('author', 'username avatar')
        .populate({
            path: 'replies',
            populate: {
                path: 'author',
                select: 'username avatar',
            },
        })
        .lean();

    res.json({
        success: true,
        data: comments,
    });
});

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content, linkId, parentCommentId } = req.body;

    // Verify link exists
    const link = await Link.findById(linkId);
    if (!link) {
        throw new AppError('Link not found', 404);
    }

    // If replying to a comment, verify it exists
    if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
            throw new AppError('Parent comment not found', 404);
        }
    }

    // Create comment
    const comment = await Comment.create({
        content,
        author: req.userId,
        link: linkId,
        parentComment: parentCommentId || null,
    });

    // Update parent comment's replies array if this is a reply
    if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
            $push: { replies: comment._id },
        });
    }

    // Update link's comment count
    link.commentCount += 1;
    await link.save();

    await comment.populate('author', 'username avatar');

    res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: comment,
    });
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        throw new AppError('Comment not found', 404);
    }

    // Check ownership
    if (comment.author.toString() !== req.userId?.toString()) {
        throw new AppError('Not authorized to update this comment', 403);
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({
        success: true,
        message: 'Comment updated successfully',
        data: comment,
    });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
        throw new AppError('Comment ID required', 400);
    }

    const comment = await Comment.findById(id);

    if (!comment) {
        throw new AppError('Comment not found', 404);
    }

    // Check ownership
    if (comment.author.toString() !== req.userId?.toString()) {
        throw new AppError('Not authorized to delete this comment', 403);
    }

    // Delete all replies recursively
    const deleteReplies = async (commentId: string) => {
        const replies = await Comment.find({ parentComment: commentId });
        for (const reply of replies) {
            await deleteReplies(reply._id.toString());
            await Comment.findByIdAndDelete(reply._id);
        }
    };

    await deleteReplies(id);

    // Remove from parent's replies if it's a reply
    if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, {
            $pull: { replies: comment._id },
        });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(id);

    // Update link's comment count
    const link = await Link.findById(comment.link);
    if (link) {
        link.commentCount = Math.max(0, link.commentCount - 1);
        await link.save();
    }

    res.json({
        success: true,
        message: 'Comment deleted successfully',
    });
});

// @desc    Get user's comments
// @route   GET /api/comments/user/:userId
// @access  Public
export const getUserComments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
        Comment.find({ author: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('author', 'username avatar')
            .populate('link', 'title')
            .lean(),
        Comment.countDocuments({ author: userId }),
    ]);

    res.json({
        success: true,
        data: {
            comments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        },
    });
});
