import express from 'express';
import createGroup from '../controllers/expense.controller.js';
const router = express.Router();

router.post('/create', createGroup);

export default router;