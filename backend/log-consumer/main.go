package main

// This line is kept to ensure the package declaration is correct.

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/segmentio/kafka-go"
)

var (
	defaultBrokers = []string{"kafka:29092"}
	defaultTopic   = "logs.dev"
)

func envOr(key string, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	brokers := strings.Split(envOr("KAFKA_BROKERS", strings.Join(defaultBrokers, ",")), ",")
	topic := envOr("LOGS_TOPIC", defaultTopic)
	groupID := envOr("LOG_CONSUMER_GROUP", "log-consumer")
	lokiURL := envOr("LOKI_URL", "http://loki:3100/loki/api/v1/push")

	log.Printf("log-consumer starting; brokers=%v topic=%s loki=%s", brokers, topic, lokiURL)

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: brokers,
		Topic:   topic,
		GroupID: groupID,
		// Use a small MinBytes so small JSON logs are consumed quickly rather
		// than waiting for a large batch. This reduces latency for small dev
		// workloads; in production you may tune this for throughput.
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer reader.Close()

	ctx := context.Background()
	for {
		m, err := reader.ReadMessage(ctx)
		if err != nil {
			log.Printf("error reading message: %v", err)
			time.Sleep(time.Second)
			continue
		}

		// Assume messages are JSON; keep the original payload as the line
		raw := m.Value

		// Try to extract common labels
		var obj map[string]interface{}
		var service, env, level string
		var jobID, traceID string
		var ts time.Time

		if err := json.Unmarshal(raw, &obj); err == nil {
			if v, ok := obj["service"].(string); ok {
				service = v
			}
			if v, ok := obj["environment"].(string); ok {
				env = v
			}
			if v, ok := obj["level"].(string); ok {
				level = v
			}
			if v, ok := obj["timestamp"].(string); ok {
				if t, err := time.Parse(time.RFC3339Nano, v); err == nil {
					ts = t
				}

				// If we did not find top-level fields, try to parse a nested JSON
				// string commonly present in docker log events under "message" or
				// "log" so structured app logs are extracted correctly.
				if service == "" {
					if v, ok := obj["message"].(string); ok {
						var nested map[string]interface{}
						if err := json.Unmarshal([]byte(v), &nested); err == nil {
							if s, ok := nested["service"].(string); ok {
								service = s
							}
							if e, ok := nested["environment"].(string); ok {
								env = e
							}
							if l, ok := nested["level"].(string); ok {
								level = l
							}
							if tsStr, ok := nested["timestamp"].(string); ok {
								// extract job_id / trace_id if present in nested JSON
								if j, ok := nested["job_id"].(string); ok && j != "" {
									jobID = j
								}
								if t, ok := nested["trace_id"].(string); ok && t != "" {
									traceID = t
								}
								if t, err := time.Parse(time.RFC3339Nano, tsStr); err == nil {
									ts = t
								}
							}
						}
					}
					if service == "" {
						// some sources put the raw JSON under the `log` key
						if v, ok := obj["log"].(string); ok {
							var nested map[string]interface{}
							if err := json.Unmarshal([]byte(v), &nested); err == nil {
								if s, ok := nested["service"].(string); ok {
									service = s
								}
								if e, ok := nested["environment"].(string); ok {
									env = e
								}
								if l, ok := nested["level"].(string); ok {
									level = l
								}
								if tsStr, ok := nested["timestamp"].(string); ok {
									// extract job_id / trace_id if present under log nested JSON
									if j, ok := nested["job_id"].(string); ok && j != "" {
										jobID = j
									}
									if t, ok := nested["trace_id"].(string); ok && t != "" {
										traceID = t
									}
									if t, err := time.Parse(time.RFC3339Nano, tsStr); err == nil {
										ts = t
									}
								}
							}
						}
					}
				}
			}

			if ts.IsZero() {
				ts = time.Now().UTC()
			}
			if service == "" {
				service = "unknown"
			}
			if env == "" {
				env = "dev"
			}

			// Add job_id and trace_id as labels if present so Loki/Grafana can quickly filter by them
			jobLabel := ""
			traceLabel := ""
			if jobID != "" {
				jobLabel = fmt.Sprintf(`,job_id="%s"`, escapeLabel(jobID))
			}
			if traceID != "" {
				traceLabel = fmt.Sprintf(`,trace_id="%s"`, escapeLabel(traceID))
			}

			labels := fmt.Sprintf(`{service="%s",env="%s",level="%s"%s%s}`,
				escapeLabel(service), escapeLabel(env), escapeLabel(level), jobLabel, traceLabel)

			payload := map[string]interface{}{
				"streams": []map[string]interface{}{
					{
						"labels": labels,
						"entries": []map[string]string{
							{
								"ts":   ts.Format(time.RFC3339Nano),
								"line": string(raw),
							},
						},
					},
				},
			}

			// send to Loki
			if err := sendToLoki(lokiURL, payload); err != nil {
				log.Printf("failed to send to loki: %v", err)
			} else {
				// Emit a concise success line so we can observe the consumer making
				// progress in container logs during manual testing.
				if jobID != "" || traceID != "" {
					log.Printf("sent offset=%d service=%s env=%s level=%s job_id=%s trace_id=%s ts=%s",
						m.Offset, service, env, level, jobID, traceID, ts.Format(time.RFC3339Nano))
				} else {
					log.Printf("sent offset=%d service=%s env=%s level=%s ts=%s", m.Offset, service, env, level, ts.Format(time.RFC3339Nano))
				}
			}
		}
	}
}

func sendToLoki(url string, payload interface{}) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, strings.NewReader(string(b)))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	// default timeout
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		// read response body for diagnostics
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("loki returned status=%d body=%s", resp.StatusCode, string(body))
	}
	return nil
}

// escapeLabel replaces newlines and double quotes from label values to keep valid label syntax
func escapeLabel(s string) string {
	s = strings.ReplaceAll(s, `"`, `'`)
	s = strings.ReplaceAll(s, "\n", " ")
	return s
}
