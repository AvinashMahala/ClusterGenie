# ClusterGenie REST API Documentation

This document describes the REST API endpoints for ClusterGenie.

## Base URL
`http://localhost:8080/api/v1`

## Endpoints

### Hello Service
- **POST /hello**
  - Request: `{ "name": "string" }`
  - Response: `{ "message": "string" }`

### Provisioning Service
- **POST /droplets**
  - Request: `{ "name": "string", "cluster_id": "string (optional)", "region": "string", "size": "string", "image": "string" }`
  - Response: `{ "droplet": {...}, "message": "string" }`

- **GET /droplets/{id}**
  - Response: `{ "droplet": {...}, "message": "string" }`

- **GET /droplets**
  - Response: `{ "droplets": [...] }`

- **DELETE /droplets/{id}**
  - Response: `{ "message": "string" }`

### Diagnosis Service
- **POST /diagnosis/diagnose**
  - Request: `{ "cluster_id": "string" }`
  - Response: `{ "cluster": {...}, "insights": [...], "recommendations": [...] }`

### Job Service
- **POST /jobs**
  - Request: `{ "type": "string", "parameters": {...} }`
  - Response: `{ "job": {...}, "message": "string" }`

- **GET /jobs/{id}**
  - Response: `{ "job": {...}, "message": "string" }`

- **GET /jobs**
  - Response: `{ "jobs": [...] }`

### Monitoring Service
- **GET /metrics**
  - Query Params: `cluster_id`, `type`
  - Response: `{ "metrics": [...], "period": "string" }`