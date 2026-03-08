import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Role from '../models/Role.js';

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const getOrCreateRole = async (roleName) => {
  const safeRoleName = roleName || 'Staff';
  let role = await Role.findOne({ roleName: safeRoleName });
  if (!role) {
    role = await Role.create({
      roleName: safeRoleName,
      permissions: [],
      description: `${safeRoleName} role`,
    });
  }
  return role;
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate('roleId', 'roleName')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = users.map((u) => ({
      id: String(u._id),
      name: u.fullName,
      email: u.email || '',
      role: u.roleId?.roleName || 'Staff',
      status: u.status || 'active',
      createdAt: u.createdAt,
      username: u.username,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('listUsers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    const fullName = (name || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const rawPassword = password || '';

    if (!fullName || !normalizedEmail || !rawPassword) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    const existing = await User.findOne({ $or: [{ username: normalizedEmail }, { email: normalizedEmail }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const roleDoc = await getOrCreateRole(role);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await User.create({
      username: normalizedEmail,
      email: normalizedEmail,
      fullName,
      passwordHash,
      roleId: roleDoc._id,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: {
        id: String(user._id),
        name: user.fullName,
        email: user.email,
        role: roleDoc.roleName,
        status: user.status,
        createdAt: user.createdAt,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ success: false, message: 'status must be active or inactive' });
    }

    const user = await User.findById(userId).populate('roleId', 'roleName');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect main admin user
    if (user.username === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot change status of main admin user' });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      data: {
        id: String(user._id),
        name: user.fullName,
        email: user.email || '',
        role: user.roleId?.roleName || 'Staff',
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update user status' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect main admin user
    if (user.username === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete the main admin user' });
    }

    await User.deleteOne({ _id: userId });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete user' });
  }
};
