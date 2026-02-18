import express from 'express';
import {
    getLinks,
    getLinkById,
    createLink,
    updateLink,
    deleteLink,
    toggleUpvote,
    getUserLinks,
    fetchLinkPreview,
} from '../controllers/linkController';
import { protect, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLinkSchema, updateLinkSchema, linkFilterSchema } from '../utils/validation';

const router = express.Router();

router.post('/preview', fetchLinkPreview);
router.get('/', optionalAuth, validate(linkFilterSchema), getLinks);
router.get('/user/:userId', getUserLinks);
router.get('/:id', getLinkById);
router.post('/', protect, validate(createLinkSchema), createLink);
router.put('/:id', protect, validate(updateLinkSchema), updateLink);
router.delete('/:id', protect, deleteLink);
router.post('/:id/upvote', protect, toggleUpvote);

export default router;
