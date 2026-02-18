import express from 'express';
import { signup, login, adminLogin, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../utils/validation';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/admin/login', validate(loginSchema), adminLogin);
router.get('/me', protect, getMe);

export default router;
