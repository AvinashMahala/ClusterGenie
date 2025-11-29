// backend/core-api/repositories/jobRepository.go

package repositories

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type JobRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewJobRepository(db *gorm.DB, redis *redis.Client) interfaces.JobRepository {
	return &JobRepository{
		db:    db,
		redis: redis,
	}
}

func (r *JobRepository) CreateJob(req *models.CreateJobRequest) (*models.JobResponse, error) {
	id := "job-" + req.Type + "-" + time.Now().Format("20060102150405")

	// Convert parameters map to JSON string
	var parameters string
	if req.Parameters != nil {
		paramsBytes, err := json.Marshal(req.Parameters)
		if err != nil {
			return nil, err
		}
		parameters = string(paramsBytes)
	}

	job := &models.Job{
		ID:         id,
		Type:       req.Type,
		Status:     "pending",
		Progress:   0,
		TraceID:    uuid.NewString(),
		CreatedAt:  time.Now(),
		Parameters: parameters,
	}

	if err := r.db.Create(job).Error; err != nil {
		return nil, err
	}

	return &models.JobResponse{
		Job:     job,
		Message: "Job created successfully",
	}, nil
}

func (r *JobRepository) GetJob(id string) (*models.Job, error) {
	var job models.Job
	if err := r.db.First(&job, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("job not found")
		}
		return nil, err
	}
	return &job, nil
}

func (r *JobRepository) ListJobs(req *models.GetJobsRequest) (*models.ListJobsResponse, error) {
	var jobs []*models.Job

	// Pagination defaults
	if req.PageSize <= 0 {
		req.PageSize = 50
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	query := r.db.Model(&models.Job{})

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	offset := (req.Page - 1) * req.PageSize

	// Sorting
	order := "created_at desc"
	if req.SortBy != "" {
		// allow only a few known sort fields for safety
		switch req.SortBy {
		case "created_at":
			order = "created_at"
		case "id":
			order = "id"
		default:
			order = "created_at"
		}
	}
	if req.SortDir == "desc" || req.SortDir == "" {
		order = order + " desc"
	} else {
		order = order + " asc"
	}

	if err := query.Order(order).Limit(req.PageSize).Offset(offset).Find(&jobs).Error; err != nil {
		return nil, err
	}

	return &models.ListJobsResponse{
		Jobs:     jobs,
		Page:     req.Page,
		PageSize: req.PageSize,
		Total:    total,
	}, nil
}

func (r *JobRepository) UpdateJobStatus(id string, status string) error {
	var job models.Job
	if err := r.db.First(&job, "id = ?", id).Error; err != nil {
		return err
	}

	job.Status = status
	// If marking running, ensure there's a progress baseline
	if status == "running" && job.Progress == 0 {
		job.Progress = 5
	}
	if status == "completed" || status == "failed" {
		now := time.Now()
		job.CompletedAt = &now
		if status == "completed" {
			job.Progress = 100
		}
	}

	return r.db.Save(&job).Error
}

func (r *JobRepository) UpdateJobProgress(id string, progress int, message string) error {
	var job models.Job
	if err := r.db.First(&job, "id = ?", id).Error; err != nil {
		return err
	}

	job.Progress = progress
	// if progress reached 100, mark completed
	if progress >= 100 {
		job.Status = "completed"
		now := time.Now()
		job.CompletedAt = &now
	} else if job.Status == "pending" {
		job.Status = "running"
	}

	if message != "" {
		job.Result = message
	}

	return r.db.Save(&job).Error
}
