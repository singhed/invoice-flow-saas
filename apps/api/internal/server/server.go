package server

import (
    "log"
    "net/http"
    "os"
    "strconv"
    "strings"
    "time"

    "github.com/gorilla/mux"
    "golang.org/x/time/rate"
    
    "github.com/example/next-go-monorepo/apps/api/internal/database"
    "github.com/example/next-go-monorepo/apps/api/internal/handlers"
    "github.com/example/next-go-monorepo/apps/api/internal/middleware"
)

// Config stores runtime configuration for the HTTP server.
type Config struct {
    AllowedOrigins    []string
    RateLimitEnabled  bool
    RequestsPerSecond float64
    BurstSize         int
}

// Server represents the API HTTP server.
type Server struct {
    cfg             Config
    router          *mux.Router
    generalHandler  *handlers.GeneralHandler
    expenseHandler  *handlers.ExpenseHandler
    attachmentHandler *handlers.AttachmentHandler
}

// New creates a server with registered routes and middleware.
func New(cfg Config) *Server {
    if len(cfg.AllowedOrigins) == 0 {
        cfg.AllowedOrigins = []string{"*"}
    }

    // Set default rate limit values
    if cfg.RequestsPerSecond <= 0 {
        cfg.RequestsPerSecond = parseFloat(getEnvWithDefault("RATE_LIMIT_RPS", "10"), 10.0)
    }
    if cfg.BurstSize <= 0 {
        cfg.BurstSize = parseInt(getEnvWithDefault("RATE_LIMIT_BURST", "20"), 20)
    }
    if !cfg.RateLimitEnabled {
        cfg.RateLimitEnabled = getEnvWithDefault("RATE_LIMIT_ENABLED", "true") == "true"
    }

    // Initialize database
    if err := database.InitializeDatabase(); err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }

    s := &Server{
        cfg:               cfg,
        router:           mux.NewRouter(),
        generalHandler:   handlers.NewGeneralHandler(),
        expenseHandler:   handlers.NewExpenseHandler(),
        attachmentHandler: handlers.NewAttachmentHandler(),
    }

    s.registerRoutes()

    return s
}

// Handler returns the root HTTP handler for the server.
func (s *Server) Handler() http.Handler {
    handler := http.Handler(s.router)
    
    // Apply rate limiting if enabled
    if s.cfg.RateLimitEnabled {
        rateLimiter := middleware.SimpleRateLimit(
            rate.Limit(s.cfg.RequestsPerSecond),
            s.cfg.BurstSize,
        )
        handler = rateLimiter(handler)
        log.Printf("Rate limiting enabled: %.1f requests/sec, burst: %d", s.cfg.RequestsPerSecond, s.cfg.BurstSize)
    }
    
    return handler
}

// Start bootstraps the HTTP server on the provided address and blocks until it exits.
func (s *Server) Start(addr string) error {
    srv := &http.Server{
        Addr:              addr,
        Handler:           s.withCORS(s.router),
        ReadHeaderTimeout: 5 * time.Second,
        ReadTimeout:       30 * time.Second,
        WriteTimeout:      30 * time.Second,
        IdleTimeout:       60 * time.Second,
    }

    log.Printf("Expense Management API listening on %s", addr)

    return srv.ListenAndServe()
}

func (s *Server) registerRoutes() {
    // Health check and general endpoints
    s.router.HandleFunc("/", s.generalHandler.HealthCheck).Methods("GET")
    s.router.HandleFunc("/api/categories", s.generalHandler.GetCategories).Methods("GET")
    s.router.HandleFunc("/api/system/info", s.generalHandler.GetSystemInfo).Methods("GET")
    
    // Expense management endpoints
    s.router.HandleFunc("/api/expenses", s.expenseHandler.CreateExpense).Methods("POST")
    s.router.HandleFunc("/api/expenses", s.expenseHandler.GetExpenses).Methods("GET")
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}", s.expenseHandler.GetExpenseByID).Methods("GET")
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}", s.expenseHandler.UpdateExpense).Methods("PUT")
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}", s.expenseHandler.DeleteExpense).Methods("DELETE")
    
    // AI suggestion endpoints
    s.router.HandleFunc("/api/expenses/ai-suggest", s.expenseHandler.GetAISuggestion).Methods("POST")
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}/ai-suggestions/{suggestion_id:[0-9]+}/approve", s.expenseHandler.ApproveSuggestion).Methods("POST")
    
    // Attachment endpoints
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}/attachments", s.attachmentHandler.UploadAttachment).Methods("POST")
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}/attachments/{attachment_id:[0-9]+}", s.attachmentHandler.GetAttachment).Methods("GET")
    s.router.HandleFunc("/api/expenses/{expense_id:[0-9]+}/attachments/{attachment_id:[0-9]+}", s.attachmentHandler.DeleteAttachment).Methods("DELETE")
}

// withCORS middleware to handle CORS for all routes
func (s *Server) withCORS(handler http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")
        allowedOrigin := s.allowedOrigin(origin)

        if allowedOrigin != "" {
            w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
            w.Header().Set("Vary", "Origin")
        }

        if r.Method == http.MethodOptions {
            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
            w.WriteHeader(http.StatusNoContent)
            return
        }

        handler.ServeHTTP(w, r)
    })
}

func (s *Server) allowedOrigin(origin string) string {
    for _, allowed := range s.cfg.AllowedOrigins {
        if allowed == "*" {
            return "*"
        }

        if origin != "" && allowed == origin {
            return origin
        }
    }

    return ""
}

// Helper functions for environment variable parsing
func getEnvWithDefault(key, defaultValue string) string {
    if value := strings.TrimSpace(os.Getenv(key)); value != "" {
        return value
    }
    return defaultValue
}

func parseFloat(s string, defaultValue float64) float64 {
    if val, err := strconv.ParseFloat(s, 64); err == nil {
        return val
    }
    return defaultValue
}

func parseInt(s string, defaultValue int) int {
    if val, err := strconv.Atoi(s); err == nil {
        return val
    }
    return defaultValue
}
