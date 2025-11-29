package main

// @title ClusterGenie API
// @version 1.0
// @description REST API for ClusterGenie - DigitalOcean droplet management and monitoring
// @host localhost:8080
// @BasePath /api/v1

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/database"
	_ "github.com/AvinashMahala/ClusterGenie/backend/core-api/docs"
	eventbus "github.com/AvinashMahala/ClusterGenie/backend/core-api/kafka"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/middleware"
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
	providerRepo := repositories.NewProviderRepository(database.DB, database.Redis)
	clusterRepo := repositories.NewClusterRepository(database.DB, database.Redis)
	jobRepo := repositories.NewJobRepository(database.DB, database.Redis)
	metricRepo := repositories.NewMetricRepository(database.DB, database.Redis)
	deploymentRepo := repositories.NewDeploymentRepository(database.DB, database.Redis)
	// autoscaler repo/service (demo-mode, Redis-backed)
	autoscalerRepo := repositories.NewAutoscalerRepository(database.DB, database.Redis)
	// kafka brokers are configurable via KAFKA_BROKERS (comma-separated list)
	kafkaBrokers := getEnv("KAFKA_BROKERS", "localhost:9092")
	brokers := nilOrSplit(kafkaBrokers)
	producer := eventbus.NewProducer(brokers)

	// cluster service must exist before provisioning service to allow cluster validation
	clusterSvc := services.NewClusterService(clusterRepo)
	// scheduler needs providerRepo and dropletRepo; create before provisioning so provisioning can ask placement
	schedulerSvc := services.NewSchedulerService(providerRepo, dropletRepo)
	provisioningSvc := services.NewProvisioningService(dropletRepo, producer, clusterSvc, schedulerSvc)
	diagnosisSvc := services.NewDiagnosisService(clusterRepo)
	jobSvc := services.NewJobService(jobRepo, producer)
	monitoringSvc := services.NewMonitoringService(metricRepo)
	billingSvc := services.NewBillingService(dropletRepo, providerRepo)
	deploymentSvc := services.NewDeploymentService(deploymentRepo, provisioningSvc, producer)
	autoscalerSvc := services.NewAutoscalerService(autoscalerRepo, provisioningSvc, monitoringSvc)

	// Set service dependencies
	jobSvc.SetProvisioningService(provisioningSvc)
	jobSvc.SetClusterService(clusterSvc)

	// Initialize event handler and consumers
	eventHandler := services.NewEventHandler(jobSvc, monitoringSvc, provisioningSvc)
	consumer := eventbus.NewConsumer(brokers, "cluster-events", "cluster-genie-group")

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
		api.POST("/hello", HelloHandler())

		// Provisioning
		api.POST("/droplets", CreateDropletHandler(provisioningSvc))
		api.GET("/droplets/:id", GetDropletHandler(provisioningSvc))
		api.GET("/droplets", ListDropletsHandler(provisioningSvc))
		api.DELETE("/droplets/:id", DeleteDropletHandler(provisioningSvc))

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
		api.POST("/diagnosis/diagnose", diagMiddleware, DiagnoseClusterHandler(diagnosisSvc))

		// Clusters
		api.POST("/clusters", CreateClusterHandler(clusterSvc))
		api.GET("/clusters/:id", GetClusterHandler(clusterSvc))
		api.GET("/clusters", ListClustersHandler(clusterSvc))
		api.PUT("/clusters/:id", UpdateClusterHandler(clusterSvc))
		api.DELETE("/clusters/:id", DeleteClusterHandler(clusterSvc))

		// Health Check
		api.GET("/health/:clusterId", HealthCheckHandler(monitoringSvc))

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
		api.POST("/jobs", jobsMiddleware, CreateJobHandler(jobSvc))
		api.GET("/jobs/:id", GetJobHandler(jobSvc))
		api.GET("/jobs", ListJobsHandler(jobSvc))

		// Monitoring
		api.GET("/metrics", GetMetricsHandler(monitoringSvc))

		// Autoscaling demo endpoints
		api.POST("/autoscaling/policies", CreateAutoscalePolicyHandler(autoscalerSvc))
		api.GET("/autoscaling/policies", ListAutoscalePoliciesHandler(autoscalerSvc))
		api.GET("/autoscaling/policies/:id", GetAutoscalePolicyHandler(autoscalerSvc))
		api.PUT("/autoscaling/policies/:id", UpdateAutoscalePolicyHandler(autoscalerSvc))
		api.DELETE("/autoscaling/policies/:id", DeleteAutoscalePolicyHandler(autoscalerSvc))
		api.POST("/autoscaling/evaluate", EvaluateAutoscalingHandler(autoscalerSvc))
		// providers/scheduler
		api.GET("/providers", ListProvidersHandler(schedulerSvc))
		api.POST("/providers", CreateProviderHandler(schedulerSvc))
		api.POST("/schedule", ScheduleHandler(schedulerSvc))
		api.POST("/migrations", MigrateHandler(schedulerSvc))
		// billing
		api.GET("/billing/cluster", EstimateClusterCostHandler(billingSvc))

		// Deployments / rollout simulation
		api.POST("/deployments/start", StartDeploymentHandler(deploymentSvc))
		api.GET("/deployments/:id", GetDeploymentHandler(deploymentSvc))
		api.GET("/deployments", ListDeploymentsHandler(deploymentSvc))
		api.POST("/deployments/:id/rollback", RollbackDeploymentHandler(deploymentSvc))
	}

	// Observability endpoints for Phase 6
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
	api.GET("/observability/ratelimit", GetRateLimiterStatusHandler(limiter))

	// manage persisted limiter config (stored in Redis)
	// @Summary Persist limiter configuration
	// @Description Store or update refill/capacity for a named limiter and scope
	// @Tags observability
	// @Accept json
	// @Produce json
	// @Param request body object true "Limiter config request" example({"name":"diagnosis","scope_type":"user","scope_id":"u1","refill_rate":0.2,"capacity":5})
	// @Success 200 {object} map[string]interface{} "Config saved"
	// @Failure 400 {object} models.ErrorResponse "Invalid request"
	// @Failure 500 {object} models.ErrorResponse "Server error"
	// @Router /observability/ratelimit/config [post]
	api.POST("/observability/ratelimit/config", SaveLimiterConfigHandler(database.Redis))

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
	api.GET("/observability/ratelimit/config", GetLimiterConfigHandler(database.Redis))

	// list persisted limiter configs (supports optional name/scope filters)
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
	api.GET("/observability/ratelimit/config/list", ListLimiterConfigHandler(database.Redis))

	// delete persisted limiter config
	// @Summary Delete persisted limiter config
	// @Description Delete a stored limiter config by key or name+scope
	// @Tags observability
	// @Accept json
	// @Produce json
	// @Param request body object true "Delete config request" example({"name":"diagnosis","scope_type":"global","scope_id":""})
	// @Success 200 {object} map[string]interface{} "Deletion result"
	// @Failure 400 {object} models.ErrorResponse "Missing input"
	// @Failure 500 {object} models.ErrorResponse "Server error"
	// @Router /observability/ratelimit/config [delete]
	api.DELETE("/observability/ratelimit/config", DeleteLimiterConfigHandler(database.Redis))

	// @Summary Worker pool status
	// @Description Snapshot of worker pool (counts, queue) for observability
	// @Tags observability
	// @Accept json
	// @Produce json
	// @Success 200 {object} map[string]interface{} "Worker pool snapshot"
	// @Router /observability/workerpool [get]
	api.GET("/observability/workerpool", WorkerPoolHandler(workerPool))

	// Prometheus metrics endpoint (scrape target)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	apiPort := getEnv("API_PORT", "8080")
	log.Printf("REST API server listening on :%s", apiPort)
	log.Printf("Swagger UI available at http://localhost:%s/swagger/index.html", apiPort)
	if err := r.Run(":" + apiPort); err != nil {
		log.Fatalf("Failed to start REST server: %v", err)
	}
}

// getEnv returns value for the environment variable or the provided default
func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// nilOrSplit returns a string slice from comma-separated list, or a single default entry
func nilOrSplit(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}
