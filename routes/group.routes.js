import express from 'express';
import { addMember, createGroup, getGroupbyId, listAllGroups, removeMember, updateGroup } from '../controllers/group.controller.js';
import { isLoggedIn } from '../middleware/auth.js';

const router = express.Router();

router.get('/', isLoggedIn, listAllGroups) //get all grp user belong need to add middleware to get userId
router.post('/', isLoggedIn, createGroup)
router.get('/:id', isLoggedIn, getGroupbyId)
router.put('/:id', isLoggedIn, updateGroup)

router.post('/:id/members', isLoggedIn, addMember)
router.delete('/:id/members/:userId', isLoggedIn, removeMember)


export default router;