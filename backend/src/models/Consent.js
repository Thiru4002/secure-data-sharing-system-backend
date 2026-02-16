const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema(
  {
    dataOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Data',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revoked'],
      default: 'pending',
    },
    expiryDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 30); // 30 days default
        return date;
      },
    },
    approvedAt: Date,
    revokedAt: Date,
    purpose: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consent', consentSchema);
