const User = require('../models/User');
const Data = require('../models/Data');
const Consent = require('../models/Consent');
const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/response');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search, includeDeleted = 'false' } = req.query;
    const skip = (page - 1) * limit;
    const query = {};

    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    success(res, 200, {
      data: users,
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

exports.updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isDeleted } = req.body;

    const target = await User.findById(id);
    if (!target) {
      return error(res, 404, 'User not found');
    }

    if (role !== undefined) {
      return error(res, 400, 'Role changes are disabled for admin');
    }

    if (typeof isDeleted === 'boolean') {
      target.isDeleted = isDeleted;
    }

    await target.save();
    success(res, 200, target, 'User updated successfully');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getAllData = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const dataList = await Data.find({ isDeleted: false })
      .populate('owner', 'name email')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Data.countDocuments({ isDeleted: false });

    success(res, 200, {
      data: dataList,
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

exports.getAllConsents = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const consents = await Consent.find(query)
      .populate('dataOwner', 'name email')
      .populate('serviceUser', 'name email')
      .populate('data', 'title')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Consent.countDocuments(query);

    success(res, 200, {
      data: consents,
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

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (action) query.action = action;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    success(res, 200, {
      data: logs,
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

exports.getStatistics = async (req, res) => {
  try {
    const approvedConsents = await Consent.countDocuments({ status: 'approved' });
    const pendingConsents = await Consent.countDocuments({ status: 'pending' });
    const stats = {
      totalUsers: await User.countDocuments({ isDeleted: false }),
      suspendedUsers: await User.countDocuments({ isDeleted: true }),
      totalData: await Data.countDocuments({ isDeleted: false }),
      totalConsents: await Consent.countDocuments(),
      approvedConsents,
      pendingConsents,
      consentsByStatus: await Consent.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      usersByRole: await User.aggregate([
        {
          $match: { isDeleted: false },
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
    };

    success(res, 200, stats);
  } catch (err) {
    error(res, 500, err.message);
  }
};
