const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

router.get('/', auth, (req, res) => {
  res.json(req.user);
});

router.get('/admins', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id name email');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/subadmins', async (req, res) => {
  try {
    const subadmins = await User.find({ role: 'subadmin' }).select('_id name email');
    res.json(subadmins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, parentId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    if (role === 'subadmin') {
      if (!parentId) return res.status(400).json({ message: 'Please select an Admin' });
      const admin = await User.findById(parentId);
      if (!admin || admin.role !== 'admin') return res.status(400).json({ message: 'Invalid admin selected' });
    }

    if (role === 'user') {
      if (!parentId) return res.status(400).json({ message: 'Please select a Sub-admin' });
      const subadmin = await User.findById(parentId);
      if (!subadmin || subadmin.role !== 'subadmin') return res.status(400).json({ message: 'Invalid sub-admin selected' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role, parent: parentId || null });

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
