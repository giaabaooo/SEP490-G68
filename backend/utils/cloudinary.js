const cloudinary = require('cloudinary').v2;
const path = require('path');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcadn2syh',
  api_key: process.env.CLOUDINARY_API_KEY || '178359369335534',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'FwsPdInccg7HPp6iLNn9ewxDJe4',
  secure: true
});

/**
 * Upload CV file (PDF/Doc) buffer lên Cloudinary
 * @param {Buffer} fileBuffer - Buffer của file tải lên
 * @param {string} originalname - Tên file gốc
 * @param {string} userId - ID của người dùng tải lên
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadCvToCloudinary = (fileBuffer, originalname = 'cv.pdf', userId = 'user') => {
  return new Promise((resolve, reject) => {
    try {
      const ext = path.extname(originalname) || '.pdf';
      const baseFolder = process.env.CLOUDINARY_FOLDER || 'careerio';
      const folder = `${baseFolder}/cvs`;
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      // Đặt public_id có đuôi file để URL Cloudinary thân thiện và giữ định dạng file (.pdf)
      const publicId = `cv-${userId}-${uniqueSuffix}${ext}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          public_id: publicId,
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) {
            console.error('❌ Lỗi tải CV lên Cloudinary:', error);
            return reject(error);
          }
          console.log('✅ Đã tải CV lên Cloudinary thành công:', result.secure_url);
          resolve(result);
        }
      );

      uploadStream.end(fileBuffer);
    } catch (err) {
      console.error('❌ Ngoại lệ upload CV Cloudinary:', err);
      reject(err);
    }
  });
};

/**
 * Upload Avatar ảnh buffer lên Cloudinary
 * @param {Buffer} fileBuffer - Buffer ảnh tải lên
 * @param {string} originalname - Tên file ảnh gốc
 * @param {string} userId - ID người dùng
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadAvatarToCloudinary = (fileBuffer, originalname = 'avatar.jpg', userId = 'user') => {
  return new Promise((resolve, reject) => {
    try {
      const baseFolder = process.env.CLOUDINARY_FOLDER || 'careerio';
      const folder = `${baseFolder}/avatars`;
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const publicId = `avatar-${userId}-${uniqueSuffix}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: publicId,
          transformation: [
            { width: 500, height: 500, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Lỗi tải Avatar lên Cloudinary:', error);
            return reject(error);
          }
          console.log('✅ Đã tải Avatar lên Cloudinary thành công:', result.secure_url);
          resolve(result);
        }
      );

      uploadStream.end(fileBuffer);
    } catch (err) {
      console.error('❌ Ngoại lệ upload Avatar Cloudinary:', err);
      reject(err);
    }
  });
};

/**
 * Xóa file trên Cloudinary bằng publicId
 * @param {string} publicId
 * @param {string} resourceType - 'raw' hoặc 'image'
 */
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return res;
  } catch (err) {
    console.error('Lỗi khi xóa file trên Cloudinary:', err.message);
    throw err;
  }
};

module.exports = {
  cloudinary,
  uploadCvToCloudinary,
  uploadAvatarToCloudinary,
  deleteFromCloudinary
};
