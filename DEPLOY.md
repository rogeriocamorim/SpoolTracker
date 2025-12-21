# SpoolTracker Deployment Guide

Deploy SpoolTracker to your Docker server with Portainer.

## Prerequisites

- Docker server at `192.168.2.22` with Portainer installed
- MariaDB running on `192.168.2.22:3306` with database `spooltracker`
- Git installed on your machine

## Option 1: Deploy via Portainer Git Repository (Recommended)

### Step 1: Push to Git

```bash
cd /Users/rogerio.camorim/code/pessoal/SpoolTracker
git init
git add .
git commit -m "Initial SpoolTracker deployment"

# Push to GitHub/GitLab
git remote add origin https://github.com/YOUR_USERNAME/SpoolTracker.git
git push -u origin main
```

### Step 2: Deploy in Portainer

1. Open Portainer at `http://192.168.2.22:9000`
2. Go to **Stacks** → **Add Stack**
3. Select **Repository**
4. Enter your Git repository URL
5. Set **Compose path** to: `docker-compose.yml`
6. Click **Deploy the stack**

Portainer will:
- Clone your repository
- Build both Docker images
- Start the containers

## Option 2: Deploy via Docker Compose SSH

### Step 1: Copy files to server

```bash
# From your Mac
cd /Users/rogerio.camorim/code/pessoal/SpoolTracker

# Copy entire project to server
scp -r . user@192.168.2.22:/opt/spooltracker/
```

### Step 2: Build and run on server

```bash
# SSH into server
ssh user@192.168.2.22

# Navigate to project
cd /opt/spooltracker

# Build and start
docker compose up -d --build
```

## Option 3: Build Locally and Push Images

### Step 1: Build images locally

```bash
cd /Users/rogerio.camorim/code/pessoal/SpoolTracker

# Build backend
docker build -t spooltracker-backend:latest ./backend

# Build frontend
docker build -t spooltracker-frontend:latest ./frontend
```

### Step 2: Save and transfer images

```bash
# Save images to tar files
docker save spooltracker-backend:latest | gzip > spooltracker-backend.tar.gz
docker save spooltracker-frontend:latest | gzip > spooltracker-frontend.tar.gz

# Transfer to server
scp spooltracker-*.tar.gz user@192.168.2.22:/tmp/
```

### Step 3: Load images on server

```bash
# SSH into server
ssh user@192.168.2.22

# Load images
docker load < /tmp/spooltracker-backend.tar.gz
docker load < /tmp/spooltracker-frontend.tar.gz
```

### Step 4: Create stack in Portainer

Use this simplified compose for pre-built images:

```yaml
version: '3.8'

services:
  backend:
    container_name: spooltracker-backend
    image: spooltracker-backend:latest
    ports:
      - "8080:8080"
    environment:
      QUARKUS_DATASOURCE_DB_KIND: mariadb
      QUARKUS_DATASOURCE_JDBC_URL: jdbc:mariadb://192.168.2.22:3306/spooltracker
      QUARKUS_DATASOURCE_USERNAME: root
      QUARKUS_DATASOURCE_PASSWORD: "!#q1w2e3r4#!MariaDB"
      QUARKUS_HIBERNATE_ORM_DATABASE_GENERATION: update
      QUARKUS_HTTP_CORS: "true"
      QUARKUS_HTTP_CORS_ORIGINS: "*"
    restart: unless-stopped

  frontend:
    container_name: spooltracker-frontend
    image: spooltracker-frontend:latest
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

## Accessing SpoolTracker

After deployment:

- **Frontend**: http://192.168.2.22:3000
- **Backend API**: http://192.168.2.22:8080/api

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `QUARKUS_DATASOURCE_JDBC_URL` | MariaDB connection URL | `jdbc:mariadb://192.168.2.22:3306/spooltracker` |
| `QUARKUS_DATASOURCE_USERNAME` | Database username | `root` |
| `QUARKUS_DATASOURCE_PASSWORD` | Database password | - |
| `QUARKUS_HIBERNATE_ORM_DATABASE_GENERATION` | Schema mode: `update`, `drop-and-create`, `none` | `update` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL (build-time) | `/api` |

## Troubleshooting

### Check container logs

```bash
docker logs spooltracker-backend
docker logs spooltracker-frontend
```

### Verify backend health

```bash
curl http://192.168.2.22:8080/api/materials
```

### Database connection issues

Ensure MariaDB allows connections from Docker containers:

```sql
-- Run on MariaDB
GRANT ALL PRIVILEGES ON spooltracker.* TO 'root'@'%' IDENTIFIED BY '!#q1w2e3r4#!MariaDB';
FLUSH PRIVILEGES;
```

### Rebuild after code changes

```bash
docker compose down
docker compose up -d --build
```

## Updating

### Via Portainer (Git deployment)
1. Push changes to Git
2. In Portainer: Stacks → spooltracker → **Pull and redeploy**

### Via command line
```bash
cd /opt/spooltracker
git pull
docker compose up -d --build
```


