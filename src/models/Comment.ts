import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
    content: string;
    author: Types.ObjectId;
    link: Types.ObjectId;
    parentComment?: Types.ObjectId;
    replies: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            trim: true,
            minlength: [1, 'Comment cannot be empty'],
            maxlength: [2000, 'Comment cannot exceed 2000 characters'],
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        link: {
            type: Schema.Types.ObjectId,
            ref: 'Link',
            required: [true, 'Link is required'],
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        replies: {
            type: [Schema.Types.ObjectId],
            ref: 'Comment',
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
commentSchema.index({ link: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;
