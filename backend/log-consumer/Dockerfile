# Build log-consumer binary
FROM golang:1.24 AS builder
WORKDIR /src

# Copy go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download
COPY . .
WORKDIR /src/log-consumer

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -a -installsuffix cgo -ldflags "-s -w" -o /bin/log-consumer main.go

# Small runtime image (Debian-slim so binary linked to glibc can run)
FROM debian:stable-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /bin/log-consumer /bin/log-consumer
ENTRYPOINT ["/bin/log-consumer"]
