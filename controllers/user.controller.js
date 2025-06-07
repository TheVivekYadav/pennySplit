import User from '../models/user.model.js';

const register = async (req, res) => {
    const input = req.body.user;

    const newUser = new User(input);
    newUser.save();
    res.status(201).json(newUser);
}



export { register };
