package events

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Event struct {
	Type        string                 `json:"type"`
	JobID       string                 `json:"job_id,omitempty"`
	JobType     string                 `json:"job_type,omitempty"`
	ClusterID   string                 `json:"cluster_id,omitempty"`
	Progress    int                    `json:"progress,omitempty"`
	Message     string                 `json:"message,omitempty"`
	Timestamp   time.Time              `json:"timestamp,omitempty"`
	TraceID     string                 `json:"trace_id,omitempty"`
	Correlation string                 `json:"correlation_id,omitempty"`
	Payload     map[string]interface{} `json:"payload,omitempty"`
}

// NewEvent returns a new Event with generated trace id and timestamp
func NewEvent(t string) *Event {
	return &Event{
		Type:      t,
		Timestamp: time.Now().UTC(),
		TraceID:   uuid.NewString(),
	}
}

func (e *Event) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}

func FromMap(data map[string]interface{}) *Event {
	e := &Event{}
	if v, ok := data["type"].(string); ok {
		e.Type = v
	}
	if v, ok := data["job_id"].(string); ok {
		e.JobID = v
	}
	if v, ok := data["job_type"].(string); ok {
		e.JobType = v
	}
	if v, ok := data["cluster_id"].(string); ok {
		e.ClusterID = v
	}
	if v, ok := data["message"].(string); ok {
		e.Message = v
	}
	if v, ok := data["progress"].(float64); ok {
		e.Progress = int(v)
	} else if v, ok := data["progress"].(int); ok {
		e.Progress = v
	}
	if v, ok := data["trace_id"].(string); ok {
		e.TraceID = v
	}
	if v, ok := data["correlation_id"].(string); ok {
		e.Correlation = v
	}
	// store rest in Payload
	e.Payload = make(map[string]interface{})
	for k, v := range data {
		if k == "type" || k == "job_id" || k == "job_type" || k == "cluster_id" || k == "progress" || k == "message" || k == "trace_id" || k == "correlation_id" {
			continue
		}
		e.Payload[k] = v
	}
	return e
}

// Broker is a simple in-memory pub/sub broker used by SSE/WebSocket endpoints
type Broker struct {
	mu          sync.RWMutex
	subscribers map[chan Event]struct{}
}

func NewBroker() *Broker {
	return &Broker{subscribers: make(map[chan Event]struct{})}
}

func (b *Broker) Subscribe() chan Event {
	ch := make(chan Event, 16)
	b.mu.Lock()
	b.subscribers[ch] = struct{}{}
	b.mu.Unlock()
	return ch
}

func (b *Broker) Unsubscribe(ch chan Event) {
	b.mu.Lock()
	delete(b.subscribers, ch)
	b.mu.Unlock()
	close(ch)
}

// Publish broadcasts the event to all subscribers (non-blocking)
func (b *Broker) Publish(e Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	for ch := range b.subscribers {
		select {
		case ch <- e:
		default:
			// drop if subscriber is slow
		}
	}
}

// Default broker used by the app
var DefaultBroker = NewBroker()

// PublishRaw accepts a generic payload (map or Event) and publishes to DefaultBroker
func PublishRaw(payload interface{}) {
	switch p := payload.(type) {
	case Event:
		DefaultBroker.Publish(p)
	case *Event:
		DefaultBroker.Publish(*p)
	case map[string]interface{}:
		e := FromMap(p)
		if e.TraceID == "" {
			e.TraceID = uuid.NewString()
		}
		if e.Timestamp.IsZero() {
			e.Timestamp = time.Now().UTC()
		}
		DefaultBroker.Publish(*e)
	}
}
