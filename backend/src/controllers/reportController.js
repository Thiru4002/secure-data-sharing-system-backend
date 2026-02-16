const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const { success, error } = require('../utils/response');

exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, category, reason, details } = req.body;

    if (!reportedUserId || !reason) {
      return error(res, 400, 'reportedUserId and reason are required');
    }

    const targetQuery = mongoose.isValidObjectId(reportedUserId)
      ? { $or: [{ _id: reportedUserId }, { userId: reportedUserId }] }
      : { userId: reportedUserId };

    const target = await User.findOne(targetQuery);
    if (!target) {
      return error(res, 404, 'Reported user not found');
    }

    if (target._id.toString() === req.user.id) {
      return error(res, 400, 'You cannot report your own account');
    }

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: target._id,
      category: category || 'other',
      reason,
      details,
    });

    await report.populate('reportedUser', 'name email userId');

    success(res, 201, report, 'Report submitted');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .populate('reportedUser', 'name email userId')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    success(res, 200, reports);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'name email userId')
      .populate('reportedUser', 'name email userId isDeleted')
      .populate('reviewedBy', 'name email')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Report.countDocuments(query);

    success(res, 200, {
      data: reports,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote, suspendUser } = req.body;

    if (!['validated', 'rejected'].includes(status)) {
      return error(res, 400, 'status must be validated or rejected');
    }

    const report = await Report.findById(id);
    if (!report) {
      return error(res, 404, 'Report not found');
    }

    report.status = status;
    report.reviewNote = reviewNote || null;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    if (status === 'validated' && suspendUser === true) {
      await User.findByIdAndUpdate(report.reportedUser, { isDeleted: true });
      report.suspensionApplied = true;
    }

    await report.save();
    await report.populate('reportedUser', 'name email userId isDeleted');
    await report.populate('reporter', 'name email userId');
    await report.populate('reviewedBy', 'name email');

    success(res, 200, report, 'Report reviewed');
  } catch (err) {
    error(res, 500, err.message);
  }
};
