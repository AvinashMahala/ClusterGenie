// backend/core-api/database/db.go

package database

import (
	"log"

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

	// MySQL connection
	dsn := "root:rootpassword@tcp(localhost:3306)/clustergenie?charset=utf8mb4&parseTime=True&loc=Local"
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to MySQL:", err)
	}

	// Note: Schema is created via database/init.sql, not auto-migration
	log.Println("Database connection established")

	// Redis connection
	Redis = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	_, err = Redis.Ping(DB.Statement.Context).Result()
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	log.Println("Database connections initialized")
}

func CloseDB() {
	sqlDB, _ := DB.DB()
	sqlDB.Close()
	Redis.Close()
}
