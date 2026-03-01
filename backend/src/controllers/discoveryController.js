const User = require('../models/User');
const Data = require('../models/Data');
const { success, error } = require('../utils/response');

const buildSearchQuery = (search) => {
  if (!search) return null;
  const safe = search.toString().trim();
  if (!safe) return null;
  return {
    $or: [
      { name: { $regex: safe, $options: 'i' } },
      { uuid: { $regex: safe, $options: 'i' } },
      { userId: { $regex: safe, $options: 'i' } },
      { referenceDescription: { $regex: safe, $options: 'i' } },
    ],
  };
};

exports.listDataOwners = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'data_owner', isDeleted: false };
    const searchQuery = buildSearchQuery(search);
    if (searchQuery) {
      Object.assign(query, searchQuery);
    }

    const owners = await User.find(query)
      .select('uuid userId name referenceDescription')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    const data = owners.map((owner) => ({
      id: owner._id,
      uuid: owner.uuid,
      userId: owner.userId,
      name: owner.name,
      referenceDescription: owner.referenceDescription || null,
    }));

    success(res, 200, {
      data,
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

exports.getOwnerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await User.findOne({ _id: id, role: 'data_owner', isDeleted: false })
      .select('uuid userId name referenceDescription');

    if (!owner) {
      return error(res, 404, 'Data owner not found');
    }

    const dataList = await Data.find({ owner: owner._id, isDeleted: false })
      .select('title description category tags allowDownload createdAt updatedAt')
      .sort({ updatedAt: -1, createdAt: -1 });

    success(res, 200, {
      owner: {
        id: owner._id,
        uuid: owner.uuid,
        userId: owner.userId,
        name: owner.name,
        referenceDescription: owner.referenceDescription || null,
      },
      data: dataList,
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};
