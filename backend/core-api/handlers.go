package main

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// @Summary Say hello
// @Description Returns a greeting message for the supplied name
// @Tags hello
// @Accept json
// @Produce json
// @Param request body models.HelloRequest true "Hello request"
// @Success 200 {object} models.HelloResponse "Greeting created"
// @Failure 400 {object} models.ErrorResponse "Invalid request payload"
// @Router /hello [post]
func HelloHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.HelloRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		resp := &models.HelloResponse{Message: "Hello, " + req.Name + " from ClusterGenie!"}
		c.JSON(200, resp)
	}
}

// @Summary Create a new droplet
// @Description Provisions a new droplet. Provide region/size/image and optionally a cluster_id
// @Tags droplets
// @Accept json
// @Produce json
// @Param request body models.CreateDropletRequest true "Create droplet request"
// @Success 201 {object} models.DropletResponse "Droplet created"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 500 {object} models.ErrorResponse "Server error while provisioning"
// @Router /droplets [post]
func CreateDropletHandler(svc *services.ProvisioningService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.CreateDropletRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		resp, err := svc.CreateDroplet(&req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(201, resp)
	}
}

// @Summary Get droplet by id
// @Description Returns a single droplet by id
// @Tags droplets
// @Accept json
// @Produce json
// @Param id path string true "Droplet ID"
// @Success 200 {object} models.DropletResponse "Droplet retrieved"
// @Failure 404 {object} models.ErrorResponse "Droplet not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /droplets/{id} [get]
func GetDropletHandler(svc *services.ProvisioningService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		droplet, err := svc.GetDroplet(id)
		if err != nil {
			c.JSON(404, models.ErrorResponse{Error: "Droplet not found"})
			return
		}
		c.JSON(200, &models.DropletResponse{Droplet: droplet, Message: "Droplet retrieved"})
	}
}

// @Summary List droplets
// @Description Returns a list of droplets (optionally filtered by cluster)
// @Tags droplets
// @Accept json
// @Produce json
// @Success 200 {object} models.ListDropletsResponse "List of droplets"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /droplets [get]
func ListDropletsHandler(svc *services.ProvisioningService) gin.HandlerFunc {
	return func(c *gin.Context) {
		droplets, err := svc.ListDroplets()
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, &models.ListDropletsResponse{Droplets: droplets})
	}
}

// @Summary Delete droplet
// @Description Deletes a droplet and returns a confirmation message
// @Tags droplets
// @Accept json
// @Produce json
// @Param id path string true "Droplet ID"
// @Success 200 {object} models.DeleteDropletResponse "Deletion confirmation"
// @Failure 404 {object} models.ErrorResponse "Droplet not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /droplets/{id} [delete]
func DeleteDropletHandler(svc *services.ProvisioningService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		err := svc.DeleteDroplet(id)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, &models.DeleteDropletResponse{Message: "Droplet deleted"})
	}
}

// @Summary Diagnose cluster
// @Description Run a diagnosis on the supplied cluster and get insights/recommendations
// @Tags diagnosis
// @Accept json
// @Produce json
// @Param request body models.DiagnoseClusterRequest true "Diagnose request"
// @Success 200 {object} models.DiagnoseClusterResponse "Diagnosis result"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 429 {object} models.ErrorResponse "Rate limit exceeded"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /diagnosis/diagnose [post]
func DiagnoseClusterHandler(svc *services.DiagnosisService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.DiagnoseClusterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		resp, err := svc.DiagnoseCluster(&req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, resp)
	}
}

// @Summary Create a new cluster
// @Description Create a new cluster entity
// @Tags clusters
// @Accept json
// @Produce json
// @Param request body models.CreateClusterRequest true "Create cluster request"
// @Success 201 {object} models.ClusterResponse "Cluster created"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /clusters [post]
func CreateClusterHandler(svc *services.ClusterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.CreateClusterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		resp, err := svc.CreateCluster(&req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(201, resp)
	}
}

