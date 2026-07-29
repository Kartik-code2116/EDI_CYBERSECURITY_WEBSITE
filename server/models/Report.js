const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['url', 'document'],
      required: true,
    },
    summary: { type: String, default: '' },
    threatScore: { type: Number, required: true },
    recommendation: { type: String, default: '' },
    aiExplanation: { type: String, default: '' },
    filePath: { type: String, default: null }, // generated PDF path
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
