import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (id) => {
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }
    if (passord.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: name.charAt(0).toUpperCase(),
    });
    const token = signToken(user._id);
    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user._id);
    res.status(200).json({
      message: "User logged in successfully",
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, morningMotivation } = req.body;
    const user = await User.findById(req.user._id);
    if (name !== undefined) {
      user.name = name;
      user.avatar = name.charAt(0).toUpperCase();
    }
    if (morningMotivation !== undefined) {
      user.morningMotivation = morningMotivation;
    }
    await user.save();
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
