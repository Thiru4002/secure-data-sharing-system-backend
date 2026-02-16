const Data = require('../models/Data');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const axios = require('axios');

const extractCloudinaryInfo = (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex === parts.length - 1) {
      return null;
    }
    const resourceType = parts[uploadIndex - 1] || null;
    const afterUpload = parts.slice(uploadIndex + 1);
    const startIndex = afterUpload[0]?.startsWith('v') ? 1 : 0;
    const publicParts = afterUpload.slice(startIndex);
    if (publicParts.length === 0) return null;
    const last = publicParts[publicParts.length - 1];
    const dotIndex = last.lastIndexOf('.');
    const format = dotIndex !== -1 ? last.slice(dotIndex + 1) : null;
    // Cloudinary raw assets keep extension inside public_id.
    // Images/videos typically use public_id without extension + format option.
    if (resourceType !== 'raw') {
      publicParts[publicParts.length - 1] = dotIndex !== -1 ? last.slice(0, dotIndex) : last;
    }
    return {
      publicId: publicParts.join('/'),
      format: resourceType === 'raw' ? null : format,
      resourceType,
    };
  } catch (err) {
    return null;
  }
};

const downloadStream = async (fileUrl) => axios.get(fileUrl, { responseType: 'stream' });

const buildPrivateDownloadUrl = (info, fallbackResourceType) => {
  const resourceType = info?.resourceType || fallbackResourceType || 'raw';
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
  return cloudinary.utils.private_download_url(
    info.publicId,
    info.format || undefined,
    {
      resource_type: resourceType,
      type: 'upload',
      expires_at: expiresAt,
    }
  );
};

const toAccessErrorMessage = (err) => {
  const providerMessage =
    err?.response?.headers?.['x-cld-error'] ||
    err?.response?.data?.error?.message ||
    err?.message ||
    'File access failed';
  if (/deny|acl/i.test(providerMessage)) {
    return 'File access blocked by storage policy';
  }
  return providerMessage;
};

const streamCloudinaryFile = async (fileUrl, fallbackResourceType) => {
  try {
    return await downloadStream(fileUrl);
  } catch (err) {
    const info = extractCloudinaryInfo(fileUrl);
    if (info?.publicId) {
      try {
        const signedUrl = cloudinary.url(info.publicId, {
          resource_type: info.resourceType || fallbackResourceType || 'raw',
          type: 'upload',
          sign_url: true,
          secure: true,
          format: info.format || undefined,
        });
        return await downloadStream(signedUrl);
      } catch (signedErr) {
        const privateUrl = buildPrivateDownloadUrl(info, fallbackResourceType);
        return await downloadStream(privateUrl);
      }
    }
    throw err;
  }
};

const guessContentType = (fileName) => {
  const ext = (fileName || '').toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'txt':
      return 'text/plain; charset=utf-8';
    case 'csv':
      return 'text/csv; charset=utf-8';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    default:
      return 'application/octet-stream';
  }
};
const { success, error } = require('../utils/response');

// ===== NEW: Advanced discovery with reference ID search =====

/**
 * Discover data with multiple filtering options
 * 
 * Query parameters:
 * - title: Search data title
 * - category: Filter by category
 * - tags: Filter by tags
 * - search: Full-text search
 * - ownerUserId: Find data by owner's USER_ID (e.g., USER_1234_ABCD)
 * - ownerUuid: Find data by owner's UUID
 * - ownerEmail: Find data by owner's email
 * - ownerPhone: Find data by owner's phone
 * - ownerName: Find data by owner's name
 * 
 * This solves the "same name, different person" problem!
 */
