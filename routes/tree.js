const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');


router.get('/', auth, async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role === 'admin') {

      const subadmins = await User.find({ role: 'subadmin', parent: _id });

      const tree = await Promise.all(subadmins.map(async (sa) => {
        const users = await User.find({ role: 'user', parent: sa._id }).select('-password');
        return { ...sa.toObject(), children: users };
      }));

      res.json({ role: 'admin', tree });
    } else if (role === 'subadmin') {
      
      const users = await User.find({ role: 'user', parent: _id }).select('-password');
      res.json({ role: 'subadmin', tree: users });
    } else {
      res.status(403).json({ message: 'Users do not have a tree view' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
