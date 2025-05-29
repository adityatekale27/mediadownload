import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

/**
 * Initialize Express application with middleware
 */
const app = express();

// Parse JSON and URL-encoded request bodies with size limits for security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

/**
 * Request logging middleware - tracks API performance and responses
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercept JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log API requests on completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Include response body for debugging (truncate if too long)
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 50 ? responseStr.slice(0, 47) + "..." : responseStr}`;
      }

      // Truncate log line to prevent console spam
      if (logLine.length > 100) {
        logLine = logLine.slice(0, 97) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Bootstrap server application
 */
(async () => {
  try {
    const server = await registerRoutes(app);

    /**
     * Global error handler - catches and formats all unhandled errors
     */
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log error details for debugging
      console.error(`Server error ${status}:`, message, err.stack);

      // Send clean error response to client
      res.status(status).json({ error: message });
    });

    // Setup environment-specific middleware
    // Development: Vite dev server with HMR
    // Production: Static file serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server on dedicated port for Replit environment
    // Port 5000 is the only non-firewalled port in Replit
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0", // Accept connections from any IP
      reusePort: true, // Allow port reuse for faster restarts
    }, () => {
      log(`🚀 Server running on port ${port} in ${app.get("env")} mode`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
