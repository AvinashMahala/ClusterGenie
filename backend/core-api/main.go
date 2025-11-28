package main

import (
	"context"
	"log"
	"net"
	"time"

	_ "github.com/AvinashMahala/ClusterGenie/backend/core-api/docs"
	eventbus "github.com/AvinashMahala/ClusterGenie/backend/core-api/kafka"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
	proto "github.com/AvinashMahala/ClusterGenie/backend/shared/proto"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"google.golang.org/grpc"
)

type server struct {
	proto.UnimplementedHelloServiceServer
	proto.UnimplementedProvisioningServiceServer
	proto.UnimplementedDiagnosisServiceServer
	proto.UnimplementedJobServiceServer
	proto.UnimplementedMonitoringServiceServer
	provisioningService *services.ProvisioningService
	diagnosisService    *services.DiagnosisService
	jobService          *services.JobService
	monitoringService   *services.MonitoringService
}

func (s *server) SayHello(ctx context.Context, req *proto.HelloRequest) (*proto.HelloResponse, error) {
	return &proto.HelloResponse{Message: "Hello, " + req.GetName() + " from ClusterGenie!"}, nil
}

func (s *server) CreateDroplet(ctx context.Context, req *proto.CreateDropletRequest) (*proto.DropletResponse, error) {
	// Convert proto to model
	createReq := &models.CreateDropletRequest{
		Name:   req.GetName(),
		Region: req.GetRegion(),
		Size:   req.GetSize(),
		Image:  req.GetImage(),
	}
	resp, err := s.provisioningService.CreateDroplet(createReq)
	if err != nil {
		return nil, err
	}
	// Convert model to proto
	droplet := &proto.Droplet{
		Id:        resp.Droplet.ID,
		Name:      resp.Droplet.Name,
		Region:    resp.Droplet.Region,
		Size:      resp.Droplet.Size,
		Image:     resp.Droplet.Image,
		Status:    resp.Droplet.Status,
		CreatedAt: resp.Droplet.CreatedAt.Format(time.RFC3339),
	}
	if resp.Droplet.IPAddress != nil {
		droplet.IpAddress = *resp.Droplet.IPAddress
	}
	return &proto.DropletResponse{
		Droplet: droplet,
		Message: resp.Message,
	}, nil
}

func (s *server) GetDroplet(ctx context.Context, req *proto.GetDropletRequest) (*proto.DropletResponse, error) {
	droplet, err := s.provisioningService.GetDroplet(req.GetId())
	if err != nil {
		return nil, err
	}
	protoDroplet := &proto.Droplet{
		Id:        droplet.ID,
		Name:      droplet.Name,
		Region:    droplet.Region,
		Size:      droplet.Size,
		Image:     droplet.Image,
		Status:    droplet.Status,
		CreatedAt: droplet.CreatedAt.Format(time.RFC3339),
	}
	if droplet.IPAddress != nil {
		protoDroplet.IpAddress = *droplet.IPAddress
	}
	return &proto.DropletResponse{
		Droplet: protoDroplet,
		Message: "Droplet retrieved",
	}, nil
}

func (s *server) ListDroplets(ctx context.Context, req *proto.ListDropletsRequest) (*proto.ListDropletsResponse, error) {
	droplets, err := s.provisioningService.ListDroplets()
	if err != nil {
		return nil, err
	}
	var protoDroplets []*proto.Droplet
	for _, d := range droplets {
		pd := &proto.Droplet{
			Id:        d.ID,
			Name:      d.Name,
			Region:    d.Region,
			Size:      d.Size,
			Image:     d.Image,
			Status:    d.Status,
			CreatedAt: d.CreatedAt.Format(time.RFC3339),
		}
		if d.IPAddress != nil {
			pd.IpAddress = *d.IPAddress
		}
		protoDroplets = append(protoDroplets, pd)
	}
	return &proto.ListDropletsResponse{
		Droplets: protoDroplets,
	}, nil
}

func (s *server) DeleteDroplet(ctx context.Context, req *proto.DeleteDropletRequest) (*proto.DeleteDropletResponse, error) {
	err := s.provisioningService.DeleteDroplet(req.GetId())
	if err != nil {
		return nil, err
	}
	return &proto.DeleteDropletResponse{
		Message: "Droplet deleted",
	}, nil
}

// Diagnosis Service Handlers
func (s *server) DiagnoseCluster(ctx context.Context, req *proto.DiagnoseClusterRequest) (*proto.DiagnoseClusterResponse, error) {
	diagnoseReq := &models.DiagnoseClusterRequest{
		ClusterID: req.GetClusterId(),
	}

	resp, err := s.diagnosisService.DiagnoseCluster(diagnoseReq)
	if err != nil {
		return nil, err
	}

	// Convert cluster to proto
	cluster := &proto.Cluster{
		Id:          resp.Cluster.ID,
		Name:        resp.Cluster.Name,
		Region:      resp.Cluster.Region,
		Droplets:    resp.Cluster.Droplets,
		Status:      resp.Cluster.Status,
		LastChecked: resp.Cluster.LastChecked.Format(time.RFC3339),
	}

	return &proto.DiagnoseClusterResponse{
		Cluster:         cluster,
		Insights:        resp.Insights,
		Recommendations: resp.Recommendations,
	}, nil
}

