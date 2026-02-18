import express from 'express';
import {
    getCommentsByLink,
    createComment,
    updateComment,
    deleteComment,
    getUserComments,
} from '../controllers/commentController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../utils/validation';

const router = express.Router();

router.get('/:linkId', getCommentsByLink);
router.get('/user/:userId', getUserComments);
router.post('/', protect, validate(createCommentSchema), createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

export default router;
