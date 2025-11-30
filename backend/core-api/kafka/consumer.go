// backend/core-api/kafka/consumer.go

package eventbus

import (
	"context"
	"encoding/json"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/logger"

	"github.com/segmentio/kafka-go"
)

type Consumer struct {
	reader *kafka.Reader
}

func NewConsumer(brokers []string, topic string, groupID string) *Consumer {
	return &Consumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers:  brokers,
			Topic:    topic,
			GroupID:  groupID,
			MinBytes: 10e3, // 10KB
			MaxBytes: 10e6, // 10MB
		}),
	}
}

func (c *Consumer) ConsumeEvents(handler func(event map[string]interface{}) error) {
	for {
		m, err := c.reader.ReadMessage(context.Background())
		if err != nil {
			logger.Errorf("Error reading message: %v", err)
			continue
		}

		var event map[string]interface{}
		if err := json.Unmarshal(m.Value, &event); err != nil {
			logger.Errorf("Error unmarshaling event: %v", err)
			continue
		}

		logger.Infof("Consumed event: %s", string(m.Key))

		if err := handler(event); err != nil {
			logger.Errorf("Error handling event: %v", err)
		}
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
