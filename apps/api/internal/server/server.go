package server

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strconv"
    "strings"
    "time"

    "github.com/example/next-go-monorepo/apps/api/internal/reporting"
)

// Config stores runtime configuration for the HTTP server.
type Config struct {
    AllowedOrigins []string
}

// Server represents the API HTTP server.
type Server struct {
    cfg Config
    mux *http.ServeMux
}

// New creates a server with registered routes and middleware.
func New(cfg Config) *Server {
    if len(cfg.AllowedOrigins) == 0 {
        cfg.AllowedOrigins = []string{"*"}
    }

    s := &Server{
        cfg: cfg,
        mux: http.NewServeMux(),
    }

    s.registerRoutes()

    return s
}

// Handler returns the root HTTP handler for the server.
func (s *Server) Handler() http.Handler {
    return s.mux
}

// Start bootstraps the HTTP server on the provided address and blocks until it exits.
func (s *Server) Start(addr string) error {
    srv := &http.Server{
        Addr:              addr,
        Handler:           s.mux,
        ReadHeaderTimeout: 5 * time.Second,
        ReadTimeout:       10 * time.Second,
        WriteTimeout:      10 * time.Second,
        IdleTimeout:       60 * time.Second,
    }

    log.Printf("API listening on %s", addr)

    return srv.ListenAndServe()
}

func (s *Server) registerRoutes() {
    s.mux.HandleFunc("/healthz", s.withCORS(s.handleHealth))
    s.mux.HandleFunc("/api/v1/hello", s.withCORS(s.handleHello))
    s.mux.HandleFunc("/api/v1/reports/export", s.withCORS(s.handleReportExport))
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        s.writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
        return
    }

    s.writeJSON(w, http.StatusOK, map[string]string{
        "status": "ok",
    })
}

func (s *Server) handleHello(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        s.writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
        return
    }

    s.writeJSON(w, http.StatusOK, map[string]any{
        "message": "Hello from the Go API!",
        "timestamp": time.Now().UTC(),
    })
}

// handleReportExport serves advanced report exports in PDF or Excel formats.
// GET /api/v1/reports/export?format=pdf|excel&start=YYYY-MM-DD&end=YYYY-MM-DD&count=100&title=...&groupBy=category
func (s *Server) handleReportExport(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        s.writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
        return
    }

    q := r.URL.Query()
    format := strings.ToLower(strings.TrimSpace(q.Get("format")))
    if format == "xlsx" { // alias
        format = "excel"
    }

    title := q.Get("title")

    // Parse date range, default last 30 days
    start := parseDateDefault(q.Get("start"), time.Now().AddDate(0, 0, -30))
    end := parseDateDefault(q.Get("end"), time.Now())
    if end.Before(start) {
        start, end = end, start
    }

    // number of rows
    count := 100
    if v := q.Get("count"); v != "" {
        if n, err := strconv.Atoi(v); err == nil && n > 0 {
            if n > 5000 {
                n = 5000 // safety limit
            }
            count = n
        }
    }

    groupBy := q.Get("groupBy")

    opts := reporting.ExportOptions{
        Title:     title,
        StartDate: start,
        EndDate:   end,
        GroupBy:   groupBy,
    }
    data := reporting.GenerateSampleData(count, start, end)

    // Set headers and write content
    ts := time.Now().Format("20060102_150405")
    switch format {
    case string(reporting.FormatExcel):
        w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=report_%s.xlsx", ts))
        w.Header().Set("Cache-Control", "no-store")
        if err := reporting.WriteExcelReport(w, data, opts); err != nil {
            log.Printf("excel export error: %v", err)
        }
        return
    default:
        w.Header().Set("Content-Type", "application/pdf")
        w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=report_%s.pdf", ts))
        w.Header().Set("Cache-Control", "no-store")
        if err := reporting.WritePDFReport(w, data, opts); err != nil {
            log.Printf("pdf export error: %v", err)
        }
        return
    }
}

func parseDateDefault(val string, def time.Time) time.Time {
    if strings.TrimSpace(val) == "" {
        return def
    }
    // try multiple formats
    layouts := []string{
        time.RFC3339,
        "2006-01-02",
        "2006/01/02",
        "02-01-2006",
    }
    for _, l := range layouts {
        if t, err := time.Parse(l, val); err == nil {
            return t
        }
    }
    return def
}

func (s *Server) withCORS(handler http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")
        allowedOrigin := s.allowedOrigin(origin)

        if allowedOrigin != "" {
            w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
            w.Header().Set("Vary", "Origin")
        }

        if r.Method == http.MethodOptions {
            w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
            w.WriteHeader(http.StatusNoContent)
            return
        }

        handler(w, r)
    }
}

func (s *Server) allowedOrigin(origin string) string {
    for _, allowed := range s.cfg.AllowedOrigins {
        allowed = strings.TrimSpace(allowed)

        if allowed == "*" {
            return "*"
        }

        if origin != "" && strings.EqualFold(allowed, origin) {
            return origin
        }
    }

    return ""
}

func (s *Server) writeJSON(w http.ResponseWriter, status int, payload any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)

    if err := json.NewEncoder(w).Encode(payload); err != nil {
        log.Printf("failed to encode JSON response: %v", err)
    }
}
