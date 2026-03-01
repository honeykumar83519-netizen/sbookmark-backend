import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
    title: string;
    content: string; // HTML content
    excerpt: string;
    author: string; // Could be a name or reference to User
    image: string;
    category: string;
    tags: string[];
    slug?: string;
    createdAt: Date;
    updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
        },
        excerpt: {
            type: String,
            required: [true, 'Excerpt is required'],
        },
        author: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
        },
        tags: {
            type: [String],
            default: [],
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

const Blog = mongoose.model<IBlog>('Blog', blogSchema);

export default Blog;
