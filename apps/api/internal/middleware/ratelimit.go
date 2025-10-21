package middleware

import (
    "net/http"
    "time"
    
    "github.com/didip/tollbooth/v7"
    "github.com/didip/tollbooth/v7/limiter"
    "golang.org/x/time/rate"
)

// RateLimitConfig holds the configuration for rate limiting
type RateLimitConfig struct {
    RequestsPerSecond float64
    BurstSize         int
    IPWhitelist       []string
    SkipPaths         []string
}

// DefaultRateLimitConfig provides sensible defaults
func DefaultRateLimitConfig() RateLimitConfig {
    return RateLimitConfig{
        RequestsPerSecond: 10.0,  // 10 requests per second
        BurstSize:         20,    // Allow bursts up to 20 requests
        IPWhitelist:       []string{},
        SkipPaths:         []string{"/", "/healthz"}, // Skip rate limiting for health checks
    }
}

// TollboothRateLimit creates a tollbooth-based rate limiting middleware
func TollboothRateLimit(config RateLimitConfig) func(http.Handler) http.Handler {
    lmt := tollbooth.NewLimiter(config.RequestsPerSecond, &limiter.ExpirableOptions{
        DefaultExpirationTTL: time.Hour,
    })
    
    // Set burst size
    lmt.SetBurst(config.BurstSize)
    
    // Configure IP lookup methods
    lmt.SetIPLookups([]string{"X-Forwarded-For", "X-Real-IP", "RemoteAddr"})
    
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Skip rate limiting for certain paths
            for _, path := range config.SkipPaths {
                if r.URL.Path == path {
                    next.ServeHTTP(w, r)
                    return
                }
            }
            
            // Apply rate limiting
            httpError := tollbooth.LimitByRequest(lmt, w, r)
            if httpError != nil {
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(httpError.StatusCode)
                w.Write([]byte(`{"detail": "Rate limit exceeded. Please slow down your requests."}`))
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

// SimpleRateLimit creates a simple token bucket rate limiter per IP
func SimpleRateLimit(requestsPerSecond rate.Limit, burst int) func(http.Handler) http.Handler {
    type client struct {
        limiter  *rate.Limiter
        lastSeen time.Time
    }
    
    var clients = make(map[string]*client)
    
    // Clean up old clients periodically
    go func() {
        for {
            time.Sleep(time.Minute)
            
            // Remove clients that haven't been seen for over 3 minutes
            for ip, client := range clients {
                if time.Since(client.lastSeen) > 3*time.Minute {
                    delete(clients, ip)
                }
            }
        }
    }()
    
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Get client IP
            ip := getClientIP(r)
            
            // Get or create rate limiter for this client
            if clients[ip] == nil {
                clients[ip] = &client{
                    limiter: rate.NewLimiter(requestsPerSecond, burst),
                }
            }
            
            clients[ip].lastSeen = time.Now()
            
            // Check if request is allowed
            if !clients[ip].limiter.Allow() {
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusTooManyRequests)
                w.Write([]byte(`{"detail": "Rate limit exceeded. Please slow down your requests."}`))
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}

// getClientIP extracts the client IP from the request
func getClientIP(r *http.Request) string {
    // Check X-Forwarded-For header first
    forwarded := r.Header.Get("X-Forwarded-For")
    if forwarded != "" {
        return forwarded
    }
    
    // Check X-Real-IP header
    realIP := r.Header.Get("X-Real-IP")
    if realIP != "" {
        return realIP
    }
    
    // Fall back to RemoteAddr
    return r.RemoteAddr
}