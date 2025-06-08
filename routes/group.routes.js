import express from 'express';
import { listAllGroups, createGroup, getGroupbyId, updateGroup, addMember, removeMember } from '../controllers/group.controller.js';

const router = express.Router();

router.get('/', listAllGroups) //get all grp user belong need to add middleware to get userId
router.post('/', createGroup)
router.get('/:id', getGroupbyId)
router.put('/:id', updateGroup)

router.post('/:id/members', addMember)
router.delete('/:id/members/:userId', removeMember)


export default router;