// Job Service Handlers
func (s *server) CreateJob(ctx context.Context, req *proto.CreateJobRequest) (*proto.JobResponse, error) {
	createReq := &models.CreateJobRequest{
		Type:       req.GetType(),
		Parameters: req.GetParameters(),
	}

	resp, err := s.jobService.CreateJob(createReq)
	if err != nil {
		return nil, err
	}

	job := &proto.Job{
		Id:        resp.Job.ID,
		Type:      resp.Job.Type,
		Status:    resp.Job.Status,
		CreatedAt: resp.Job.CreatedAt.Format(time.RFC3339),
	}

	if resp.Job.CompletedAt != nil {
		job.CompletedAt = resp.Job.CompletedAt.Format(time.RFC3339)
	}
	if resp.Job.Result != "" {
		job.Result = resp.Job.Result
	}
	if resp.Job.Error != "" {
		job.Error = resp.Job.Error
	}

	return &proto.JobResponse{
		Job:     job,
		Message: resp.Message,
	}, nil
}

func (s *server) GetJob(ctx context.Context, req *proto.GetJobRequest) (*proto.JobResponse, error) {
	job, err := s.jobService.GetJob(req.GetId())
	if err != nil {
		return nil, err
	}

	pJob := &proto.Job{
		Id:        job.ID,
		Type:      job.Type,
		Status:    job.Status,
		CreatedAt: job.CreatedAt.Format(time.RFC3339),
	}

	if job.CompletedAt != nil {
		pJob.CompletedAt = job.CompletedAt.Format(time.RFC3339)
	}
	if job.Result != "" {
		pJob.Result = job.Result
	}
	if job.Error != "" {
		pJob.Error = job.Error
	}

	return &proto.JobResponse{
		Job:     pJob,
		Message: "Job retrieved successfully",
	}, nil
}

func (s *server) ListJobs(ctx context.Context, req *proto.ListJobsRequest) (*proto.ListJobsResponse, error) {
	jobs, err := s.jobService.ListJobs()
	if err != nil {
		return nil, err
	}

	protoJobs := make([]*proto.Job, len(jobs))
	for i, job := range jobs {
		pJob := &proto.Job{
			Id:        job.ID,
			Type:      job.Type,
			Status:    job.Status,
			CreatedAt: job.CreatedAt.Format(time.RFC3339),
		}

		if job.CompletedAt != nil {
			pJob.CompletedAt = job.CompletedAt.Format(time.RFC3339)
		}
		if job.Result != "" {
			pJob.Result = job.Result
		}
		if job.Error != "" {
			pJob.Error = job.Error
		}

		protoJobs[i] = pJob
	}

	return &proto.ListJobsResponse{
		Jobs: protoJobs,
	}, nil
}

// Monitoring Service Handlers
func (s *server) GetMetrics(ctx context.Context, req *proto.GetMetricsRequest) (*proto.GetMetricsResponse, error) {
	getReq := &models.GetMetricsRequest{
		ClusterID: req.GetClusterId(),
		Type:      req.GetType(),
	}

	resp, err := s.monitoringService.GetMetrics(getReq)
	if err != nil {
		return nil, err
	}

	protoMetrics := make([]*proto.Metric, len(resp.Metrics))
	for i, metric := range resp.Metrics {
		protoMetrics[i] = &proto.Metric{
			Id:        metric.ID,
			ClusterId: metric.ClusterID,
			Type:      metric.Type,
			Value:     metric.Value,
			Timestamp: metric.Timestamp.Format(time.RFC3339),
			Unit:      metric.Unit,
		}
	}

	return &proto.GetMetricsResponse{
		Metrics: protoMetrics,
		Period:  resp.Period,
	}, nil
}

func main() {
	// Initialize dependencies
	dropletRepo := repositories.NewDropletRepository()
	clusterRepo := repositories.NewClusterRepository()
	jobRepo := repositories.NewJobRepository()
	metricRepo := repositories.NewMetricRepository()
	producer := eventbus.NewProducer([]string{"localhost:9092"})

	provisioningSvc := services.NewProvisioningService(dropletRepo, producer)
	diagnosisSvc := services.NewDiagnosisService(clusterRepo)
	jobSvc := services.NewJobService(jobRepo)
	monitoringSvc := services.NewMonitoringService(metricRepo)

	// Initialize Gin router for REST API
	r := gin.Default()
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	api := r.Group("/api/v1")
	{
		// @Summary Say Hello
		// @Description Say hello to the user
		// @Accept json
		// @Produce json
		// @Param request body models.HelloRequest true "Hello Request"
		// @Success 200 {object} models.HelloResponse
		// @Router /api/v1/hello [post]
		api.POST("/hello", func(c *gin.Context) {
			var req models.HelloRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}
			resp := &models.HelloResponse{Message: "Hello, " + req.Name + " from ClusterGenie!"}
			c.JSON(200, resp)
		})
		// Add more routes here as implemented
	}

	// Start REST server in a goroutine
	go func() {
		log.Println("REST API server listening on :8080")
		if err := r.Run(":8080"); err != nil {
			log.Fatalf("Failed to start REST server: %v", err)
		}
	}()

	// gRPC server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	server := &server{
		provisioningService: provisioningSvc,
		diagnosisService:    diagnosisSvc,
		jobService:          jobSvc,
		monitoringService:   monitoringSvc,
	}
	proto.RegisterHelloServiceServer(s, server)
	proto.RegisterProvisioningServiceServer(s, server)
	proto.RegisterDiagnosisServiceServer(s, server)
	proto.RegisterJobServiceServer(s, server)
	proto.RegisterMonitoringServiceServer(s, server)

	log.Println("gRPC server listening on :50051")
	log.Println("Hot reload enabled with Air")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}
