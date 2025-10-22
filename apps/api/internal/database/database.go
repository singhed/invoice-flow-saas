package database

import (
	"log"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	
	"github.com/example/next-go-monorepo/apps/api/internal/models"
)

var DB *gorm.DB

// InitializeDatabase initializes the SQLite database and runs migrations
func InitializeDatabase() error {
	var err error
	
	// Initialize SQLite database
	DB, err = gorm.Open(sqlite.Open("expenses.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// Auto-migrate the schemas
	err = DB.AutoMigrate(
		&models.Expense{},
		&models.Attachment{},
		&models.AISuggestion{},
	)
	if err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}