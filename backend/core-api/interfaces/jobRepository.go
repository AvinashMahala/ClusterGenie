// backend/core-api/interfaces/jobRepository.go

package interfaces

import "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"

type JobRepository interface {
	CreateJob(req *models.CreateJobRequest) (*models.JobResponse, error)
	GetJob(id string) (*models.Job, error)
	ListJobs(req *models.GetJobsRequest) (*models.ListJobsResponse, error)
	UpdateJobStatus(id string, status string) error
	UpdateJobProgress(id string, progress int, message string) error
}
