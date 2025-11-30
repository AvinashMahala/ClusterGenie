package logger

import (
	"encoding/json"
	"os"
	"testing"
)

func TestInfoEmitsJSON(t *testing.T) {
	Init("unittest-service", "test")

	r, w, _ := os.Pipe()
	stdout := os.Stdout
	os.Stdout = w

	Info("hello world")

	_ = w.Close()
	os.Stdout = stdout

	var out []byte
	buf := make([]byte, 4096)
	n, _ := r.Read(buf)
	out = buf[:n]

	var parsed map[string]interface{}
	if err := json.Unmarshal(out, &parsed); err != nil {
		t.Fatalf("expected json output, got err=%v raw=%s", err, string(out))
	}

	if parsed["service"] != "unittest-service" {
		t.Fatalf("expected service to be set, got %v", parsed["service"])
	}
	if parsed["environment"] != "test" {
		t.Fatalf("expected environment to be set, got %v", parsed["environment"])
	}
}
