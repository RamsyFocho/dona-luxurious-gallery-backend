"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Global error handlers attached at import time so startup/import errors are logged
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! Shutting down...", err);
    process.exit(1);
});
process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION!");
    // In serverless contexts (Vercel), rethrowing will propagate the error to the platform
    if (process.env.VERCEL) {
        throw err;
    }
    else {
        console.error(err);
        process.exit(1);
    }
});
// Only start an HTTP server when running locally (not in Vercel serverless functions)
if (!process.env.VERCEL) {
    const server = app_1.default.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📁 Environment: ${process.env.NODE_ENV}`);
        console.log(`🌐 Base URL: ${process.env.BASE_URL}`);
    });
    // Graceful shutdown for local dev
    process.on("SIGTERM", () => {
        console.log("SIGTERM received. Shutting down gracefully.");
        server.close(() => process.exit(0));
    });
}
// Export the Express app so Vercel can call it as a handler
exports.default = app_1.default;
//# sourceMappingURL=server.js.map