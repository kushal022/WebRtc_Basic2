import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

export const meCtrl = async (req, res) => {
  const user = req.user;
  res.json({success:true, user });
};

export const registerCtrl = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({success:false, message: "username & password required" });

    // check existing
    const exists = await User.findOne({ username: username.trim() });
    if (exists) return res.status(409).json({success:false, message: "username taken" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      username: username.trim(),
      password: hashed,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.TOKEN_EXPIRES_IN || "7d",
      }
    );

    const data = { id: user._id, username: user.username }
    console.log("User register success: ", data )
    res.json({success: true, token, user: data });
  } catch (err) {
    console.log('Error in register user: ', err);
    res.status(500).json({ success:false, message: "server error" });
  }
};

export const loginCtrl = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success:false, message: "username & password required" });

    const user = await User.findOne({ username: username.trim() });
    if (!user) return res.status(401).json({ success:false, message: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success:false, message: "invalid credentials" });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.TOKEN_EXPIRES_IN || "7d",
      }
    );

    const data = { id: user._id, username: user.username };
    console.log("User logged in success: ", data );
    res.json({ success:true, token, user: data });
  } catch (err) {
    console.log("Error in user loggedIn: ", err)
    res.status(500).json({success:false, message: "server error" });
  }
};
