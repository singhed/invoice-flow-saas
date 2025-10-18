package server

import (
    "bytes"
    "compress/gzip"
    "crypto/sha1"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "strconv"
    "strings"
    "sync"
    "time"
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

// Pools to reduce allocations for compression buffers and writers
var gzipWriterPool = sync.Pool{
    New: func() any {
        w, _ := gzip.NewWriterLevel(io.Discard, gzip.BestSpeed)
        return w
    },
}

var bufferPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
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
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet && r.Method != http.MethodHead {
        s.writeJSON(w, r, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"}, 0)
        return
    }

    s.writeJSON(w, r, http.StatusOK, map[string]string{
        "status": "ok",
    }, 0)
}

func (s *Server) handleHello(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet && r.Method != http.MethodHead {
        s.writeJSON(w, r, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"}, 0)
        return
    }

    s.writeJSON(w, r, http.StatusOK, map[string]any{
        "message": "Hello from the Go API!",
        "timestamp": time.Now().UTC(),
    }, 5*time.Second)
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
            w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
            w.Header().Set("Access-Control-Max-Age", "86400")
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

func (s *Server) writeJSON(w http.ResponseWriter, r *http.Request, status int, payload any, cacheTTL time.Duration) {
    start := time.Now()

    data, err := json.Marshal(payload)
    if err != nil {
        log.Printf("failed to encode JSON response: %v", err)
        http.Error(w, "internal server error", http.StatusInternalServerError)
        return
    }

    // Security hardening
    w.Header().Set("X-Content-Type-Options", "nosniff")

    // Caching
    if cacheTTL > 0 {
        w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int(cacheTTL.Seconds())))
    } else {
        w.Header().Set("Cache-Control", "no-store")
    }

    // ETag for GET/HEAD
    if r != nil && (r.Method == http.MethodGet || r.Method == http.MethodHead) {
        etag := computeETag(data)
        w.Header().Set("ETag", etag)
        if match := r.Header.Get("If-None-Match"); match != "" && strings.Contains(match, etag) {
            w.WriteHeader(http.StatusNotModified)
            return
        }
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.Header().Add("Vary", "Accept-Encoding")

    // Allow frontend to read Server-Timing across origins
    w.Header().Set("Timing-Allow-Origin", "*")

    // Report encode time (ms)
    elapsedMs := float64(time.Since(start).Microseconds()) / 1000.0
    w.Header().Set("Server-Timing", fmt.Sprintf("app;dur=%.3f", elapsedMs))

    // Compression
    var acceptEncoding string
    if r != nil {
        acceptEncoding = r.Header.Get("Accept-Encoding")
    }

    // Only compress if client supports gzip and payload is big enough
    if strings.Contains(acceptEncoding, "gzip") && len(data) > 1024 {
        gzBuf := bufferPool.Get().(*bytes.Buffer)
        gzBuf.Reset()
        defer bufferPool.Put(gzBuf)

        gz := gzipWriterPool.Get().(*gzip.Writer)
        gz.Reset(gzBuf)
        if _, err := gz.Write(data); err == nil {
            gz.Close()
            gzipWriterPool.Put(gz)

            if gzBuf.Len() < len(data) {
                w.Header().Set("Content-Encoding", "gzip")
                w.Header().Set("Content-Length", strconv.Itoa(gzBuf.Len()))
                w.WriteHeader(status)
                if r != nil && r.Method == http.MethodHead {
                    return
                }
                if _, err := w.Write(gzBuf.Bytes()); err != nil {
                    log.Printf("failed to write gzipped response: %v", err)
                }
                return
            }
        } else {
            // Fallback to plain if compression fails
            gz.Close()
            gzipWriterPool.Put(gz)
        }
    }

    w.Header().Set("Content-Length", strconv.Itoa(len(data)))
    w.WriteHeader(status)
    if r != nil && r.Method == http.MethodHead {
        return
    }
    if _, err := w.Write(data); err != nil {
        log.Printf("failed to write response: %v", err)
    }
}

func computeETag(b []byte) string {
    sum := sha1.Sum(b)
    return "W/\"" + hex.EncodeToString(sum[:]) + "\""
}
