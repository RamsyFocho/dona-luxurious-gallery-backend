"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const upload_1 = require("../config/upload");
const router = express_1.default.Router();
// Public routes
router.get('/', product_controller_1.getAllProducts);
router.get('/trending', product_controller_1.getTrendingProducts);
router.get('/featured', product_controller_1.getFeaturedProducts);
router.get('/:slug', product_controller_1.getProductBySlug);
// Add this route to your existing product routes
router.patch('/:slug/image', auth_controller_1.protect, (0, auth_controller_1.restrictTo)('ADMIN'), (0, upload_1.uploadSingle)('file'), product_controller_1.uploadProductImage);
// Protected admin routes
router.use(auth_controller_1.protect);
router.use((0, auth_controller_1.restrictTo)('ADMIN'));
router.post('/', product_controller_1.createProduct);
router.post('/bulk', product_controller_1.bulkCreateProducts);
router.patch('/:slug', product_controller_1.updateProduct);
router.delete('/:slug', product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map