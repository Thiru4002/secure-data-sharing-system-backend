const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['data_owner', 'service_user', 'admin'],
      default: 'service_user',
    },
    // ===== NEW FIELDS FOR REAL-WORLD IDENTIFICATION =====
    
    // Unique User ID (like employee ID, customer ID, etc.)
    userId: {
      type: String,
      unique: true,
      sparse: true, // Allow null for users who don't have this
      trim: true,
      index: true,
      // Generated on save if not provided
    },
    
    // Phone number for identification
    phone: {
      type: String,
      sparse: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number'],
    },
    phoneNormalized: {
      type: String,
      index: true,
      sparse: true,
    },
    resetOtp: {
      type: String,
      select: false,
    },
    resetOtpExpires: {
      type: Date,
      select: false,
    },
    
    // Universally Unique Identifier (system-generated)
    uuid: {
      type: String,
      unique: true,
      index: true,
      default: () => uuidv4(),
    },
    
    // National ID / Passport / Government ID (optional, encrypted in production)
    governmentId: {
      type: String,
      sparse: true,
      // In production, this should be encrypted
    },
    
    // User's reference hint (self-provided for ambiguity resolution)
    // e.g., "John Doe - Doctor at NY Hospital", "John Doe - Student ID 12345"
    referenceDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ===== ORIGINAL FIELDS =====
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    deletionRequestedAt: {
      type: Date,
      default: null,
    },
    deletionScheduledFor: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-generate userId if not provided (e.g., increment-based)
userSchema.pre('save', async function (next) {
  if (!this.userId) {
    // Generate a user ID based on timestamp + random
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.userId = `USER_${timestamp}_${randomStr}`.toUpperCase();
  }
  next();
});

// Exclude deleted users by default
userSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

// Hide sensitive fields
userSchema.methods.toJSON = function () {
  const { password, governmentId, ...user } = this.toObject();
  return user;
};

// Public profile method (what service users see about a data owner)
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    uuid: this.uuid, // System-wide unique identifier
    userId: this.userId, // Reference ID
    name: this.name,
    email: this.email,
    phone: this.phone || null,
    referenceDescription: this.referenceDescription || null,
    // Note: governmentId is NOT returned even here (privacy)
  };
};

// Index for finding users
userSchema.index({ name: 'text', email: 1, userId: 1, uuid: 1, phone: 1 });

module.exports = mongoose.model('User', userSchema);