// @Summary Get cluster by id
// @Description Retrieve a cluster by its id
// @Tags clusters
// @Accept json
// @Produce json
// @Param id path string true "Cluster ID"
// @Success 200 {object} models.ClusterResponse "Cluster retrieved"
// @Failure 404 {object} models.ErrorResponse "Cluster not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /clusters/{id} [get]
func GetClusterHandler(svc *services.ClusterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		cluster, err := svc.GetCluster(id)
		if err != nil {
			c.JSON(404, models.ErrorResponse{Error: "Cluster not found"})
			return
		}
		c.JSON(200, &models.ClusterResponse{Cluster: cluster, Message: "Cluster retrieved"})
	}
}

// @Summary List clusters
// @Description Returns a list of clusters
// @Tags clusters
// @Accept json
// @Produce json
// @Success 200 {object} models.ListClustersResponse "List of clusters"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /clusters [get]
func ListClustersHandler(svc *services.ClusterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		clusters, err := svc.ListClusters()
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, &models.ListClustersResponse{Clusters: clusters})
	}
}

// @Summary Update cluster
// @Description Update an existing cluster's fields
// @Tags clusters
// @Accept json
// @Produce json
// @Param id path string true "Cluster ID"
// @Param request body models.UpdateClusterRequest true "Update cluster request"
// @Success 200 {object} models.ClusterResponse "Updated cluster"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 404 {object} models.ErrorResponse "Cluster not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /clusters/{id} [put]
func UpdateClusterHandler(svc *services.ClusterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req models.UpdateClusterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		resp, err := svc.UpdateCluster(id, &req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, resp)
	}
}

// @Summary Delete cluster
// @Description Deletes the cluster and returns a confirmation message
// @Tags clusters
// @Accept json
// @Produce json
// @Param id path string true "Cluster ID"
// @Success 200 {object} models.DeleteClusterResponse "Deletion confirmation"
// @Failure 404 {object} models.ErrorResponse "Cluster not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /clusters/{id} [delete]
func DeleteClusterHandler(svc *services.ClusterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		resp, err := svc.DeleteCluster(id)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, resp)
	}
}

// @Summary Health check
// @Description Performs health checks on a cluster and returns the current health status and issues
// @Tags monitoring
// @Accept json
// @Produce json
// @Param clusterId path string true "Cluster ID"
// @Success 200 {object} models.HealthCheckResponse "Health status"
// @Failure 404 {object} models.ErrorResponse "Cluster not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /health/{clusterId} [get]
func HealthCheckHandler(svc *services.MonitoringService) gin.HandlerFunc {
	return func(c *gin.Context) {
		clusterID := c.Param("clusterId")
		resp, err := svc.PerformHealthCheck(clusterID)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, resp)
	}
}

// @Summary Create job
// @Description Create a background job (provision/diagnose/scale/monitor)
// @Tags jobs
// @Accept json
// @Produce json
// @Param request body models.CreateJobRequest true "Create job request"
// @Success 201 {object} models.JobResponse "Job created"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 429 {object} models.ErrorResponse "Rate limit exceeded"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /jobs [post]
func CreateJobHandler(svc *services.JobService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.CreateJobRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		resp, err := svc.CreateJob(&req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(201, resp)
	}
}

// @Summary Get job by id
// @Description Retrieve job status/result by id
// @Tags jobs
// @Accept json
// @Produce json
// @Param id path string true "Job ID"
// @Success 200 {object} models.JobResponse "Job retrieved"
// @Failure 404 {object} models.ErrorResponse "Job not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /jobs/{id} [get]
func GetJobHandler(svc *services.JobService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		job, err := svc.GetJob(id)
		if err != nil {
			c.JSON(404, models.ErrorResponse{Error: "Job not found"})
			return
		}
		c.JSON(200, &models.JobResponse{Job: job, Message: "Job retrieved"})
	}
}

