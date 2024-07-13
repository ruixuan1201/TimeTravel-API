import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

export const setFolder = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
};

export const storage = (filename: string, isSingle?: boolean) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, process.env.IMAGE_UPLOAD_TEMP_PATH as string);
    },
    filename: async function (req, file, cb) {
      cb(null, isSingle ? filename : `${filename}-${uuidv4()}`);
    },
  });

export const upload = (filename: string) => multer({ storage: storage(filename, true) }).single('file');
export const uploadMulti = (filename: string) => multer({ storage: storage(filename, false) }).array('file');
