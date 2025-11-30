package eventbus

import (
	"context"
	"encoding/json"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/logger"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/events"

	"github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(brokers []string) *Producer {
	return &Producer{
		writer: &kafka.Writer{
			Addr:     kafka.TCP(brokers...),
			Balancer: &kafka.LeastBytes{},
		},
	}
}

func (p *Producer) PublishEvent(topic string, key string, event interface{}) error {
	eventBytes, err := json.Marshal(event)
	if err != nil {
		return err
	}

	err = p.writer.WriteMessages(context.Background(),
		kafka.Message{
			Topic: topic,
			Key:   []byte(key),
			Value: eventBytes,
		},
	)
	if err != nil {
		logger.Errorf("Failed to publish event to topic %s: %v", topic, err)
		return err
	}

	logger.Infof("Published event to topic %s: %s", topic, key)

	// also publish locally so SSE/WebSocket clients get the event immediately
	events.PublishRaw(event)
	return nil
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
