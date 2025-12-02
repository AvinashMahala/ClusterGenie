package logger

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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
		// Print to stdout for local viewing
		fmt.Println(string(b))
		// Send to Loki asynchronously
		go sendToLoki(string(b))
	} else {
		// best-effort fallback
		fallback := fmt.Sprintf("{\"timestamp\":\"%s\",\"level\":\"%s\",\"service\":\"%s\",\"message\":\"%s\"}\n", time.Now().UTC().Format(time.RFC3339Nano), level, serviceName, message)
		fmt.Print(fallback)
		go sendToLoki(fallback)
	}
}

func sendToLoki(line string) {
	// Parse the line to get level
	var obj map[string]interface{}
	var level string = "info"
	if err := json.Unmarshal([]byte(line), &obj); err == nil {
		if l, ok := obj["level"].(string); ok {
			level = l
		}
	}

	// Create Loki payload
	payload := map[string]interface{}{
		"streams": []map[string]interface{}{
			{
				"labels": fmt.Sprintf(`{service="%s",env="%s",level="%s"}`, serviceName, environment, level),
				"entries": []map[string]string{
					{
						"ts":   time.Now().UTC().Format(time.RFC3339Nano),
						"line": line,
					},
				},
			},
		},
	}

	b, err := json.Marshal(payload)
	if err != nil {
		return
	}

	// Allow overriding Loki push URL via environment variable so logging
	// works both when running locally (localhost:3100) and from inside
	// Docker (use http://loki:3100).
	lokiURL := os.Getenv("LOKI_URL")
	if lokiURL == "" {
		lokiURL = "http://localhost:3100/loki/api/v1/push"
	}

	req, err := http.NewRequest("POST", lokiURL, bytes.NewReader(b))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Scope-OrgID", "fake")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	// Ignore response
}
func Info(message string)                       { emit("INFO", message, nil) }
func Infof(format string, args ...interface{})  { Info(fmt.Sprintf(format, args...)) }
func Debug(message string)                      { emit("DEBUG", message, nil) }
func Debugf(format string, args ...interface{}) { Debug(fmt.Sprintf(format, args...)) }
func Warn(message string)                       { emit("WARN", message, nil) }
func Warnf(format string, args ...interface{})  { Warn(fmt.Sprintf(format, args...)) }
func Error(message string)                      { emit("ERROR", message, nil) }
func Errorf(format string, args ...interface{}) { Error(fmt.Sprintf(format, args...)) }
