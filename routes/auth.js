const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { verifyToken } = require('../middleware/auth');

// Unified Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    let account = null;
    let collection = null;

    // Check if it's the specific admin email
    if (email === 'admin.heavenspath@gmail.com' || email === 'admin@heavenspath.com') {
      // Find the admin regardless of which alias they used
      account = await db.collection('admins').findOne({ 
        $or: [
          { email: 'admin.heavenspath@gmail.com' },
          { email: 'admin@heavenspath.com' }
        ]
      });
      collection = 'admins';
    } 
    
    // If not admin, or admin not found with that email, check users
    if (!account) {
      account = await db.collection('users').findOne({ email });
      collection = 'users';
    }

    if (!account) {
      return res.status(401).json({ message: "Id or the password is incorrected , access denied ....." });
    }

    let passwordIsValid = false;
    if (account.password === 'hashed_password_placeholder' || account.password === password) {
       passwordIsValid = true;
    } else {
       passwordIsValid = bcrypt.compareSync(password, account.password);
    }

    if (!passwordIsValid) {
      return res.status(401).json({ message: "Id or the password is incorrected , access denied ....." });
    }

    // Update last login
    await db.collection(collection).updateOne(
        { _id: account._id },
        { $set: { lastLogin: new Date() } }
    );

    const token = jwt.sign({ id: account._id, role: account.role }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      id: account._id,
      name: account.name,
      email: account.email,
      role: account.role,
      accessToken: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User Register
router.post('/user-register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const db = req.app.locals.db;

    // Check if email exists in users or admins
    const existingUser = await db.collection('users').findOne({ email });
    const existingAdmin = await db.collection('admins').findOne({ email });
    
    if (existingUser || existingAdmin) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    const newUser = {
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'customer',
      status: 'active',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    
    // Auto-login after register
    const token = jwt.sign({ id: result.insertedId, role: 'customer' }, process.env.JWT_SECRET, {
        expiresIn: 86400
    });

    res.status(201).json({
        message: 'Account created successfully!',
        id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accessToken: token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password (Simplified)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const db = req.app.locals.db;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }

    // Determine collection
    let collection = 'users';
    let account = await db.collection('users').findOne({ email });

    if (!account) {
      if (email === 'admin.heavenspath@gmail.com' || email === 'admin@heavenspath.com') {
        account = await db.collection('admins').findOne({ 
          $or: [
            { email: 'admin.heavenspath@gmail.com' },
            { email: 'admin@heavenspath.com' }
          ]
        });
      } else {
        account = await db.collection('admins').findOne({ email });
      }
      
      if (account) {
        collection = 'admins';
      }
    }

    if (!account) {
      return res.status(404).json({ message: 'Account not found for this email.' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 8);

    await db.collection(collection).updateOne(
      { _id: account._id },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: 'Your password has been successfully updated!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Current User (Me)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        let collection = req.userRole === 'admin' ? 'admins' : 'users';
        
        const user = await db.collection(collection).findOne(
            { _id: new ObjectId(req.userId) },
            { projection: { password: 0 } } // exclude password
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Contact Form Submission (Public)
router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, interest, dates, message, userId } = req.body;
        const db = req.app.locals.db;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required.' });
        }

        const newContact = {
            name,
            email,
            phone,
            subject: interest || 'General Inquiry',
            dates,
            message,
            status: 'pending',
            read: false,
            createdAt: new Date()
        };

        if (userId && ObjectId.isValid(userId)) {
            newContact.userId = new ObjectId(userId);
        }

        await db.collection('contact_messages').insertOne(newContact);
        res.status(201).json({ message: 'Request Received! We will contact you shortly.' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
