import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILink extends Document {
    title: string;
    url: string;
    description?: string;
    imageUrl?: string;
    author: Types.ObjectId;
    category: string;
    tags: string[];
    upvotes: Types.ObjectId[];
    upvoteCount: number;
    commentCount: number;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        url: {
            type: String,
            required: [true, 'URL is required'],
            trim: true,
            match: [
                /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                'Please provide a valid URL',
            ],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        imageUrl: {
            type: String,
            trim: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'Technology',
                'Design',
                'Business',
                'Science',
                'Entertainment',
                'Health',
                'Education',
                'Other',
            ],
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (tags: string[]) {
                    return tags.length <= 10;
                },
                message: 'Cannot have more than 10 tags',
            },
        },
        upvotes: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: [],
        },
        upvoteCount: {
            type: Number,
            default: 0,
        },
        commentCount: {
            type: Number,
            default: 0,
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
linkSchema.index({ category: 1, createdAt: -1 });
linkSchema.index({ tags: 1 });
linkSchema.index({ upvoteCount: -1 });
linkSchema.index({ author: 1 });

const Link = mongoose.model<ILink>('Link', linkSchema);

export default Link;
