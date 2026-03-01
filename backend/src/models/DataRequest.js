const mongoose = require('mongoose');

const dataRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    requestedTitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    requestedCategory: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'rejected'],
      default: 'pending',
      index: true,
    },
    linkedData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Data',
    },
    fulfilledAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('DataRequest', dataRequestSchema);
