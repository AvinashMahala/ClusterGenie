-- database/init.sql

CREATE TABLE clusters (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    droplets TEXT,  -- JSON array of droplet IDs
    status VARCHAR(50) NOT NULL,
    last_checked DATETIME NOT NULL
);

CREATE TABLE droplets (
    id VARCHAR(255) PRIMARY KEY,
    cluster_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    size VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
);

CREATE TABLE jobs (
    id VARCHAR(255) PRIMARY KEY,
    cluster_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    trace_id VARCHAR(255),
    progress INT DEFAULT 0,
    created_at DATETIME NOT NULL,
    completed_at DATETIME,
    result TEXT,
    error TEXT,
    parameters TEXT,  -- JSON string of parameters
    INDEX idx_cluster_id (cluster_id),
    FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
);

CREATE TABLE metrics (
    id VARCHAR(255) PRIMARY KEY,
    cluster_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp DATETIME NOT NULL,
    value DOUBLE NOT NULL,
    unit VARCHAR(50) NOT NULL,
    INDEX idx_cluster_id_timestamp (cluster_id, timestamp),
    FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
);