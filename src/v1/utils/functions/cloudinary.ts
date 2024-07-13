import cloudinary from 'cloudinary';

import cloudinaryV2 from '../../../v1/services/cloudinary';

const uploadHandler = (
  error: cloudinary.UploadApiErrorResponse | undefined,
  result: cloudinary.UploadApiResponse | undefined,
) => {
  return result?.url;
};

export const saveMedia = async (
  content: string,
  path: string,
  dir: string,
): Promise<cloudinary.UploadApiResponse | string> => {
  try {
    return await cloudinaryV2.uploader.upload(
      path + '/' + content,
      {
        use_filename: false,
        unique_filename: true,
        public_id: dir + '/' + content,
      },
      uploadHandler,
    );
  } catch (err) {
    return err.message ?? err;
  }
};

export const deleteMedia = async (dir: string, content: string): Promise<cloudinary.UploadApiResponse | string> => {
  try {
    return await cloudinaryV2.uploader.destroy(
      (process.env.CLOUDINARY_BUCKET_NAME ?? '') + '/' + dir + '/' + content,
      {
        resource_type: 'image',
        invalidate: true,
      },
      (error, result) => {
        console.info('result: ', result);
        console.error('error: ', error);
      },
    );
  } catch (err) {
    return err.message ?? err;
  }
};