// @Summary List jobs
// @Description Returns paginated jobs list with sorting options
// @Tags jobs
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param page_size query int false "Page size"
// @Param sort_by query string false "Sort column"
// @Param sort_dir query string false "Sort direction (asc/desc)"
// @Success 200 {object} models.ListJobsResponse "List of jobs"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /jobs [get]
func ListJobsHandler(svc *services.JobService) gin.HandlerFunc {
	return func(c *gin.Context) {
		page := 1
		pageSize := 5
		sortBy := c.Query("sort_by")
		sortDir := c.Query("sort_dir")
		if p := c.Query("page"); p != "" {
			if v, err := strconv.Atoi(p); err == nil && v > 0 {
				page = v
			}
		}
		if ps := c.Query("page_size"); ps != "" {
			if v, err := strconv.Atoi(ps); err == nil && v > 0 {
				pageSize = v
			}
		}

		req := &models.GetJobsRequest{Page: page, PageSize: pageSize, SortBy: sortBy, SortDir: sortDir}
		resp, err := svc.ListJobs(req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, resp)
	}
}

// @Summary Query metrics
// @Description Return metrics filtered by cluster and/or type (paginated)
// @Tags monitoring
// @Accept json
// @Produce json
// @Param cluster_id query string false "Cluster ID filter"
// @Param type query string false "Metric type (cpu/memory/disk/network)"
// @Param page query int false "Page number"
// @Param page_size query int false "Page size"
// @Success 200 {object} models.GetMetricsResponse "Metrics result"
// @Failure 400 {object} models.ErrorResponse "Bad request"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /metrics [get]
func GetMetricsHandler(svc *services.MonitoringService) gin.HandlerFunc {
	return func(c *gin.Context) {
		clusterID := c.Query("cluster_id")
		metricType := c.Query("type")
		page := 1
		pageSize := 50
		if p := c.Query("page"); p != "" {
			if v, err := strconv.Atoi(p); err == nil && v > 0 {
				page = v
			}
		}
		if ps := c.Query("page_size"); ps != "" {
			if v, err := strconv.Atoi(ps); err == nil && v > 0 {
				pageSize = v
			}
		}

		req := &models.GetMetricsRequest{
			ClusterID: clusterID,
			Type:      metricType,
			Page:      page,
			PageSize:  pageSize,
		}
		resp, err := svc.GetMetrics(req)
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, resp)
	}
}

// ==== Observability handlers ====

// @Summary Query rate limiter status
// @Description Get available tokens and configuration for a rate limiter (supports scope filters)
// @Tags observability
// @Accept json
// @Produce json
// @Param name query string true "Limiter name (e.g. diagnosis or jobs_create)"
// @Param scope_type query string false "Optional scope type (global/user/cluster)"
// @Param scope_id query string false "Optional scope id for user/cluster"
// @Success 200 {object} map[string]interface{} "Limiter status"
// @Failure 400 {object} models.ErrorResponse "Missing/invalid input"
// @Failure 404 {object} models.ErrorResponse "No such limiter"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /observability/ratelimit [get]
func GetRateLimiterStatusHandler(limiter *services.LimiterManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Query("name")
		if name == "" {
			c.JSON(400, models.ErrorResponse{Error: "name query param required (e.g. diagnosis or jobs_create)"})
			return
		}
		scopeType := c.Query("scope_type")
		scopeId := c.Query("scope_id")
		var b services.RateLimiter
		if scopeType != "" && scopeId != "" {
			scopeKey := scopeId
			if scopeType == "user" {
				scopeKey = "user:" + scopeId
			} else if scopeType == "cluster" {
				scopeKey = "cluster:" + scopeId
			}
			b = limiter.GetOrCreate(name, scopeKey)
		} else {
			b = limiter.Get(name)
		}
		if b == nil {
			c.JSON(404, models.ErrorResponse{Error: "no such limiter"})
			return
		}
		available, capacity, rate := b.Status()
		c.JSON(200, gin.H{"name": name, "available": available, "capacity": capacity, "rate_per_sec": rate})
	}
}

