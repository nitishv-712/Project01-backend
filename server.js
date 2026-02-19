require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const AuthRoutes = require('./routes/auth');
const TreeRoutes = require('./routes/tree');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', AuthRoutes);
app.use('/api/tree', TreeRoutes);

app.get('/', (req, res) => res.json({ message: 'User Management API is running' }));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
