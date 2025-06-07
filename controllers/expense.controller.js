import { Groups } from '../models/groups.model.js';

const createGroup = async (req, res) => {
    const input = req.body.group;
    const newGroup = new Groups(input);
    newGroup.save();

    res.status(200).json({ "message": "success", newGroup })
}

export default createGroup;