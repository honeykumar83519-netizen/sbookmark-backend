import express from 'express';
import {
    createBlog,
    deleteBlog,
    getBlogById,
    getBlogs,
    updateBlog,
} from '../controllers/blogController';
import { protect, admin } from '../middleware/auth';

import { upload } from '../config/multer';

const router = express.Router();

router.route('/')
    .get(getBlogs)
    .post(protect, admin, upload.single('image'), createBlog);

router.route('/:id')
    .get(getBlogById)
    .put(protect, admin, upload.single('image'), updateBlog)
    .delete(protect, admin, deleteBlog);

export default router;
