const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

// Setup multer & aws. This is used to accept image upload
aws.config.update({
  secretAccessKey: process.env.CLOUDCUBE_SECRET_ACCESS_KEY,
  accessKeyId: process.env.CLOUDCUBE_ACCESS_KEY_ID,
  region: "us-east-1",
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
s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "cloud-cube",
    key: function (req, file, cb) {
      const filename =
        "z35p2pzo524a/public/" +
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

exports.getAWSUpload = getAWSUpload;
