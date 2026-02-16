require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { configureCloudinary } = require('./src/config/cloudinary');
const User = require('./src/models/User');
const Consent = require('./src/models/Consent');

const PORT = process.env.PORT || 5000;

// Initialize
const start = async () => {
  try {
    // Connect database
    await connectDB();

    // Configure Cloudinary
    configureCloudinary();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n[ok] Server running on http://localhost:${PORT}`);
      console.log(`[ok] API Docs: http://localhost:${PORT}/api-docs\n`);
    });

    // Cleanup scheduled deletions daily
    setInterval(async () => {
      try {
        await User.deleteMany({ deletionScheduledFor: { $lte: new Date() } });
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError.message);
      }
    }, 24 * 60 * 60 * 1000);

    // Auto-revoke expired consents hourly
    setInterval(async () => {
      try {
        await Consent.updateMany(
          { status: 'approved', expiryDate: { $lte: new Date() } },
          { $set: { status: 'revoked', revokedAt: new Date() } }
        );
      } catch (cleanupError) {
        console.error('Consent cleanup failed:', cleanupError.message);
      }
    }, 60 * 60 * 1000);
  } catch (error) {
    console.error('[error] Startup failed:', error.message);
    process.exit(1);
  }
};

start();