// @Summary Persist limiter configuration
// @Description Store or update refill/capacity for a named limiter and scope
// @Tags observability
// @Accept json
// @Produce json
// @Param request body object true "Limiter config request"
// @Success 200 {object} map[string]interface{} "Config saved"
// @Failure 400 {object} models.ErrorResponse "Invalid request"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /observability/ratelimit/config [post]
func SaveLimiterConfigHandler(redisClient *redis.Client) gin.HandlerFunc {
	// using a thin wrapper to preserve original behavior; in practice this expects a *redis.Client
	return func(c *gin.Context) {
		var body struct {
			Name      string  `json:"name"`
			ScopeType string  `json:"scope_type"`
			ScopeID   string  `json:"scope_id"`
			Refill    float64 `json:"refill_rate"`
			Capacity  float64 `json:"capacity"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		if body.Name == "" {
			c.JSON(400, models.ErrorResponse{Error: "name is required"})
			return
		}
		if redisClient == nil {
			c.JSON(500, models.ErrorResponse{Error: "redis not configured"})
			return
		}

		scopeKey := "global"
		if body.ScopeType == "user" && body.ScopeID != "" {
			scopeKey = "user:" + body.ScopeID
		} else if body.ScopeType == "cluster" && body.ScopeID != "" {
			scopeKey = "cluster:" + body.ScopeID
		}

		cfgKey := fmt.Sprintf("limiter_config:%s:%s", body.Name, scopeKey)
		m := map[string]interface{}{}
		if body.Refill > 0 {
			m["refill_rate"] = fmt.Sprintf("%f", body.Refill)
		}
		if body.Capacity > 0 {
			m["capacity"] = fmt.Sprintf("%f", body.Capacity)
		}
		if len(m) == 0 {
			c.JSON(400, models.ErrorResponse{Error: "refill_rate or capacity required"})
			return
		}
		// Attempt to call HSet on the provided redis client - this is intentionally generic
		if err := redisClient.HSet(c.Request.Context(), cfgKey, m).Err(); err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(200, gin.H{"ok": true, "config_key": cfgKey})
	}
}

// @Summary Get persisted limiter config
// @Description Retrieve persisted limiter config for a name and optional scope
// @Tags observability
// @Accept json
// @Produce json
// @Param name query string true "Limiter name"
// @Param scope_type query string false "Optional scope type"
// @Param scope_id query string false "Optional scope id"
// @Success 200 {object} map[string]interface{} "Found config"
// @Failure 400 {object} models.ErrorResponse "Missing name"
// @Failure 404 {object} models.ErrorResponse "Not found"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /observability/ratelimit/config [get]
func GetLimiterConfigHandler(redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Query("name")
		scopeType := c.Query("scope_type")
		scopeId := c.Query("scope_id")
		if name == "" {
			c.JSON(400, models.ErrorResponse{Error: "name required"})
			return
		}
		if redisClient == nil {
			c.JSON(500, models.ErrorResponse{Error: "redis not configured"})
			return
		}
		scopeKey := "global"
		if scopeType == "user" && scopeId != "" {
			scopeKey = "user:" + scopeId
		} else if scopeType == "cluster" && scopeId != "" {
			scopeKey = "cluster:" + scopeId
		}
		cfgKey := fmt.Sprintf("limiter_config:%s:%s", name, scopeKey)
		vals, err := redisClient.HGetAll(c.Request.Context(), cfgKey).Result()
		if err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}
		if len(vals) == 0 {
			c.JSON(404, models.ErrorResponse{Error: "not found"})
			return
		}
		c.JSON(200, gin.H{"name": name, "scope": scopeKey, "config": vals})
	}
}

// @Summary List persisted limiter configs
// @Description Returns list of stored limiter configs filtered by name/scope
// @Tags observability
// @Accept json
// @Produce json
// @Param name query string false "Optional limiter name filter"
// @Param scope_type query string false "Optional scope type"
// @Param scope_id query string false "Optional scope id"
// @Success 200 {object} map[string]interface{} "List of configs"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /observability/ratelimit/config/list [get]
func ListLimiterConfigHandler(redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		nameFilter := c.Query("name")
		scopeType := c.Query("scope_type")
		scopeId := c.Query("scope_id")

		if redisClient == nil {
			c.JSON(500, models.ErrorResponse{Error: "redis not configured"})
			return
		}

		// build pattern
		pattern := "limiter_config:*"
		if nameFilter != "" {
			if scopeType != "" && scopeId != "" {
				scopeKey := "global"
				if scopeType == "user" {
					scopeKey = "user:" + scopeId
				} else if scopeType == "cluster" {
					scopeKey = "cluster:" + scopeId
				}
				pattern = "limiter_config:" + nameFilter + ":" + scopeKey
			} else {
				pattern = "limiter_config:" + nameFilter + ":*"
			}
		}

		var cursor uint64
		results := []gin.H{}
		for {
			keys, cur, err := redisClient.Scan(c.Request.Context(), cursor, pattern, 100).Result()
			if err != nil {
				c.JSON(500, models.ErrorResponse{Error: err.Error()})
				return
			}
			cursor = cur
			for _, k := range keys {
				parts := strings.SplitN(k, ":", 3)
				if len(parts) < 3 {
					continue
				}
				name := parts[1]
				scope := parts[2]
				vals, err := redisClient.HGetAll(c.Request.Context(), k).Result()
				if err != nil {
					continue
				}
				results = append(results, gin.H{"key": k, "name": name, "scope": scope, "config": vals})
			}
			if cursor == 0 {
				break
			}
		}
		c.JSON(200, gin.H{"count": len(results), "items": results})
	}
}

// @Summary Delete persisted limiter config
// @Description Delete a stored limiter config by key or name+scope
// @Tags observability
// @Accept json
// @Produce json
// @Param request body object true "Delete config request"
// @Success 200 {object} map[string]interface{} "Deletion result"
// @Failure 400 {object} models.ErrorResponse "Missing input"
// @Failure 500 {object} models.ErrorResponse "Server error"
// @Router /observability/ratelimit/config [delete]
func DeleteLimiterConfigHandler(redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name      string `json:"name"`
			ScopeType string `json:"scope_type"`
			ScopeID   string `json:"scope_id"`
			Key       string `json:"key"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, models.ErrorResponse{Error: err.Error()})
			return
		}
		if redisClient == nil {
			c.JSON(500, models.ErrorResponse{Error: "redis not configured"})
			return
		}
		var cfgKey string
		if body.Key != "" {
			cfgKey = body.Key
		} else {
			if body.Name == "" {
				c.JSON(400, models.ErrorResponse{Error: "name or key required"})
				return
			}
			scopeKey := "global"
			if body.ScopeType == "user" && body.ScopeID != "" {
				scopeKey = "user:" + body.ScopeID
			} else if body.ScopeType == "cluster" && body.ScopeID != "" {
				scopeKey = "cluster:" + body.ScopeID
			}
			cfgKey = "limiter_config:" + body.Name + ":" + scopeKey
		}

		if err := redisClient.Del(c.Request.Context(), cfgKey).Err(); err != nil {
			c.JSON(500, models.ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(200, gin.H{"ok": true, "deleted": cfgKey})
	}
}

// @Summary Worker pool status
// @Description Snapshot of worker pool (counts, queue) for observability
// @Tags observability
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Worker pool snapshot"
// @Router /observability/workerpool [get]
func WorkerPoolHandler(pool *services.WorkerPool) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(200, gin.H{
			"worker_count":   pool.WorkerCount(),
			"active_workers": pool.ActiveWorkers(),
			"queue_length":   pool.QueueLength(),
			"queue_capacity": pool.QueueCapacity(),
			"queued_ids":     pool.SnapshotQueue(),
		})
	}
}
