import { Groups } from "../models/groups.model.js";

const listAllGroups = async (req, res) => {
    const groups = await Groups.find()
    res.status(200).json({ "message": "success", groups })
}

export { listAllGroups };
