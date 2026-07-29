const User = require('../models/User');
const Scan = require('../models/Scan');
const ThreatLog = require('../models/ThreatLog');

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalScans, totalThreats, recentScans, recentUsers, threatLogs, aiStatus] =
      await Promise.all([
        User.countDocuments({ isActive: true }),
        Scan.countDocuments(),
        Scan.countDocuments({ threatLevel: { $in: ['suspicious', 'malicious'] } }),
        Scan.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10),
        User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('-password'),
        ThreatLog.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(20),
        // Mock AI model status
        Promise.resolve([
          { name: 'URL Threat Classifier', status: 'online', accuracy: '97.3%', version: 'v2.1' },
          { name: 'Document Analyzer', status: 'online', accuracy: '95.8%', version: 'v1.8' },
        ]),
      ]);

    res.json({ totalUsers, totalScans, totalThreats, recentScans, recentUsers, threatLogs, aiStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `User ${user.email} deactivated` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all scans (admin view)
// @route   GET /api/admin/scans
const getAllScans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      Scan.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Scan.countDocuments(),
    ]);

    res.json({ scans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAdminStats, getAllUsers, deleteUser, getAllScans };