exports.discoverDataAdvanced = async (req, res) => {
  try {
    const { 
      title, 
      category, 
      tags, 
      search,
      ownerUserId,      // NEW: Search by owner's User ID (e.g., USER_1234_ABCD)
      ownerUuid,        // NEW: Search by owner's UUID
      ownerEmail,       // NEW: Search by owner's email
      ownerPhone,       // NEW: Search by owner's phone
      ownerName,        // NEW: Search by owner's name
      page = 1,
      limit = 50
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = { isDeleted: false };
    
    // Exclude own data
    const ownerQuery = { _id: req.user.id };
    const currentUser = await User.findOne(ownerQuery);
    query.owner = { $ne: req.user.id };

    // ===== OWNER REFERENCE FILTERS (solves ambiguity problem) =====
    
    if (ownerUserId) {
      // Search by owner's User ID
      // e.g., User looking for data from owner with ID "USER_1234_ABCD"
      query['ownerReference.userId'] = ownerUserId;
    }
    
    if (ownerUuid) {
      // Search by owner's UUID (globally unique identifier)
      query['ownerReference.uuid'] = ownerUuid;
    }
    
    if (ownerEmail) {
      // Search by owner's email
      query['ownerReference.email'] = ownerEmail;
    }
    
    if (ownerPhone) {
      // Search by owner's phone number
      query['ownerReference.phone'] = ownerPhone;
    }
    
    if (ownerName) {
      // Search by owner's name (can be partial)
      query['ownerReference.name'] = { 
        $regex: ownerName, 
        $options: 'i' // case-insensitive
      };
    }

    // ===== DATA CONTENT FILTERS =====
    
    if (search) {
      query.$text = { $search: search };
    }
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim()) };
    }

    // Execute query with pagination
    const dataList = await Data.find(query)
      .select('_id owner title description category tags ownerReference ownerReferenceHint ownerIdentifier createdAt')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Data.countDocuments(query);

    // Format response with clear owner identification
    const formattedData = dataList.map(item => ({
      _id: item._id,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags,
      createdAt: item.createdAt,
      // OWNER INFORMATION (helps service user identify correct person)
      owner: {
        id: item.owner,
        userId: item.ownerReference?.userId,      // USER_1234_ABCD
        uuid: item.ownerReference?.uuid,          // Unique identifier
        name: item.ownerReference?.name,          // John Doe
        email: item.ownerReference?.email,        // john@example.com
        phone: item.ownerReference?.phone,        // +1-555-1234
        referenceDescription: item.ownerReference?.referenceDescription, // John Doe - Engineer at TechCorp
      },
      // ADDITIONAL REFERENCE INFO
      ownerReferenceHint: item.ownerReferenceHint,  // "Medical Records 2024"
      ownerIdentifier: item.ownerIdentifier,        // "EMP-12345" or "PATIENT-789"
    }));

    success(res, 200, {
      data: formattedData,
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

/**
 * Get data by ID with owner reference details
 * Service user can see owner's identifying information if accessing
 */
exports.getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Data.findById(id);

    if (!data || data.isDeleted) {
      return error(res, 404, 'Data not found');
    }

    // Check ownership
    if (data.owner.toString() === req.user.id) {
      // Owner accessing own data
      success(res, 200, data);
      return;
    }

    // Service user accessing - check consent
    const Consent = require('../models/Consent');
    const consent = await Consent.findOne({
      data: id,
      serviceUser: req.user.id,
      status: 'approved',
      expiryDate: { $gt: new Date() },
    });

    if (!consent) {
      return error(res, 403, 'Access denied - no valid consent');
    }

    // Service user has valid consent
    // Include owner reference info so they know who they're accessing data from
    const response = {
      ...data.toObject(),
      // Include additional owner info for service user's reference
      ownerInfo: {
        userId: data.ownerReference?.userId,
        uuid: data.ownerReference?.uuid,
        name: data.ownerReference?.name,
        email: data.ownerReference?.email,
        phone: data.ownerReference?.phone,
        referenceDescription: data.ownerReference?.referenceDescription,
      },
      consentInfo: {
        approvedAt: consent.approvedAt,
        expiryDate: consent.expiryDate,
        daysRemaining: Math.ceil((consent.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
      },
    };

    success(res, 200, response);
  } catch (err) {
    error(res, 500, err.message);
  }
};

/**
 * Upload data with reference information
 */
exports.uploadData = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      content, 
      category, 
      tags, 
      ownerReferenceHint,    // NEW: User-provided reference hint
      ownerIdentifier,       // NEW: User's own identifier (Employee ID, etc.)
      allowDownload
    } = req.body;
    const file = req.file;

    if (!title) {
      return error(res, 400, 'Title is required');
    }

    // Get current user for owner reference
    const owner = await User.findById(req.user.id);

    const dataDoc = new Data({
      owner: req.user.id,
      title,
      description,
      category: category || 'General',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      ownerReferenceHint,
      ownerIdentifier,
      allowDownload: allowDownload === 'true' || allowDownload === true,
      // Store owner's identifying information
      ownerReference: {
        userId: owner.userId,
        uuid: owner.uuid,
        name: owner.name,
        email: owner.email,
        phone: owner.phone || null,
        referenceDescription: owner.referenceDescription || null,
      },
    });

    // If text content
    if (content) {
      dataDoc.dataType = 'text';
      dataDoc.content = content;
    }

    // If file upload
    if (file) {
      dataDoc.dataType = 'file';
      dataDoc.fileName = file.originalname;
      dataDoc.fileSize = file.size;
      dataDoc.fileMimeType = file.mimetype;

      // Cloudinary upload (await result)
      try {
        const isImage = file.mimetype && file.mimetype.startsWith('image/');
        const resourceType = isImage ? 'image' : 'raw';
        dataDoc.cloudinaryResourceType = resourceType;
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: resourceType, type: 'upload', folder: 'secure-data-sharing' },
            (err, res) => (err ? reject(err) : resolve(res))
          );
          if (file.buffer) {
            stream.end(file.buffer);
          } else {
            reject(new Error('File buffer missing'));
          }
        });
        dataDoc.fileUrl = result.secure_url;
      } catch (uploadError) {
        console.warn('Cloudinary upload skipped:', uploadError.message);
        dataDoc.fileUrl = null;
      }
    }

    await dataDoc.save();
    success(res, 201, dataDoc, 'Data uploaded successfully');
  } catch (err) {
    error(res, 500, err.message);
  }
};

