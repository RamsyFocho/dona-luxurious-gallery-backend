"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
// Import middleware
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS configuration for API routes
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? [process.env.FRONT_END_URL || "", process.env.BASE_URL || '']
        : ["http://localhost:3000", "http://localhost:5000"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
// Security middleware
app.use((0, helmet_1.default)({
    // Configure helmet to allow images
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));
// CORS configuration
app.use((0, cors_1.default)(corsOptions));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);
// Body parsers
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Custom CORS middleware for static files
const staticCors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === "production"
        ? process.env.FRONT_END_URL || "*"
        : "http://localhost:3000");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
};
// Static files with CORS headers
app.use("/uploads", staticCors, express_1.default.static(path_1.default.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
        // Additional headers for images
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        // Set appropriate Content-Type based on file extension
        const ext = path_1.default.extname(filePath).toLowerCase();
        if (['.jpg', '.jpeg'].includes(ext)) {
            res.setHeader('Content-Type', 'image/jpeg');
        }
        else if (ext === '.png') {
            res.setHeader('Content-Type', 'image/png');
        }
        else if (ext === '.gif') {
            res.setHeader('Content-Type', 'image/gif');
        }
        else if (ext === '.webp') {
            res.setHeader('Content-Type', 'image/webp');
        }
    }
}));
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/upload", upload_routes_1.default);
// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});
// 404 handler (catch-all)
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});
// Error middleware (must be last)
app.use(error_middleware_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map