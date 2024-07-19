const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const createToken = (_id) => {
    const jwt_key = process.env.JWT_SECRET_KEY;
    return jwt.sign({ _id }, jwt_key, { expiresIn: "3d" });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await userModel.findOne({ email });
        if (user) return res.status(400).json("User with the given email already exists");

        if (!name || !email || !password)
            return res.status(400).json("All fields are required");
        if (!validator.isEmail(email))
            return res.status(400).json("Email must be a valid email");

        user = new userModel({ name, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();

        const token = createToken(user._id);
        res.status(200).json({ _id: user._id, name, token });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await userModel.findOne({ email });
        if (!user) {
            console.log("User not found with email:", email);
            return res.status(400).json("Invalid email or password");
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log("Invalid password for user:", email);
            return res.status(400).json("Invalid email or password");
        }

        const token = createToken(user._id);
        res.status(200).json({ _id: user._id, name: user.name, email, token });
    } catch (error) {
        console.log(error);
        res.status(500).json("Server error");
    }
};

module.exports = { registerUser, loginUser };