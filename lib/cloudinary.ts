import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadToCloudinary(
  file: Buffer,
  folder: string,
  fileName: string
): Promise<{ url: string; publicId: string; format: string; size: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        public_id: fileName,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
          });
        }
      }
    );
    uploadStream.end(file);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
