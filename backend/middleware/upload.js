import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "edu-guard/evidence",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { quality: "auto" }, // optional optimization
      { fetch_format: "auto" }
    ],
  },
});

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "edu-guard/profile-photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
      },
      {
        quality: "auto",
      },
      {
        fetch_format: "auto",
      },
    ],
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
});

export const profileUpload = multer({
  storage: profileStorage,
  fileFilter,
});