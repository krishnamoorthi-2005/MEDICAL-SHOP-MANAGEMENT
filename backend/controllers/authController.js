import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Role from '../models/Role.js';

const buildUserPayload = (user, role) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: role?.roleName || 'user',
  status: user.status,
});

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

export const signup = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    const { username, fullName, email, phone, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = (username || '').trim().toLowerCase();

    // Validation
    if (!normalizedUsername || !fullName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, fullName, email and password are required',
      });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check for existing user by username or email
    const existing = await User.findOne({ 
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
      ] 
    }).lean();
    
    if (existing) {
      if (existing.username === normalizedUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists. Please choose another.',
        });
      }
      if (existing.email === normalizedEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists. Please use a different email.',
        });
      }
    }

    // Default role is "user"
    let role = await Role.findOne({ roleName: 'user' });
    if (!role) {
      role = await Role.findOne({ roleName: 'User' });
    }
    if (!role) {
      role = await Role.create({
        roleName: 'user',
        permissions: [],
        description: 'Default application user',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: normalizedUsername,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : undefined,
      passwordHash,
      roleId: role._id,
      status: 'active',
    });

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured on the server');
    }

    const payload = buildUserPayload(user, role);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      token,
      user: payload,
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to sign up',
    });
  }
};

export const login = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedEmail },
      ],
    })
      .populate('roleId')
      .exec();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured on the server');
    }

    const payload = buildUserPayload(user, user.roleId);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      success: true,
      token,
      user: payload,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to login',
    });
  }
};
