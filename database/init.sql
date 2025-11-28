-- database/init.sql

CREATE TABLE clusters (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_checked DATETIME NOT NULL
);

CREATE TABLE droplets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    size VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    ip_address VARCHAR(45)
);

CREATE TABLE jobs (
    id VARCHAR(255) PRIMARY KEY,
    cluster_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    completed_at DATETIME,
    result TEXT,
    error TEXT,
    INDEX idx_cluster_id (cluster_id)
);

CREATE TABLE metrics (
    id VARCHAR(255) PRIMARY KEY,
    cluster_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp DATETIME NOT NULL,
    value DOUBLE NOT NULL,
    unit VARCHAR(50) NOT NULL,
    INDEX idx_cluster_id_timestamp (cluster_id, timestamp)
);