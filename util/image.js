const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

// Setup multer & aws. This is used to accept image upload
const bucket = process.env.S3_BUCKET_NAME;
aws.config.update({
  secretAccessKey: process.env.CLOUDCUBE_SECRET_ACCESS_KEY,
  accessKeyId: process.env.CLOUDCUBE_ACCESS_KEY_ID,
  region: process.env.S3_REGION,
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucket,
    key: function (req, file, cb) {
      const filename =
        process.env.S3_IMAGEPATH_PREFIX +
        new Date().toISOString().split(":").join("_") +
        "-" +
        file.originalname;
      cb(null, filename);
    },
  }),
  fileFilter: fileFilter,
});

const getAWSUpload = () => {
  return upload;
};

const clearImage = (imageUrl) => {
  // In AWS S3, ImageUrl contains ImageKey
  imageKey = imageUrl.replace(process.env.CLOUDCUBE_URL + "/", "");
  console.log("Clear Image", imageKey);

  const params = {
    Bucket: bucket,
    Key: imageKey,
  };
  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.log(err);
      err.message = "Unable to delete image" + imageKey;
      throw err;
    }
  });
};

exports.getAWSUpload = getAWSUpload;
exports.clearImage = clearImage;
