import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";

// Import middleware
import errorMiddleware from "./middleware/error.middleware";
import categoryRoutes from "./routes/category.routes";
import uploadRoutes from "./routes/upload.routes";
import path from "path";

dotenv.config();

const app: Application = express();
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
app.use(helmet({
  // Configure helmet to allow images
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom CORS middleware for static files
const staticCors = (req: any, res: any, next: any) => {
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
app.use("/uploads", staticCors, express.static(path.join(__dirname, "../uploads"), {
  setHeaders: (res, filePath) => {
    // Additional headers for images
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Set appropriate Content-Type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);

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
app.use(errorMiddleware);

export default app;
