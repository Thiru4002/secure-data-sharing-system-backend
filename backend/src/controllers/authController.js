const User = require('../models/User');
const { generateToken } = require('../middlewares/auth');
const { success, error, loginSuccess } = require('../utils/response');

const normalizePhone = (value) => (value || '').toString().replace(/\D/g, '');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, referenceDescription } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return error(res, 400, 'Name, email, password, and phone are required');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 409, 'Email already registered');
    }

    // Create user (email verification removed)
    const normalizedPhone = normalizePhone(phone);
    const user = new User({
      name,
      email,
      password,
      role: role || 'service_user',
      phone,
      phoneNormalized: normalizedPhone || null,
      referenceDescription: referenceDescription || null, // OPTIONAL
      isEmailVerified: true,
    });

    await user.save();

    success(res, 201, { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      userId: user.userId,
      uuid: user.uuid
    }, 'User registered successfully');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return error(res, 400, 'Phone number is required');
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({
      $or: [{ phone }, { phoneNormalized: normalizedPhone }],
    }).select('+resetOtp +resetOtpExpires');
    if (!user) {
      return error(res, 404, 'No account found with that phone number');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    user.resetOtp = otp;
    user.resetOtpExpires = expires;
    await user.save();

    console.log(`OTP for ${user.phone || user.email}: ${otp} (expires ${expires.toISOString()})`);
    success(res, 200, {
      expiresAt: expires,
      message: 'OTP generated for demo. Check server console.',
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return error(res, 400, 'Phone, OTP, and new password are required');
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await User.findOne({
      $or: [{ phone }, { phoneNormalized: normalizedPhone }],
    }).select('+resetOtp +resetOtpExpires +password');
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return error(res, 400, 'OTP not requested');
    }

    if (user.resetOtp !== otp) {
      return error(res, 400, 'Invalid OTP');
    }

    if (user.resetOtpExpires < new Date()) {
      return error(res, 400, 'OTP expired');
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    success(res, 200, {}, 'Password reset successful');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 400, 'Email and password are required');
    }

    // Find user by email first so we can return specific account state messages
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return error(res, 401, 'Invalid email or password');
    }

    if (user.isDeleted) {
      return error(res, 403, 'Account is suspended. Contact admin.');
    }

    // If deletion scheduled and expired, hard delete and block login
    if (user.deletionScheduledFor && user.deletionScheduledFor <= new Date()) {
      await User.findByIdAndDelete(user._id);
      return error(res, 403, 'Account deleted');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return error(res, 401, 'Invalid email or password');
    }

    // If deletion was scheduled, cancel on login
    if (user.deletionRequestedAt || user.deletionScheduledFor) {
      user.deletionRequestedAt = null;
      user.deletionScheduledFor = null;
      await user.save();
    }

    // Generate token
    const token = generateToken(user);

    loginSuccess(res, 200, token, user);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return error(res, 404, 'User not found');
    }

    success(res, 200, user);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, referenceDescription } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) {
      updates.phone = phone;
      updates.phoneNormalized = normalizePhone(phone);
    }
    if (referenceDescription !== undefined) {
      updates.referenceDescription = referenceDescription;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) {
      return error(res, 404, 'User not found');
    }

    success(res, 200, user, 'Profile updated');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const deletionRequestedAt = new Date();
    const deletionScheduledFor = new Date();
    deletionScheduledFor.setDate(deletionScheduledFor.getDate() + 7);

    await User.findByIdAndUpdate(req.user.id, {
      deletionRequestedAt,
      deletionScheduledFor,
    });

    success(res, 200, {
      deletionRequestedAt,
      deletionScheduledFor,
    }, 'Account deletion scheduled (7 days). Log in before then to cancel.');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.cancelDeletion = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      deletionRequestedAt: null,
      deletionScheduledFor: null,
    });
    success(res, 200, {}, 'Account deletion canceled');
  } catch (err) {
    error(res, 500, err.message);
  }
};
