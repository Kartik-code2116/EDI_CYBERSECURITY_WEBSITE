const User = require('../models/User');

// @desc    Get profile
// @route   GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const { name, notifications, darkMode } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, notifications, darkMode },
      { new: true, runValidators: true }
    );
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/profile/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete account
// @route   DELETE /api/profile
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
