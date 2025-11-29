// backend/core-api/services/diagnosisService.go

package services

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/sashabaranov/go-openai"
)

type DiagnosisService struct {
	clusterRepo  interfaces.ClusterRepository
	openaiClient *openai.Client
}

func NewDiagnosisService(clusterRepo interfaces.ClusterRepository) *DiagnosisService {
	var client *openai.Client
	if apiKey := os.Getenv("OPENAI_API_KEY"); apiKey != "" {
		client = openai.NewClient(apiKey)
	}

	return &DiagnosisService{
		clusterRepo:  clusterRepo,
		openaiClient: client,
	}
}

func (s *DiagnosisService) DiagnoseCluster(req *models.DiagnoseClusterRequest) (*models.DiagnoseClusterResponse, error) {
	// Get cluster information
	cluster, err := s.clusterRepo.GetCluster(req.ClusterID)
	if err != nil {
		return nil, err
	}

	var insights, recommendations []string

	if s.openaiClient != nil {
		// Use real LLM
		insights, recommendations, err = s.generateAIDiagnosis(cluster)
		if err != nil {
			// Fallback to mock
			insights = s.generateInsights(cluster)
			recommendations = s.generateRecommendations(cluster)
		}
	} else {
		// Use mock diagnosis
		insights = s.generateInsights(cluster)
		recommendations = s.generateRecommendations(cluster)
	}

	return &models.DiagnoseClusterResponse{
		Cluster:         cluster,
		Insights:        insights,
		Recommendations: recommendations,
	}, nil
}

func (s *DiagnosisService) generateAIDiagnosis(cluster *models.Cluster) ([]string, []string, error) {
	prompt := fmt.Sprintf(`Analyze this cluster configuration and provide insights and recommendations:

Cluster ID: %s
Name: %s
Region: %s
Status: %s
Number of droplets: %d

Please provide:
1. Key insights about the cluster health and configuration
2. Specific recommendations for improvement

Format your response as:
INSIGHTS:
- insight 1
- insight 2

RECOMMENDATIONS:
- recommendation 1
- recommendation 2`, cluster.ID, cluster.Name, cluster.Region, cluster.Status, len(cluster.Droplets))

	resp, err := s.openaiClient.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
		},
	)

	if err != nil {
		return nil, nil, err
	}

	content := resp.Choices[0].Message.Content

	// Parse the response (simplified parsing)
	var insights, recommendations []string
	lines := strings.Split(content, "\n")
	currentSection := ""

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "INSIGHTS:") {
			currentSection = "insights"
			continue
		} else if strings.HasPrefix(line, "RECOMMENDATIONS:") {
			currentSection = "recommendations"
			continue
		}

		if strings.HasPrefix(line, "- ") && currentSection != "" {
			item := strings.TrimPrefix(line, "- ")
			if currentSection == "insights" {
				insights = append(insights, item)
			} else if currentSection == "recommendations" {
				recommendations = append(recommendations, item)
			}
		}
	}

	return insights, recommendations, nil
}

func (s *DiagnosisService) generateInsights(cluster *models.Cluster) []string {
	insights := []string{
		"Cluster is running with " + fmt.Sprintf("%d", len(cluster.Droplets)) + " droplets",
		"Region distribution: " + cluster.Region,
	}

	// Mock insights based on cluster status
	switch cluster.Status {
	case "healthy":
		insights = append(insights, "All systems operational")
	case "warning":
		insights = append(insights, "Some performance degradation detected")
	case "critical":
		insights = append(insights, "Critical issues require immediate attention")
	}

	return insights
}

func (s *DiagnosisService) generateRecommendations(cluster *models.Cluster) []string {
	recommendations := []string{}

	// Actionable recommendations based on cluster state
	if len(cluster.Droplets) < 2 {
		recommendations = append(recommendations, "Add more droplets for better redundancy and load distribution")
	}

	if len(cluster.Droplets) == 0 {
		recommendations = append(recommendations, "Create initial droplet to get the cluster running")
	}

	if cluster.Status == "critical" {
		recommendations = append(recommendations, "Immediate scaling required - add droplets to handle load")
		recommendations = append(recommendations, "Check droplet health and restart failed instances")
	}

	if cluster.Status == "warning" {
		recommendations = append(recommendations, "Consider upgrading droplet sizes for better performance")
		recommendations = append(recommendations, "Add monitoring droplets for better observability")
	}

	if len(cluster.Droplets) > 0 && len(cluster.Droplets) < 5 {
		recommendations = append(recommendations, "Scale up cluster with additional droplets")
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Cluster configuration looks good - regular monitoring recommended")
	}

	return recommendations
}
