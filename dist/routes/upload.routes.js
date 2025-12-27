"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const upload_1 = require("../config/upload");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
// Protected admin routes
router.use(auth_controller_1.protect);
router.use((0, auth_controller_1.restrictTo)('ADMIN'));
// Upload routes
router.post('/single', (0, upload_1.uploadSingle)('file'), upload_controller_1.uploadSingleFile);
router.post('/multiple', (0, upload_1.uploadMultiple)('files', 10), upload_controller_1.uploadMultipleFiles);
router.delete('/', upload_controller_1.deleteFile);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map