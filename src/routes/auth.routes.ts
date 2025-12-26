import express from 'express';
import { login, protect, getMe } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);

export default router;