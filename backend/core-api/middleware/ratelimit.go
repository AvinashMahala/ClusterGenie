package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/logger"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
	"github.com/gin-gonic/gin"
)

// RateLimitMiddleware returns a Gin middleware that uses a named bucket in the LimiterManager
func RateLimitMiddleware(manager *services.LimiterManager, bucketName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		b := manager.Get(bucketName)
		if b == nil {
			// no limiter configured for this name, allow
			c.Next()
			return
		}

		if ok := b.Allow(1); !ok {
			// log throttle occurrences for observability
			logger.Warnf("rate limit exceeded for %s %s", c.Request.Method, c.FullPath())
			// increment Prometheus metric if available
			if services.RateLimitExceeded != nil {
				services.RateLimitExceeded.WithLabelValues(bucketName, "global", "").Inc()
			}
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			c.Abort()
			return
		}
		// update available token metric
		if services.RateLimitAvailable != nil {
			avail, cap, rate := b.Status()
			services.RateLimitAvailable.WithLabelValues(bucketName, "global", "").Set(avail)
			_ = cap
			_ = rate
		}

		c.Next()
	}
}

// RateLimitMiddlewareByUserHeader uses X-User-ID (or custom header) to enforce per-user buckets
func RateLimitMiddlewareByUserHeader(manager *services.LimiterManager, bucketName string, headerName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid := c.GetHeader(headerName)
		var b services.RateLimiter
		if uid != "" {
			b = manager.GetOrCreate(bucketName, "user:"+uid)
		} else {
			b = manager.Get(bucketName)
		}

		if b == nil {
			c.Next()
			return
		}

		if ok := b.Allow(1); !ok {
			logger.Warnf("rate limit exceeded for %s %s user=%s", c.Request.Method, c.FullPath(), uid)
			if services.RateLimitExceeded != nil {
				services.RateLimitExceeded.WithLabelValues(bucketName, "user", uid).Inc()
			}
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			c.Abort()
			return
		}
		if services.RateLimitAvailable != nil {
			avail, _, _ := b.Status()
			services.RateLimitAvailable.WithLabelValues(bucketName, "user", uid).Set(avail)
		}

		c.Next()
	}
}

// RateLimitMiddlewareByClusterFromBody attempts to read JSON body and extract cluster_id to scope limiter per-cluster.
// It restores the request body so handlers can still read it.
func RateLimitMiddlewareByClusterFromBody(manager *services.LimiterManager, bucketName string, field string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// read body bytes safely
		buf, err := c.GetRawData()
		// restore body for later handlers
		if err == nil && buf != nil {
			c.Request.Body = io.NopCloser(bytes.NewBuffer(buf))
		}

		var scopeKey string
		if err == nil && buf != nil && len(buf) > 0 {
			// try an inexpensive parse for cluster_id
			var m map[string]interface{}
			if jerr := json.Unmarshal(buf, &m); jerr == nil {
				if v, ok := m[field]; ok {
					if s, ok2 := v.(string); ok2 {
						scopeKey = s
					}
				}
			}
		}

		var b services.RateLimiter
		if scopeKey != "" {
			b = manager.GetOrCreate(bucketName, "cluster:"+scopeKey)
		} else {
			b = manager.Get(bucketName)
		}

		if b == nil {
			c.Next()
			return
		}

		if ok := b.Allow(1); !ok {
			logger.Warnf("rate limit exceeded for %s %s cluster=%s", c.Request.Method, c.FullPath(), scopeKey)
			if services.RateLimitExceeded != nil {
				// cluster scope label
				services.RateLimitExceeded.WithLabelValues(bucketName, "cluster", scopeKey).Inc()
			}
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			c.Abort()
			return
		}
		if services.RateLimitAvailable != nil {
			avail, _, _ := b.Status()
			services.RateLimitAvailable.WithLabelValues(bucketName, "cluster", scopeKey).Set(avail)
		}

		c.Next()
	}
}