/**
 * Get user's identification details (for service users to use in queries)
 * This helps service users find the exact person they're looking for
 */
exports.getUserIdentification = async (req, res) => {
  try {
    const { userId, uuid, email } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (uuid) query.uuid = uuid;
    if (email) query.email = email;

    const users = await User.find(query)
      .select('name email phone userId uuid referenceDescription')
      .limit(10);

    if (users.length === 0) {
      return error(res, 404, 'No users found with that identifier');
    }

    // Return user identification info
    const userInfo = users.map(u => ({
      userId: u.userId,              // USER_1234_ABCD
      uuid: u.uuid,                  // UUID
      name: u.name,                  // John Doe
      email: u.email,                // john@example.com
      phone: u.phone || null,        // Phone number
      referenceDescription: u.referenceDescription || null, // Context/description
    }));

    success(res, 200, userInfo);
  } catch (err) {
    error(res, 500, err.message);
  }
};

/**
 * Original simple discovery (kept for backward compatibility)
 */
exports.discoverData = async (req, res) => {
  try {
    const { title, category, tags, search } = req.query;

    const query = { isDeleted: false, owner: { $ne: req.user.id } };

    if (search) {
      query.$text = { $search: search };
    }
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim()) };
    }

    const dataList = await Data.find(query)
      .populate('owner', 'name email')
      .select('_id title description category tags referenceHint createdAt owner')
      .limit(50);

    success(res, 200, dataList);
  } catch (err) {
    error(res, 500, err.message);
  }
};

// Keep other existing controller methods...
exports.getOwnData = async (req, res) => {
  try {
    const dataList = await Data.find({ owner: req.user.id, isDeleted: false })
      .populate('owner', 'name email');

    success(res, 200, dataList);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Data.findById(id);

    if (!data) {
      return error(res, 404, 'Data not found');
    }

    if (data.owner.toString() !== req.user.id) {
      return error(res, 403, 'Only owner can delete data');
    }

    data.isDeleted = true;
    await data.save();

    success(res, 200, {}, 'Data deleted successfully');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, ownerReferenceHint, ownerIdentifier, allowDownload } = req.body;

    const data = await Data.findById(id);
    if (!data) {
      return error(res, 404, 'Data not found');
    }

    if (data.owner.toString() !== req.user.id) {
      return error(res, 403, 'Only owner can update data');
    }

    if (title) data.title = title;
    if (description) data.description = description;
    if (category) data.category = category;
    if (tags) data.tags = tags.split(',').map(t => t.trim());
    if (ownerReferenceHint) data.ownerReferenceHint = ownerReferenceHint;
    if (ownerIdentifier) data.ownerIdentifier = ownerIdentifier;
    if (allowDownload !== undefined) data.allowDownload = allowDownload === true || allowDownload === 'true';

    await data.save();
    success(res, 200, data, 'Data updated successfully');
  } catch (err) {
    error(res, 500, err.message);
  }
};

