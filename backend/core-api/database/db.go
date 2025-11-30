// backend/core-api/database/db.go

package database

import (
	"context"
	"fmt"
	"os"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/logger"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	DB    *gorm.DB
	Redis *redis.Client
)

func InitDB() {
	var err error
	// MySQL connection (read from environment with sensible defaults)
	mysqlUser := getEnv("MYSQL_USER", "root")
	mysqlPassword := getEnv("MYSQL_PASSWORD", "rootpassword")
	mysqlHost := getEnv("MYSQL_HOST", "localhost")
	mysqlPort := getEnv("MYSQL_PORT", "3306")
	mysqlDB := getEnv("MYSQL_DATABASE", "clustergenie")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		mysqlUser, mysqlPassword, mysqlHost, mysqlPort, mysqlDB)

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		logger.Errorf("Failed to connect to MySQL: %v", err)
		os.Exit(1)
	}

	// Note: Schema is created via database/init.sql, not auto-migration
	logger.Info("Database connection established")

	// Redis connection (env-driven)
	redisAddr := getEnv("REDIS_ADDR", getEnv("REDIS_HOST", "localhost")+":"+getEnv("REDIS_PORT", "6379"))
	Redis = redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
	_, err = Redis.Ping(context.Background()).Result()
	if err != nil {
		logger.Errorf("Failed to connect to Redis: %v", err)
		os.Exit(1)
	}

	logger.Info("Database connections initialized")
}

func CloseDB() {
	sqlDB, _ := DB.DB()
	sqlDB.Close()
	Redis.Close()
}

// getEnv returns value for the environment variable or the provided default
func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
