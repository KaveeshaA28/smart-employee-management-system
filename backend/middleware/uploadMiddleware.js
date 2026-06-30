/**
 * Upload Middleware - Multer Configuration
 * ============================================================
 * Handles file uploads for:
 * - Employee documents (IDs, certifications)
 * - Employee avatars/photos
 * - Leave medical documents
 * - Task attachments
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Ensure Upload Directories Exist ──────────────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const UPLOAD_BASE = path.join(__dirname, '../uploads');
ensureDir(`${UPLOAD_BASE}/avatars`);
ensureDir(`${UPLOAD_BASE}/documents`);
ensureDir(`${UPLOAD_BASE}/leave-docs`);
ensureDir(`${UPLOAD_BASE}/task-attachments`);
ensureDir(`${UPLOAD_BASE}/pdfs`);

// ─── Storage Engine Factory ────────────────────────────────────────────────────
const createStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(UPLOAD_BASE, subfolder));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
  });

// ─── File Filter Factory ───────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  if (isValid) return cb(null, true);
  cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
};

const documentFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|jpeg|jpg|png/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
  if (isValid) return cb(null, true);
  cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
};

// ─── Max File Size: 5MB ────────────────────────────────────────────────────────
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

// ─── Multer Instances ──────────────────────────────────────────────────────────
const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_SIZE },
});

const uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_SIZE },
});

const uploadLeaveDocument = multer({
  storage: createStorage('leave-docs'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_SIZE },
});

const uploadTaskAttachment = multer({
  storage: createStorage('task-attachments'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_SIZE },
});

// ─── Multer Error Handler ──────────────────────────────────────────────────────
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: `File too large. Max size: ${MAX_SIZE / (1024 * 1024)}MB` });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = {
  uploadAvatar,
  uploadDocument,
  uploadLeaveDocument,
  uploadTaskAttachment,
  handleUploadError,
};
