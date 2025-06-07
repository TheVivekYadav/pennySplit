import express from 'express';
import { listAllGroups } from '../controllers/group.controller.js';

const router = express.Router();

router.get('/list', listAllGroups)

export default router;