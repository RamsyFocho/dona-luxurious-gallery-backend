"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
// Public routes
router.get('/', category_controller_1.getAllCategories);
router.get('/:slug', category_controller_1.getCategoryBySlug);
// Protected admin routes
router.use(auth_controller_1.protect);
router.use((0, auth_controller_1.restrictTo)('ADMIN'));
router.post('/', category_controller_1.createCategory);
router.post('/bulk', category_controller_1.bulkCreateCategories);
router.patch('/:slug', category_controller_1.updateCategory);
router.delete('/:slug', category_controller_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map