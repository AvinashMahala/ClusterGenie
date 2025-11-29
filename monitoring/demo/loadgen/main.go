package main

import (
	"context"
	"flag"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"
)

var (
	apiURL      string
	concurrency int
	qps         int
	totalJobs   int
	totalDiag   int
	users       int
	clusters    int
	durationStr string
)

func init() {
	flag.StringVar(&apiURL, "api", "http://localhost:8080/api/v1", "API base url")
	flag.IntVar(&concurrency, "c", 20, "concurrency (number of worker goroutines)")
	flag.IntVar(&qps, "qps", 200, "approx target requests per second")
	flag.IntVar(&totalJobs, "jobs", 1000, "total job create requests to send")
	flag.IntVar(&totalDiag, "diag", 800, "total diagnosis requests to send")
	flag.IntVar(&users, "users", 8, "number of user IDs to simulate")
	flag.IntVar(&clusters, "clusters", 6, "number of clusters to spread the load across")
	flag.StringVar(&durationStr, "duration", "30s", "max duration to run (e.g. 30s, 2m)")
}

func main() {
	flag.Parse()
	fmt.Printf("Loadgen starting: api=%s c=%d qps=%d jobs=%d diag=%d users=%d clusters=%d\n", apiURL, concurrency, qps, totalJobs, totalDiag, users, clusters)

	// Prepare HTTP client
	client := &http.Client{Timeout: 10 * time.Second}

	// Create channel of requests
	type reqSpec struct{ method, path, body, user string }
	tasks := make(chan reqSpec, 10000)

	// Worker pool
	var wg sync.WaitGroup
	ctx, cancel := context.WithTimeout(context.Background(), mustParseDuration(durationStr))
	defer cancel()

	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case t, ok := <-tasks:
					if !ok {
						return
					}
					sendRequest(client, t)
				}
			}
		}()
	}

	// fill tasks at desired QPS
	total := totalJobs + totalDiag
	if total <= 0 {
		close(tasks)
		wg.Wait()
		return
	}

	interval := time.Duration(float64(time.Second) / float64(qps))
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	sent := 0
	jobIdx := 0
	diagIdx := 0

	for sent < total {
		select {
		case <-ctx.Done():
			sent = total
			break
		case <-ticker.C:
			// produce either job or diag depending on counts
			var t reqSpec
			// random choice biased by remaining counts
			remainJobs := totalJobs - jobIdx
			remainDiag := totalDiag - diagIdx
			pick := 0
			if remainJobs > 0 && remainDiag > 0 {
				// proportional
				if rand.Intn(remainJobs+remainDiag) < remainJobs {
					pick = 1
				} else {
					pick = 2
				}
			} else if remainJobs > 0 {
				pick = 1
			} else if remainDiag > 0 {
				pick = 2
			} else {
				pick = 0
			}

			uid := fmt.Sprintf("user-%d", (rand.Intn(users) + 1))
			cluster := fmt.Sprintf("demo-cluster-%d", (rand.Intn(clusters) + 1))

			if pick == 1 {
				// job
				jobIdx++
				name := fmt.Sprintf("loadgen-job-%d", jobIdx)
				body := fmt.Sprintf(`{"type":"monitor","parameters":{"cluster_id":"%s","job_name":"%s"}}`, cluster, name)
				t = reqSpec{method: "POST", path: "/jobs", body: body, user: uid}
			} else if pick == 2 {
				// diagnosis
				diagIdx++
				body := fmt.Sprintf(`{"cluster_id":"%s"}`, cluster)
				t = reqSpec{method: "POST", path: "/diagnosis/diagnose", body: body, user: uid}
			} else {
				// fallback to benign GETs
				path := "/observability/workerpool"
				t = reqSpec{method: "GET", path: path, body: "", user: uid}
			}

			select {
			case tasks <- t:
				sent++
			default:
				// task queue full: drop
			}
		}
	}

	// close tasks, wait for workers
	close(tasks)
	wg.Wait()

	fmt.Println("Loadgen completed")
}

func mustParseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 30 * time.Second
	}
	return d
}

func sendRequest(client *http.Client, t struct{ method, path, body, user string }) {
	url := strings.TrimRight(apiURL, "/") + t.path
	var req *http.Request
	var err error
	if t.method == "GET" {
		req, err = http.NewRequest("GET", url, nil)
	} else {
		req, err = http.NewRequest(t.method, url, strings.NewReader(t.body))
		req.Header.Set("Content-Type", "application/json")
	}
	if err != nil {
		return
	}
	if t.user != "" {
		req.Header.Set("X-User-ID", t.user)
	}

	resp, err := client.Do(req)
	if err == nil && resp.Body != nil {
		// drain & close
		resp.Body.Close()
	}
}
