const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission");

const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 1000, // 1 hour
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
};

// at top: require bcrypt, jwt, cookieOptions as you already have

const register = async (req, res) => {
  try {
    // validate incoming data
    validate(req.body);

    const { firstName, emailId, password } = req.body;
    if (!emailId || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Build a clean payload — DO NOT rely on req.body for fields you don't expect
    const payload = {
      firstName,
      emailId,
      password: hashed,
      role: 'user',
      problemSolved: [] // correct default for an array of ObjectId
    };

    const user = await User.create(payload);

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    res.cookie('token', token, cookieOptions);
    return res.status(201).json({ user: reply, message: 'Logged In Successfully' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    if (err?.code === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : (Object.keys(err.keyPattern || {})[0] || 'field');
      return res.status(400).json({ message: `${key} already exists` });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};


const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie('token', token, cookieOptions);
    return res.status(200).json({ user: reply, message: "Logged In Successfully" });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      // nothing to do — just clear cookie and return success
      res.clearCookie('token', cookieOptions);
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    const payload = jwt.decode(token);
    if (!payload || !payload.exp) {
      // still clear cookie and return success
      res.clearCookie('token', cookieOptions);
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    // Add token to redis blocklist until it would naturally expire
    await redisClient.set(`token:${token}`, 'Blocked');
    // expireAt expects unix seconds
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.clearCookie('token', cookieOptions);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('LOGOUT ERROR:', err);
    return res.status(503).json({ message: 'Service unavailable' });
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    req.body.password = await bcrypt.hash(password, 10);

    const user = await User.create(req.body);
    const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: 60 * 60 });

    res.cookie('token', token, cookieOptions);
    return res.status(201).json({ message: 'User Registered Successfully' });
  } catch (err) {
    console.error('ADMIN REGISTER ERROR:', err);
    if (err?.code === 11000) {
      const key = err.keyValue ? Object.keys(err.keyValue)[0] : (Object.keys(err.keyPattern || {})[0] || 'field');
      return res.status(400).json({ message: `${key} already exists` });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await User.findByIdAndDelete(userId);
    // await Submission.deleteMany({ userId });

    return res.status(200).json({ message: 'Deleted Successfully' });
  } catch (err) {
    console.error('DELETE PROFILE ERROR:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };
