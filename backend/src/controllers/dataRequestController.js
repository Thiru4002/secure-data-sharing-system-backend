const DataRequest = require('../models/DataRequest');
const Consent = require('../models/Consent');
const Data = require('../models/Data');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/response');
const {
  notifyDataRequestCreated,
  notifyDataRequestRejected,
  notifyDataRequestFulfilled,
} = require('../utils/notification');

const buildExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date;
};

const logAudit = async ({ req, action, resourceType, resourceId, description }) => {
  if (!req?.user?.id) return;
  try {
    await AuditLog.create({
      userId: req.user.id,
      action,
      resourceType,
      resourceId,
      description,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: 200,
    });
  } catch (auditError) {
    console.error('Audit log failed:', auditError.message);
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { ownerId, message, requestedTitle, requestedCategory } = req.body;

    if (!ownerId || !message) {
      return error(res, 400, 'ownerId and message are required');
    }

    if (ownerId === req.user.id) {
      return error(res, 400, 'Cannot request data from yourself');
    }

    const owner = await User.findOne({ _id: ownerId, role: 'data_owner', isDeleted: false });
    if (!owner) {
      return error(res, 404, 'Data owner not found');
    }

    const request = await DataRequest.create({
      requester: req.user.id,
      owner: owner._id,
      message,
      requestedTitle,
      requestedCategory,
    });

    await request.populate('requester', 'name email');

    await notifyDataRequestCreated({
      owner,
      requester: request.requester,
      request,
    });

    await logAudit({
      req,
      action: 'data_request_create',
      resourceType: 'data_request',
      resourceId: request._id,
      description: 'Data request created',
    });

    success(res, 201, request, 'Data request created');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await DataRequest.find({ requester: req.user.id })
      .populate('owner', 'uuid name referenceDescription')
      .populate('linkedData', 'title category tags allowDownload')
      .sort({ createdAt: -1 });

    success(res, 200, requests);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getIncomingRequests = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'fulfilled', 'rejected', 'approved', 'revoked'];
    const requestedStatus = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : '';
    const normalizedStatus = requestedStatus === 'approved'
      ? 'fulfilled'
      : requestedStatus === 'revoked'
        ? 'rejected'
        : requestedStatus;

    if (requestedStatus && !allowedStatuses.includes(requestedStatus)) {
      return error(res, 400, 'Invalid status filter');
    }

    const query = { owner: req.user.id };
    if (normalizedStatus) {
      query.status = normalizedStatus;
    }

    const requests = await DataRequest.find(query)
      .populate('requester', 'uuid name referenceDescription')
      .populate('linkedData', 'title category tags allowDownload')
      .sort({ createdAt: -1 });

    success(res, 200, requests);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await DataRequest.findById(id)
      .populate('requester', 'name email')
      .populate('owner', 'name email');

    if (!request) {
      return error(res, 404, 'Data request not found');
    }

    if (request.owner._id.toString() !== req.user.id) {
      return error(res, 403, 'Only the data owner can reject this request');
    }

    if (request.status !== 'pending') {
      return error(res, 400, `Cannot reject ${request.status} request`);
    }

    request.status = 'rejected';
    request.rejectedAt = new Date();
    await request.save();

    await notifyDataRequestRejected({
      requester: request.requester,
      owner: request.owner,
      request,
    });

    await logAudit({
      req,
      action: 'data_request_reject',
      resourceType: 'data_request',
      resourceId: request._id,
      description: 'Data request rejected',
    });

    success(res, 200, request, 'Data request rejected');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.fulfillRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataId } = req.body;

    if (!dataId) {
      return error(res, 400, 'dataId is required');
    }

    const request = await DataRequest.findById(id)
      .populate('requester', 'name email')
      .populate('owner', 'name email');

    if (!request) {
      return error(res, 404, 'Data request not found');
    }

    if (request.owner._id.toString() !== req.user.id) {
      return error(res, 403, 'Only the data owner can fulfill this request');
    }

    if (request.status !== 'pending') {
      return error(res, 400, `Cannot fulfill ${request.status} request`);
    }

    const data = await Data.findOne({ _id: dataId, owner: req.user.id, isDeleted: false });
    if (!data) {
      return error(res, 404, 'Data not found or not owned by you');
    }

    request.status = 'fulfilled';
    request.linkedData = data._id;
    request.fulfilledAt = new Date();
    await request.save();

    const consent = await Consent.create({
      data: data._id,
      serviceUser: request.requester._id,
      dataOwner: request.owner._id,
      status: 'approved',
      approvedAt: new Date(),
      expiryDate: buildExpiryDate(),
      purpose: request.message,
    });

    await notifyDataRequestFulfilled({
      requester: request.requester,
      owner: request.owner,
      data,
    });

    await logAudit({
      req,
      action: 'data_request_fulfill',
      resourceType: 'data_request',
      resourceId: request._id,
      description: 'Data request fulfilled',
    });

    await logAudit({
      req,
      action: 'consent_auto_approve',
      resourceType: 'consent',
      resourceId: consent._id,
      description: 'Consent auto-approved from data request',
    });

    success(res, 200, { request, consent }, 'Data request fulfilled');
  } catch (err) {
    error(res, 500, err.message);
  }
};
