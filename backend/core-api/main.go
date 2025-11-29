package main

// @title ClusterGenie API
// @version 1.0
// @description REST API for ClusterGenie - DigitalOcean droplet management and monitoring
// @host localhost:8080
// @BasePath /api/v1

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"

	"strings"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/database"
	_ "github.com/AvinashMahala/ClusterGenie/backend/core-api/docs"
	eventbus "github.com/AvinashMahala/ClusterGenie/backend/core-api/kafka"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/middleware"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Load local .env (optional) to make development easier
	if err := godotenv.Load(); err != nil {
		log.Println(".env not found or failed to load, falling back to environment variables")
	} else {
		log.Println("Loaded .env file for configuration")
	}
	// Initialize database
	database.InitDB()
	defer database.CloseDB()

	// Initialize dependencies
	dropletRepo := repositories.NewDropletRepository(database.DB, database.Redis)
	clusterRepo := repositories.NewClusterRepository(database.DB, database.Redis)
	jobRepo := repositories.NewJobRepository(database.DB, database.Redis)
	metricRepo := repositories.NewMetricRepository(database.DB, database.Redis)
	producer := eventbus.NewProducer([]string{"localhost:9092"})

	// cluster service must exist before provisioning service to allow cluster validation
	clusterSvc := services.NewClusterService(clusterRepo)
	provisioningSvc := services.NewProvisioningService(dropletRepo, producer, clusterSvc)
	diagnosisSvc := services.NewDiagnosisService(clusterRepo)
	jobSvc := services.NewJobService(jobRepo, producer)
	monitoringSvc := services.NewMonitoringService(metricRepo)

	// Set service dependencies
	jobSvc.SetProvisioningService(provisioningSvc)
	jobSvc.SetClusterService(clusterSvc)

	// Initialize event handler and consumers
	eventHandler := services.NewEventHandler(jobSvc, monitoringSvc, provisioningSvc)
	consumer := eventbus.NewConsumer([]string{"localhost:9092"}, "cluster-events", "cluster-genie-group")

	// Start event consumer in background
	go func() {
		log.Println("Starting event consumer...")
		consumer.ConsumeEvents(eventHandler.HandleClusterEvent)
	}()
	defer consumer.Close()

	// Initialize LimiterManager and worker pool for Phase 6
	limiter := services.NewLimiterManager(database.Redis)
	// configurable defaults (env vars)
	diagRate := 0.2
	diagCap := 5.0
	if v := os.Getenv("CLUSTERGENIE_DIAG_RATE"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			diagRate = f
		}
	}
	if v := os.Getenv("CLUSTERGENIE_DIAG_CAP"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			diagCap = f
		}
	}
	limiter.Add("diagnosis", services.NewTokenBucket(diagRate, diagCap))
	limiter.AddDefaultConfig("diagnosis", services.BucketConfig{RefillRate: diagRate, Capacity: diagCap})

	jobRate := 0.1
	jobCap := 3.0
	if v := os.Getenv("CLUSTERGENIE_JOBS_RATE"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			jobRate = f
		}
	}
	if v := os.Getenv("CLUSTERGENIE_JOBS_CAP"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			jobCap = f
		}
	}
	limiter.Add("jobs_create", services.NewTokenBucket(jobRate, jobCap))
	limiter.AddDefaultConfig("jobs_create", services.BucketConfig{RefillRate: jobRate, Capacity: jobCap})

	// create and start worker pool for job processing
	// worker pool configurable
	workerCount := 4
	if v := os.Getenv("CLUSTERGENIE_WORKER_COUNT"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			workerCount = n
		}
	}
	workerQueueSize := 100
	if v := os.Getenv("CLUSTERGENIE_WORKER_QUEUE"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			workerQueueSize = n
		}
	}

	workerPool := services.NewWorkerPool(workerCount, workerQueueSize, func(jobID string) {
		// delegate to JobService for actual processing
		_ = jobSvc.ProcessJob(jobID)
	})
	workerPool.Start()
	// attach worker pool to job service so CreateJob uses it
	jobSvc.SetWorkerPool(workerPool)

	// Register Prometheus metrics
	services.RegisterPrometheusMetrics()

	// start a background goroutine to sync worker pool & limiter stats into Prometheus
	go func() {
		for {
			// worker pool metrics
			services.WorkerPoolQueueLength.Set(float64(workerPool.QueueLength()))
			services.WorkerPoolActiveWorkers.Set(float64(workerPool.ActiveWorkers()))
			services.WorkerPoolCount.Set(float64(workerPool.WorkerCount()))

			// limiter snapshot -> update available tokens per scope
			snap := limiter.SnapshotStatus()
			for name, scopes := range snap {
				for scope, s := range scopes {
					scopeType := "global"
					scopeID := ""
					if scope != "" {
						if len(scope) > 5 && scope[:5] == "user:" {
							scopeType = "user"
							scopeID = scope[5:]
						} else if len(scope) > 8 && scope[:8] == "cluster:" {
							scopeType = "cluster"
							scopeID = scope[8:]
						} else {
							scopeID = scope
						}
					}
					services.RateLimitAvailable.WithLabelValues(name, scopeType, scopeID).Set(s.Available)
				}
			}

			// sleep between updates
			time.Sleep(2 * time.Second)
		}
	}()

	// Initialize Gin router for REST API
	// expose observability now that worker pool and limiter exist
	r := gin.Default()
	r.Use(cors.Default())
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	api := r.Group("/api/v1")
	{
		// Hello
		// @Summary Say hello
		// @Description Returns a greeting message
		// @Tags hello
		// @Accept json
		// @Produce json
		// @Param request body models.HelloRequest true "Hello request"
		// @Success 200 {object} models.HelloResponse
		// @Router /hello [post]
		api.POST("/hello", func(c *gin.Context) {
			var req models.HelloRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp := &models.HelloResponse{Message: "Hello, " + req.Name + " from ClusterGenie!"}
			c.JSON(200, resp)
		})

		// Provisioning
		api.POST("/droplets", func(c *gin.Context) {
			var req models.CreateDropletRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp, err := provisioningSvc.CreateDroplet(&req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(201, resp)
		})
		api.GET("/droplets/:id", func(c *gin.Context) {
			id := c.Param("id")
			droplet, err := provisioningSvc.GetDroplet(id)
			if err != nil {
				c.JSON(404, gin.H{"error": "Droplet not found"})
				return
			}
			c.JSON(200, &models.DropletResponse{Droplet: droplet, Message: "Droplet retrieved"})
		})
		api.GET("/droplets", func(c *gin.Context) {
			droplets, err := provisioningSvc.ListDroplets()
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, &models.ListDropletsResponse{Droplets: droplets})
		})
		api.DELETE("/droplets/:id", func(c *gin.Context) {
			id := c.Param("id")
			err := provisioningSvc.DeleteDroplet(id)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, &models.DeleteDropletResponse{Message: "Droplet deleted"})
		})

		// Diagnosis (scope configurable: cluster/user/global)
		diagScope := os.Getenv("CLUSTERGENIE_DIAG_SCOPE")
		if diagScope == "" {
			diagScope = "cluster"
		}
		diagMiddleware := middleware.RateLimitMiddleware(limiter, "diagnosis")
		if diagScope == "cluster" {
			diagMiddleware = middleware.RateLimitMiddlewareByClusterFromBody(limiter, "diagnosis", "cluster_id")
		} else if diagScope == "user" {
			diagMiddleware = middleware.RateLimitMiddlewareByUserHeader(limiter, "diagnosis", "X-User-ID")
		}
		api.POST("/diagnosis/diagnose", diagMiddleware, func(c *gin.Context) {
			var req models.DiagnoseClusterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp, err := diagnosisSvc.DiagnoseCluster(&req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, resp)
		})

		// Clusters
		api.POST("/clusters", func(c *gin.Context) {
			var req models.CreateClusterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp, err := clusterSvc.CreateCluster(&req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(201, resp)
		})
		api.GET("/clusters/:id", func(c *gin.Context) {
			id := c.Param("id")
			cluster, err := clusterSvc.GetCluster(id)
			if err != nil {
				c.JSON(404, gin.H{"error": "Cluster not found"})
				return
			}
			c.JSON(200, &models.ClusterResponse{Cluster: cluster, Message: "Cluster retrieved"})
		})
		api.GET("/clusters", func(c *gin.Context) {
			clusters, err := clusterSvc.ListClusters()
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, &models.ListClustersResponse{Clusters: clusters})
		})
		api.PUT("/clusters/:id", func(c *gin.Context) {
			id := c.Param("id")
			var req models.UpdateClusterRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp, err := clusterSvc.UpdateCluster(id, &req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, resp)
		})
		api.DELETE("/clusters/:id", func(c *gin.Context) {
			id := c.Param("id")
			resp, err := clusterSvc.DeleteCluster(id)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, resp)
		})

		// Health Check
		api.GET("/health/:clusterId", func(c *gin.Context) {
			clusterID := c.Param("clusterId")
			resp, err := monitoringSvc.PerformHealthCheck(clusterID)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, resp)
		})

		// Jobs (scope configurable: user/cluster/global)
		jobsScope := os.Getenv("CLUSTERGENIE_JOBS_SCOPE")
		if jobsScope == "" {
			jobsScope = "user"
		}
		jobsMiddleware := middleware.RateLimitMiddleware(limiter, "jobs_create")
		if jobsScope == "user" {
			jobsMiddleware = middleware.RateLimitMiddlewareByUserHeader(limiter, "jobs_create", "X-User-ID")
		} else if jobsScope == "cluster" {
			jobsMiddleware = middleware.RateLimitMiddlewareByClusterFromBody(limiter, "jobs_create", "cluster_id")
		}
		api.POST("/jobs", jobsMiddleware, func(c *gin.Context) {
			var req models.CreateJobRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp, err := jobSvc.CreateJob(&req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(201, resp)
		})
		api.GET("/jobs/:id", func(c *gin.Context) {
			id := c.Param("id")
			job, err := jobSvc.GetJob(id)
			if err != nil {
				c.JSON(404, gin.H{"error": "Job not found"})
				return
			}
			c.JSON(200, &models.JobResponse{Job: job, Message: "Job retrieved"})
		})
		api.GET("/jobs", func(c *gin.Context) {
			jobs, err := jobSvc.ListJobs()
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, &models.ListJobsResponse{Jobs: jobs})
		})

		// Monitoring
		api.GET("/metrics", func(c *gin.Context) {
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
			resp, err := monitoringSvc.GetMetrics(req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, resp)
		})
	}

	// Observability endpoints for Phase 6
	api.GET("/observability/ratelimit", func(c *gin.Context) {
		name := c.Query("name")
		if name == "" {
			c.JSON(400, gin.H{"error": "name query param required (e.g. diagnosis or jobs_create)"})
			return
		}
		// allow optional scope information
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
			c.JSON(404, gin.H{"error": "no such limiter"})
			return
		}
		available, capacity, rate := b.Status()
		c.JSON(200, gin.H{"name": name, "available": available, "capacity": capacity, "rate_per_sec": rate})
	})

	// manage persisted limiter config (stored in Redis)
	api.POST("/observability/ratelimit/config", func(c *gin.Context) {
		var body struct {
			Name      string  `json:"name"`
			ScopeType string  `json:"scope_type"`
			ScopeID   string  `json:"scope_id"`
			Refill    float64 `json:"refill_rate"`
			Capacity  float64 `json:"capacity"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if body.Name == "" {
			c.JSON(400, gin.H{"error": "name is required"})
			return
		}
		// scope key
		scopeKey := "global"
		if body.ScopeType == "user" && body.ScopeID != "" {
			scopeKey = "user:" + body.ScopeID
		} else if body.ScopeType == "cluster" && body.ScopeID != "" {
			scopeKey = "cluster:" + body.ScopeID
		}

		if database.Redis == nil {
			c.JSON(500, gin.H{"error": "redis not configured"})
			return
		}

		cfgKey := "limiter_config:" + body.Name + ":" + scopeKey
		m := map[string]interface{}{}
		if body.Refill > 0 {
			m["refill_rate"] = fmt.Sprintf("%f", body.Refill)
		}
		if body.Capacity > 0 {
			m["capacity"] = fmt.Sprintf("%f", body.Capacity)
		}
		if len(m) == 0 {
			c.JSON(400, gin.H{"error": "refill_rate or capacity required"})
			return
		}
		if err := database.Redis.HSet(c.Request.Context(), cfgKey, m).Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"ok": true, "config_key": cfgKey})
	})

	api.GET("/observability/ratelimit/config", func(c *gin.Context) {
		name := c.Query("name")
		scopeType := c.Query("scope_type")
		scopeId := c.Query("scope_id")
		if name == "" {
			c.JSON(400, gin.H{"error": "name required"})
			return
		}
		scopeKey := "global"
		if scopeType == "user" && scopeId != "" {
			scopeKey = "user:" + scopeId
		} else if scopeType == "cluster" && scopeId != "" {
			scopeKey = "cluster:" + scopeId
		}
		if database.Redis == nil {
			c.JSON(500, gin.H{"error": "redis not configured"})
			return
		}
		cfgKey := "limiter_config:" + name + ":" + scopeKey
		vals, err := database.Redis.HGetAll(c.Request.Context(), cfgKey).Result()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		if len(vals) == 0 {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		c.JSON(200, gin.H{"name": name, "scope": scopeKey, "config": vals})
	})

	// list persisted limiter configs (supports optional name/scope filters)
	api.GET("/observability/ratelimit/config/list", func(c *gin.Context) {
		nameFilter := c.Query("name")
		scopeType := c.Query("scope_type")
		scopeId := c.Query("scope_id")

		if database.Redis == nil {
			c.JSON(500, gin.H{"error": "redis not configured"})
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

		// scan through keys and return configs
		var cursor uint64
		results := []gin.H{}
		for {
			keys, cur, err := database.Redis.Scan(c.Request.Context(), cursor, pattern, 100).Result()
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			cursor = cur
			for _, k := range keys {
				// keys like limiter_config:<name>:<scope>
				parts := strings.SplitN(k, ":", 3)
				if len(parts) < 3 {
					continue
				}
				name := parts[1]
				scope := parts[2]
				vals, err := database.Redis.HGetAll(c.Request.Context(), k).Result()
				if err != nil {
					// collect but continue
					continue
				}
				results = append(results, gin.H{"key": k, "name": name, "scope": scope, "config": vals})
			}
			if cursor == 0 {
				break
			}
		}
		c.JSON(200, gin.H{"count": len(results), "items": results})
	})

	// delete persisted limiter config
	api.DELETE("/observability/ratelimit/config", func(c *gin.Context) {
		var body struct {
			Name      string `json:"name"`
			ScopeType string `json:"scope_type"`
			ScopeID   string `json:"scope_id"`
			Key       string `json:"key"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if database.Redis == nil {
			c.JSON(500, gin.H{"error": "redis not configured"})
			return
		}

		var cfgKey string
		if body.Key != "" {
			cfgKey = body.Key
		} else {
			if body.Name == "" {
				c.JSON(400, gin.H{"error": "name or key required"})
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

		if err := database.Redis.Del(c.Request.Context(), cfgKey).Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"ok": true, "deleted": cfgKey})
	})

	api.GET("/observability/workerpool", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"worker_count":   workerPool.WorkerCount(),
			"active_workers": workerPool.ActiveWorkers(),
			"queue_length":   workerPool.QueueLength(),
			"queue_capacity": workerPool.QueueCapacity(),
			"queued_ids":     workerPool.SnapshotQueue(),
		})
	})

	// Prometheus metrics endpoint (scrape target)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	log.Println("REST API server listening on :8080")
	log.Println("Swagger UI available at http://localhost:8080/swagger/index.html")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start REST server: %v", err)
	}
}
