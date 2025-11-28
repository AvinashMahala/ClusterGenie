package main

// @title ClusterGenie API
// @version 1.0
// @description REST API for ClusterGenie - DigitalOcean droplet management and monitoring
// @host localhost:8080
// @BasePath /api/v1

import (
	"log"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/database"
	_ "github.com/AvinashMahala/ClusterGenie/backend/core-api/docs"
	eventbus "github.com/AvinashMahala/ClusterGenie/backend/core-api/kafka"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Initialize database
	database.InitDB()
	defer database.CloseDB()

	// Initialize dependencies
	dropletRepo := repositories.NewDropletRepository(database.DB, database.Redis)
	clusterRepo := repositories.NewClusterRepository(database.DB, database.Redis)
	jobRepo := repositories.NewJobRepository(database.DB, database.Redis)
	metricRepo := repositories.NewMetricRepository(database.DB, database.Redis)
	producer := eventbus.NewProducer([]string{"localhost:9092"})

	provisioningSvc := services.NewProvisioningService(dropletRepo, producer)
	diagnosisSvc := services.NewDiagnosisService(clusterRepo)
	jobSvc := services.NewJobService(jobRepo)
	monitoringSvc := services.NewMonitoringService(metricRepo)

	// Initialize Gin router for REST API
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

		// Diagnosis
		api.POST("/diagnosis/diagnose", func(c *gin.Context) {
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

		// Jobs
		api.POST("/jobs", func(c *gin.Context) {
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
			req := &models.GetMetricsRequest{
				ClusterID: clusterID,
				Type:      metricType,
			}
			resp, err := monitoringSvc.GetMetrics(req)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, resp)
		})
	}

	log.Println("REST API server listening on :8080")
	log.Println("Swagger UI available at http://localhost:8080/swagger/index.html")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start REST server: %v", err)
	}
}
