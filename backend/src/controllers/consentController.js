const Consent = require('../models/Consent');
const Data = require('../models/Data');
const { success, error } = require('../utils/response');
const {
  notifyConsentRequested,
  notifyConsentApproved,
  notifyConsentRejected,
  notifyConsentRevoked,
} = require('../utils/notification');

exports.requestAccess = async (req, res) => {
  try {
    const { dataId, purpose } = req.body;

    if (!dataId) {
      return error(res, 400, 'dataId is required');
    }

    // Validate data exists and belongs to another user
    const data = await Data.findById(dataId);
    if (!data || data.isDeleted) {
      return error(res, 404, 'Data not found');
    }

    if (data.owner.toString() === req.user.id) {
      return error(res, 400, 'Cannot request access to own data');
    }

    // Check most recent consent between this service user and data
    const existingConsent = await Consent.findOne({
      data: dataId,
      serviceUser: req.user.id,
    }).sort({ createdAt: -1 });

    if (existingConsent) {
      if (existingConsent.status === 'pending') {
        return error(res, 409, 'Consent request already pending for this data');
      }
      if (existingConsent.status === 'approved') {
        if (!existingConsent.expiryDate || existingConsent.expiryDate > new Date()) {
          return error(res, 409, 'Consent already approved for this data');
        }
      }
      // If rejected/revoked/expired, allow a new request
    }

    // Create consent request
    const consent = new Consent({
      data: dataId,
      serviceUser: req.user.id,
      dataOwner: data.owner,
      purpose,
    });

    await consent.save();
    await consent.populate(['data', 'serviceUser', 'dataOwner']);

    await notifyConsentRequested({
      dataOwner: consent.dataOwner,
      serviceUser: consent.serviceUser,
      data: consent.data,
      purpose: consent.purpose,
    });

    success(res, 201, consent, 'Access request sent');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    // Service user: requests they made
    const myRequests = await Consent.find({ serviceUser: req.user.id })
      .populate({
        path: 'data',
        select: 'title description allowDownload dataType fileUrl fileMimeType cloudinaryResourceType',
        match: { isDeleted: false },
      })
      .populate('dataOwner', 'name email')
      .sort({ createdAt: -1 });

    success(res, 200, myRequests);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getApprovals = async (req, res) => {
  try {
    // Data owner: approval requests for their data
    const approvals = await Consent.find({ dataOwner: req.user.id })
      .populate('data', 'title description')
      .populate('serviceUser', 'name email')
      .sort({ createdAt: -1 });

    success(res, 200, approvals);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.approveConsent = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiryDays } = req.body;

    const consent = await Consent.findById(id);
    if (!consent) {
      return error(res, 404, 'Consent not found');
    }

    if (consent.dataOwner.toString() !== req.user.id) {
      return error(res, 403, 'Only data owner can approve');
    }

    if (consent.status !== 'pending') {
      return error(res, 400, `Cannot approve ${consent.status} consent`);
    }

    // Auto-revoke after 3 days from approval
    const date = new Date();
    date.setDate(date.getDate() + 3);
    consent.expiryDate = date;

    consent.status = 'approved';
    consent.approvedAt = new Date();
    await consent.save();
    await consent.populate(['data', 'serviceUser']);

    await notifyConsentApproved({
      serviceUser: consent.serviceUser,
      data: consent.data,
      expiryDate: consent.expiryDate,
    });

    success(res, 200, consent, 'Consent approved');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.rejectConsent = async (req, res) => {
  try {
    const { id } = req.params;

    const consent = await Consent.findById(id);
    if (!consent) {
      return error(res, 404, 'Consent not found');
    }

    if (consent.dataOwner.toString() !== req.user.id) {
      return error(res, 403, 'Only data owner can reject');
    }

    if (consent.status !== 'pending') {
      return error(res, 400, `Cannot reject ${consent.status} consent`);
    }

    consent.status = 'rejected';
    await consent.save();
    await consent.populate(['data', 'serviceUser']);

    await notifyConsentRejected({
      serviceUser: consent.serviceUser,
      data: consent.data,
    });

    success(res, 200, consent, 'Consent rejected');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.revokeConsent = async (req, res) => {
  try {
    const { id } = req.params;

    const consent = await Consent.findById(id);
    if (!consent) {
      return error(res, 404, 'Consent not found');
    }

    if (consent.dataOwner.toString() !== req.user.id) {
      return error(res, 403, 'Only data owner can revoke');
    }

    if (consent.status !== 'approved') {
      return error(res, 400, 'Can only revoke approved consent');
    }

    consent.status = 'revoked';
    consent.revokedAt = new Date();
    await consent.save();
    await consent.populate(['data', 'serviceUser']);

    await notifyConsentRevoked({
      serviceUser: consent.serviceUser,
      data: consent.data,
    });

    success(res, 200, consent, 'Consent revoked');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getAccessHistory = async (req, res) => {
  try {
    const { dataId } = req.query;

    if (!dataId) {
      return error(res, 400, 'dataId is required');
    }

    // Verify ownership
    const data = await Data.findById(dataId);
    if (!data || data.owner.toString() !== req.user.id) {
      return error(res, 403, 'Access denied');
    }

    const history = await Consent.find({ data: dataId })
      .populate('serviceUser', 'name email')
      .sort({ createdAt: -1 });

    success(res, 200, history);
  } catch (err) {
    error(res, 500, err.message);
  }
};