/**
 * View data content (file or text)
 * Owner can always view. Service user must have approved consent (download may be disabled).
 */
exports.viewData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Data.findById(id);

    if (!data || data.isDeleted) {
      return error(res, 404, 'Data not found');
    }

    const isOwner = data.owner.toString() === req.user.id;

    if (!isOwner) {
      const Consent = require('../models/Consent');
      const consent = await Consent.findOne({
        data: id,
        serviceUser: req.user.id,
        status: 'approved',
        expiryDate: { $gt: new Date() },
      });

      if (!consent) {
        return error(res, 403, 'Access denied - no valid consent');
      }
    }

    if (data.dataType === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(data.content || '');
    }

    if (data.dataType === 'file') {
      if (!data.fileUrl) {
        return error(res, 404, 'File not available');
      }

      try {
        const response = await streamCloudinaryFile(
          data.fileUrl,
          data.cloudinaryResourceType || 'raw'
        );
        const headerType = response.headers['content-type'];
        const fallbackType = guessContentType(data.fileName || data.title);
        res.setHeader('Content-Type', headerType && headerType !== 'application/octet-stream' ? headerType : fallbackType);
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        res.setHeader('Content-Disposition', 'inline');
        response.data.pipe(res);
        return;
      } catch (viewErr) {
        const status = viewErr?.response?.status === 401 || viewErr?.response?.status === 403 ? 403 : 502;
        return error(res, status, `Failed to load file: ${toAccessErrorMessage(viewErr)}`);
      }
    }

    return error(res, 400, 'Unsupported data type');
  } catch (err) {
    return error(res, 500, err.message);
  }
};

/**
 * Download data content (file or text)
 * Owner can always download. Service user must have approved consent and allowDownload enabled.
 */
exports.downloadData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Data.findById(id);

    if (!data || data.isDeleted) {
      return error(res, 404, 'Data not found');
    }

    const isOwner = data.owner.toString() === req.user.id;

    if (!isOwner) {
      // Service user accessing - check consent
      const Consent = require('../models/Consent');
      const consent = await Consent.findOne({
        data: id,
        serviceUser: req.user.id,
        status: 'approved',
        expiryDate: { $gt: new Date() },
      });

      if (!consent) {
        return error(res, 403, 'Access denied - no valid consent');
      }

      if (!data.allowDownload) {
        return error(res, 403, 'Download disabled by data owner');
      }
    }

    const safeName = (data.fileName || data.title || 'data').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (data.dataType === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.txt"`);
      return res.status(200).send(data.content || '');
    }

    if (data.dataType === 'file') {
      if (!data.fileUrl) {
        return error(res, 404, 'File not available for download');
      }

      try {
        const response = await streamCloudinaryFile(
          data.fileUrl,
          data.cloudinaryResourceType || 'raw'
        );
        const headerType = response.headers['content-type'];
        const fallbackType = guessContentType(data.fileName || data.title);
        res.setHeader('Content-Type', headerType && headerType !== 'application/octet-stream' ? headerType : fallbackType);
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        response.data.pipe(res);
        return;
      } catch (downloadErr) {
        const status = downloadErr?.response?.status === 401 || downloadErr?.response?.status === 403 ? 403 : 502;
        return error(res, status, `Failed to download file: ${toAccessErrorMessage(downloadErr)}`);
      }
    }

    return error(res, 400, 'Unsupported data type');
  } catch (err) {
    return error(res, 500, err.message);
  }
};
