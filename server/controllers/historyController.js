const Scan = require('../models/Scan');
const ThreatLog = require('../models/ThreatLog');

// @desc    Get scan history for logged-in user
// @route   GET /api/history
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.threatLevel) filter.threatLevel = req.query.threatLevel;
    if (req.query.search) {
      filter.$or = [
        { target: { $regex: req.query.search, $options: 'i' } },
        { originalName: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [scans, total] = await Promise.all([
      Scan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Scan.countDocuments(filter),
    ]);

    res.json({
      scans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single scan
// @route   GET /api/history/:id
const getScan = async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete scan
// @route   DELETE /api/history/:id
const deleteScan = async (req, res) => {
  try {
    const scan = await Scan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ message: 'Scan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get dashboard stats for user
// @route   GET /api/history/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

    const [
      total,
      threats,
      safe,
      urls,
      docs,
      recentScans,
      threatDist,
      weeklyActivity,
      scanHistory30Days,
      threatSeverity,
    ] = await Promise.all([
      // Stat cards
      Scan.countDocuments({ user: userId }),
      Scan.countDocuments({ user: userId, threatLevel: { $in: ['suspicious', 'malicious'] } }),
      Scan.countDocuments({ user: userId, threatLevel: { $in: ['safe', 'warning'] } }),
      Scan.countDocuments({ user: userId, type: 'url' }),
      Scan.countDocuments({ user: userId, type: { $in: ['pdf', 'docx'] } }),

      // Recent scans table
      Scan.find({ user: userId }).sort({ createdAt: -1 }).limit(5),

      // Threat Distribution pie — group by threatLevel
      Scan.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$threatLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Weekly Activity bar — last 7 days, group by day-of-week
      Scan.aggregate([
        { $match: { user: userId, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Scan History area chart — last 30 days, one point per day
      Scan.aggregate([
        { $match: { user: userId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year:  { $year:  '$createdAt' },
              month: { $month: '$createdAt' },
              day:   { $dayOfMonth: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),

      // Threat Severity Radar — group by type (url/pdf/docx) + avg threat score
      Scan.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$type',
            avgScore:    { $avg: '$threatScore' },
            totalScans:  { $sum: 1 },
            malicious:   { $sum: { $cond: [{ $eq: ['$threatLevel', 'malicious']  }, 1, 0] } },
            suspicious:  { $sum: { $cond: [{ $eq: ['$threatLevel', 'suspicious'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.json({
      stats: { total, threats, safe, urls, docs },
      recentScans,
      threatDist,
      weeklyActivity,
      scanHistory30Days,
      threatSeverity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getHistory, getScan, deleteScan, getStats };
