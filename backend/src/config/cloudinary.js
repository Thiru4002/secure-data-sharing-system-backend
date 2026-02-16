const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  try {
    // Parse CLOUDINARY_URL in format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const url = process.env.CLOUDINARY_URL;
    if (!url) {
      throw new Error('CLOUDINARY_URL not set');
    }

    // cloudinary.config() accepts the URL directly
    cloudinary.config({
      secure: true,
    });

    // Parse manually for explicit config
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);
    if (!match) {
      throw new Error('Invalid CLOUDINARY_URL format');
    }

    const [, apiKey, apiSecret, cloudName] = match;
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    console.log('✓ Cloudinary configured');
  } catch (error) {
    console.warn('⚠ Cloudinary config warning:', error.message);
    // Continue without Cloudinary for demo purposes
  }
};

module.exports = { cloudinary, configureCloudinary };
