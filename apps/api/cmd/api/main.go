package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/example/next-go-monorepo/apps/api/internal/server"
)

func main() {
	host := getEnv("API_HOST", "0.0.0.0")
	port := getEnv("API_PORT", "8080")
	allowedOrigins := parseCSV(getEnv("API_ALLOWED_ORIGINS", "http://localhost:3000"))

	srv := server.New(server.Config{AllowedOrigins: allowedOrigins})
	addr := host + ":" + port

	if err := srv.Start(addr); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func parseCSV(value string) []string {
	clean := strings.TrimSpace(value)
	if clean == "" {
		return nil
	}

	items := strings.Split(clean, ",")
	result := make([]string, 0, len(items))

	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	return result
}
