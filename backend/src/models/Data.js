const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // ===== NEW: Store owner reference info for easy lookup =====
    // This denormalizes some data for performance, avoiding N+1 queries
    ownerReference: {
      // Owner's unique system-generated ID
      userId: String, // e.g., "USER_1234_ABCD"
      
      // Owner's UUID (another unique identifier)
      uuid: String,
      
      // Owner's name (for display)
      name: String,
      
      // Owner's email (for contact)
      email: String,
      
      // Owner's phone (optional)
      phone: String,
      
      // Owner's reference description (e.g., "John - Engineer at TechCorp")
      referenceDescription: String,
    },

    // ===== DATA CONTENT FIELDS =====
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dataType: {
      type: String,
      enum: ['text', 'file'],
      default: 'text',
    },
    content: {
      type: String, // For text data
    },
    fileUrl: {
      type: String, // For file data
    },
    fileMimeType: {
      type: String,
    },
    cloudinaryResourceType: {
      type: String, // "image" or "raw"
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },

    // ===== DISCOVERY FIELDS =====
    tags: [String],
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    
    // ===== AMBIGUITY RESOLUTION FIELDS =====
    
    // Reference hint from DATA OWNER (who uploaded it)
    // e.g., "John Doe - Medical Records 2024"
    // e.g., "John Doe - Tax Returns FY2024"
    ownerReferenceHint: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Additional identifier field from owner
    // e.g., Hospital ID, Patient ID, Employee ID
    ownerIdentifier: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // ===== ACCESS TRACKING =====
    allowDownload: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for discovery searches
dataSchema.index({ 
  title: 'text', 
  description: 'text', 
  category: 1,
  'ownerReference.name': 'text',
  'ownerReference.email': 1,
  'ownerReference.userId': 1,
  'ownerReference.uuid': 1,
});

// Exclude deleted records by default
dataSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

// Method to update owner reference (called when user data changes)
dataSchema.methods.updateOwnerReference = function (userObj) {
  this.ownerReference = {
    userId: userObj.userId,
    uuid: userObj.uuid,
    name: userObj.name,
    email: userObj.email,
    phone: userObj.phone || null,
    referenceDescription: userObj.referenceDescription || null,
  };
};

module.exports = mongoose.model('Data', dataSchema);
