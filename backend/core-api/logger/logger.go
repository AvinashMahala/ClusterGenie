package logger

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

var (
	serviceName string
	environment string
)

// Init sets up the service name and environment for log records.
func Init(svc, env string) {
	if svc == "" {
		svc = os.Getenv("SERVICE_NAME")
		if svc == "" {
			svc = "core-api"
		}
	}
	if env == "" {
		env = os.Getenv("ENVIRONMENT")
		if env == "" {
			env = "dev"
		}
	}
	serviceName = svc
	environment = env
}

func emit(level, message string, attributes map[string]interface{}) {
	obj := map[string]interface{}{
		"timestamp":   time.Now().UTC().Format(time.RFC3339Nano),
		"level":       level,
		"service":     serviceName,
		"environment": environment,
		"message":     message,
	}
	if attributes != nil {
		obj["attributes"] = attributes
	}

	if b, err := json.Marshal(obj); err == nil {
		fmt.Println(string(b))
	} else {
		// best-effort fallback
		fmt.Printf("{\"timestamp\":\"%s\",\"level\":\"%s\",\"service\":\"%s\",\"message\":\"%s\"}\n", time.Now().UTC().Format(time.RFC3339Nano), level, serviceName, message)
	}
}

// Convenience helpers
func Info(message string)                       { emit("INFO", message, nil) }
func Infof(format string, args ...interface{})  { Info(fmt.Sprintf(format, args...)) }
func Debug(message string)                      { emit("DEBUG", message, nil) }
func Debugf(format string, args ...interface{}) { Debug(fmt.Sprintf(format, args...)) }
func Warn(message string)                       { emit("WARN", message, nil) }
func Warnf(format string, args ...interface{})  { Warn(fmt.Sprintf(format, args...)) }
func Error(message string)                      { emit("ERROR", message, nil) }
func Errorf(format string, args ...interface{}) { Error(fmt.Sprintf(format, args...)) }
