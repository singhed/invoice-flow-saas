package server

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
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
