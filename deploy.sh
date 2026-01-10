#!/bin/bash

# SpoolTracker Production Deployment Script
# Deploys to Docker host at 192.168.2.13
# Smart deployment: only deploys changed components

set -e  # Exit on error

# Timing functions
DEPLOY_START_TIME=$(date +%s)
STEP_START_TIME=$DEPLOY_START_TIME

format_duration() {
    local seconds=$1
    if [ $seconds -lt 60 ]; then
        echo "${seconds}s"
    else
        local minutes=$((seconds / 60))
        local secs=$((seconds % 60))
        echo "${minutes}m ${secs}s"
    fi
}

start_timer() {
    STEP_START_TIME=$(date +%s)
}

show_step_time() {
    local step_end=$(date +%s)
    local duration=$((step_end - STEP_START_TIME))
    echo "   ⏱️  Step completed in $(format_duration $duration)"
}

show_total_time() {
    local total_end=$(date +%s)
    local duration=$((total_end - DEPLOY_START_TIME))
    echo "⏱️  Total deployment time: $(format_duration $duration)"
}

# Configuration - Load from .env.deploy if it exists
if [ -f ".env.deploy" ]; then
    echo "📝 Loading configuration from .env.deploy"
    export $(grep -v '^#' .env.deploy | xargs)
else
    echo "⚠️  Warning: .env.deploy not found. Using default/environment values."
fi

REMOTE_HOST="${REMOTE_HOST:-192.168.2.13}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PASSWORD="${REMOTE_PASSWORD}"
REMOTE_DIR="${REMOTE_DIR:-/opt/spooltracker}"
APP_NAME="spooltracker"

# Find SSH key - check multiple common locations
find_ssh_key() {
    local keys=(
        "$HOME/.ssh/id_rsa_spooltracker"
        "$HOME/.ssh/id_rsa_dunerank"
        "$HOME/.ssh/id_ed25519_personal"
        "$HOME/.ssh/id_ed25519"
        "$HOME/.ssh/id_rsa"
    )
    for key in "${keys[@]}"; do
        if [ -f "$key" ]; then
            echo "$key"
            return 0
        fi
    done
    return 1
}

SSH_KEY=$(find_ssh_key) || SSH_KEY=""

# Check if we have authentication
if [ -z "$REMOTE_PASSWORD" ] && [ -z "$SSH_KEY" ]; then
    echo "❌ Error: No SSH authentication configured!"
    echo "   Either:"
    echo "   1. Set REMOTE_PASSWORD in .env.deploy file"
    echo "   2. Create an SSH key and copy to server:"
    echo "      ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519"
    echo "      ssh-copy-id -i ~/.ssh/id_ed25519 $REMOTE_USER@$REMOTE_HOST"
    exit 1
fi

if [ -n "$SSH_KEY" ]; then
    echo "🔑 Using SSH key: $SSH_KEY"
fi

# Detect what has changed using git
detect_changes() {
    # Get changed files since last deploy (or last commit if no deploy marker)
    local LAST_DEPLOY_FILE=".last-deploy"
    local CHANGED_FILES=""
    
    if [ -f "$LAST_DEPLOY_FILE" ]; then
        LAST_COMMIT=$(cat "$LAST_DEPLOY_FILE")
        # Check if the commit still exists
        if git rev-parse "$LAST_COMMIT" > /dev/null 2>&1; then
            CHANGED_FILES=$(git diff --name-only "$LAST_COMMIT" HEAD 2>/dev/null || echo "")
        fi
    fi
    
    # If no previous deploy marker or git diff failed, check uncommitted changes + last commit
    if [ -z "$CHANGED_FILES" ]; then
        # Check staged and unstaged changes
        CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "")
        CHANGED_FILES="$CHANGED_FILES"$'\n'$(git diff --name-only --cached 2>/dev/null || echo "")
        # Also include last commit changes for safety
        CHANGED_FILES="$CHANGED_FILES"$'\n'$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
    fi
    
    # Also check for any uncommitted changes
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | awk '{print $2}' || echo "")
    CHANGED_FILES="$CHANGED_FILES"$'\n'"$UNCOMMITTED"
    
    echo "$CHANGED_FILES"
}

# Determine which services to deploy
DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

echo "================================================"
echo "SpoolTracker Smart Production Deployment"
echo "================================================"
echo ""

# Check for force flags
if [[ "$1" == "--all" ]] || [[ "$1" == "-a" ]]; then
    echo "🔄 Force deploying ALL services"
    DEPLOY_BACKEND=true
    DEPLOY_FRONTEND=true
elif [[ "$1" == "--backend" ]] || [[ "$1" == "-b" ]]; then
    echo "🔄 Force deploying BACKEND only"
    DEPLOY_BACKEND=true
elif [[ "$1" == "--frontend" ]] || [[ "$1" == "-f" ]]; then
    echo "🔄 Force deploying FRONTEND only"
    DEPLOY_FRONTEND=true
elif [[ "$1" == "--status" ]] || [[ "$1" == "-s" ]]; then
    echo "📊 Checking deployment status..."
    if [ -f "$SSH_KEY" ]; then
        SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"
    else
        SSH_CMD="ssh -o StrictHostKeyChecking=no"
    fi
    eval "$SSH_CMD $REMOTE_USER@$REMOTE_HOST" << ENDSSH
        cd $REMOTE_DIR 2>/dev/null || { echo "❌ SpoolTracker not deployed yet"; exit 1; }
        echo ""
        echo "Container status:"
        docker-compose ps
        echo ""
        echo "📋 Recent logs (last 20 lines):"
        docker-compose logs --tail=20
ENDSSH
    exit 0
elif [[ "$1" == "--logs" ]] || [[ "$1" == "-l" ]]; then
    echo "📋 Streaming logs..."
    if [ -f "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose logs -f"
    else
        ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose logs -f"
    fi
    exit 0
elif [[ "$1" == "--stop" ]]; then
    echo "🛑 Stopping containers..."
    if [ -f "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose down"
    else
        ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose down"
    fi
    echo "✅ Containers stopped"
    exit 0
elif [[ "$1" == "--restart" ]]; then
    echo "🔄 Restarting containers..."
    if [ -f "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose restart"
    else
        ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && docker-compose restart"
    fi
    echo "✅ Containers restarted"
    exit 0
elif [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "SpoolTracker Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  (no option)     Auto-detect changes and deploy"
    echo "  --all, -a       Deploy everything (backend + frontend)"
    echo "  --backend, -b   Deploy backend only"
    echo "  --frontend, -f  Deploy frontend only"
    echo "  --status, -s    Show container status and recent logs"
    echo "  --logs, -l      Stream live logs"
    echo "  --stop          Stop all containers"
    echo "  --restart       Restart all containers"
    echo "  --help, -h      Show this help"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh              # Auto-detect and deploy changes"
    echo "  ./deploy.sh --all        # Full deployment"
    echo "  ./deploy.sh --frontend   # Deploy frontend only"
    echo "  ./deploy.sh --status     # Check status"
    exit 0
else
    echo "🔍 Detecting changes..."
    CHANGED=$(detect_changes)
    
    # Check if backend files changed
    if echo "$CHANGED" | grep -q "^backend/"; then
        DEPLOY_BACKEND=true
        echo "   📦 Backend changes detected"
    fi
    
    # Check if frontend files changed
    if echo "$CHANGED" | grep -q "^frontend/"; then
        DEPLOY_FRONTEND=true
        echo "   🎨 Frontend changes detected"
    fi
    
    # Check if docker-compose changed (deploy both)
    if echo "$CHANGED" | grep -q "docker-compose"; then
        DEPLOY_BACKEND=true
        DEPLOY_FRONTEND=true
        echo "   🐳 Docker config changes detected - deploying both"
    fi
fi

# If nothing detected, ask user
if [ "$DEPLOY_BACKEND" = false ] && [ "$DEPLOY_FRONTEND" = false ]; then
    echo ""
    echo "⚠️  No changes detected. What would you like to deploy?"
    echo "   1) Frontend only"
    echo "   2) Backend only"
    echo "   3) Both"
    echo "   4) Cancel"
    read -p "Select option [1-4]: " choice
    case $choice in
        1) DEPLOY_FRONTEND=true ;;
        2) DEPLOY_BACKEND=true ;;
        3) DEPLOY_BACKEND=true; DEPLOY_FRONTEND=true ;;
        4) echo "Deployment cancelled."; exit 0 ;;
        *) echo "Invalid option. Deployment cancelled."; exit 1 ;;
    esac
fi

echo ""
echo "📋 Deployment Plan:"
[ "$DEPLOY_BACKEND" = true ] && echo "   ✓ Backend will be deployed"
[ "$DEPLOY_FRONTEND" = true ] && echo "   ✓ Frontend will be deployed"
echo ""
echo "Remote Host: $REMOTE_HOST"
echo "Remote Directory: $REMOTE_DIR"
echo ""

# Check for SSH key first, then sshpass, then manual password
if [ -f "$SSH_KEY" ]; then
    echo "🔑 Using SSH key authentication ($SSH_KEY)"
    SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"
    SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=no"
elif command -v sshpass &> /dev/null && [ -n "$REMOTE_PASSWORD" ]; then
    echo "🔐 Using sshpass authentication"
    SSH_CMD="sshpass -p '$REMOTE_PASSWORD' ssh -o StrictHostKeyChecking=no"
    SCP_CMD="sshpass -p '$REMOTE_PASSWORD' scp -o StrictHostKeyChecking=no"
else
    echo "⚠️  No SSH key found and sshpass is not installed. You'll need to enter the password manually."
    SSH_CMD="ssh -o StrictHostKeyChecking=no"
    SCP_CMD="scp -o StrictHostKeyChecking=no"
fi

echo ""
echo "📦 Step 1: Creating deployment package..."
start_timer

# Create a temporary directory for deployment files
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files based on what needs to be deployed
cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"

# Copy environment file if it exists (required for docker-compose on remote)
if [ -f ".env.deploy" ]; then
    cp .env.deploy "$DEPLOY_DIR/.env"
    echo "   🔧 Environment configuration added"
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    # Copy backend excluding target directory using tar (works on Git Bash)
    mkdir -p "$DEPLOY_DIR/backend"
    tar -cf - -C backend --exclude='target' --exclude='.mvn' . | tar -xf - -C "$DEPLOY_DIR/backend"
    echo "   📦 Backend files added (excluding target/)"
fi

if [ "$DEPLOY_FRONTEND" = true ]; then
    # Copy frontend excluding node_modules and dist using tar (works on Git Bash)
    mkdir -p "$DEPLOY_DIR/frontend"
    tar -cf - -C frontend --exclude='node_modules' --exclude='dist' . | tar -xf - -C "$DEPLOY_DIR/frontend"
    echo "   🎨 Frontend files added (excluding node_modules/, dist/)"
fi

# Create marker files to indicate what to deploy
echo "$DEPLOY_BACKEND" > "$DEPLOY_DIR/.deploy-backend"
echo "$DEPLOY_FRONTEND" > "$DEPLOY_DIR/.deploy-frontend"

# Create archive (cross-platform compatible)
# Detect OS and use appropriate tar options
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - suppress extended attributes
    COPYFILE_DISABLE=1 tar -czf spooltracker-deploy.tar.gz -C "$DEPLOY_DIR" .
else
    # Linux/Windows (Git Bash) - standard tar
    tar -czf spooltracker-deploy.tar.gz -C "$DEPLOY_DIR" .
fi
rm -rf "$DEPLOY_DIR"

echo "✅ Deployment package created: spooltracker-deploy.tar.gz"
show_step_time
echo ""

echo "🔄 Step 2: Uploading to remote server..."
start_timer
eval "$SCP_CMD spooltracker-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/"
echo "✅ Upload complete"
show_step_time
echo ""

echo "🚀 Step 3: Deploying on remote server..."
start_timer

# Export variables for the heredoc
export REMOTE_DIR

eval "$SSH_CMD $REMOTE_USER@$REMOTE_HOST" << 'ENDSSH'
    set -e
    
    # Remote timing helper
    format_time() {
        local seconds=$1
        if [ $seconds -lt 60 ]; then
            echo "${seconds}s"
        else
            local minutes=$((seconds / 60))
            local secs=$((seconds % 60))
            echo "${minutes}m ${secs}s"
        fi
    }
    
    REMOTE_START=$(date +%s)
    
    # Create application directory
    mkdir -p /opt/spooltracker
    cd /opt/spooltracker
    
    # Extract deployment package to temp location first
    TEMP_DEPLOY="/tmp/spooltracker-deploy-temp"
    rm -rf "$TEMP_DEPLOY"
    mkdir -p "$TEMP_DEPLOY"
    tar -xzf /tmp/spooltracker-deploy.tar.gz -C "$TEMP_DEPLOY" 2>/dev/null || tar -xzf /tmp/spooltracker-deploy.tar.gz -C "$TEMP_DEPLOY"
    rm /tmp/spooltracker-deploy.tar.gz
    
    # Read deployment flags
    DEPLOY_BACKEND=$(cat "$TEMP_DEPLOY/.deploy-backend")
    DEPLOY_FRONTEND=$(cat "$TEMP_DEPLOY/.deploy-frontend")
    
    echo "📋 Remote deployment plan:"
    [ "$DEPLOY_BACKEND" = "true" ] && echo "   ✓ Backend"
    [ "$DEPLOY_FRONTEND" = "true" ] && echo "   ✓ Frontend"
    echo ""
    
    # Update docker-compose.yml always
    cp "$TEMP_DEPLOY/docker-compose.yml" /opt/spooltracker/docker-compose.yml
    
    # Update .env file if it exists
    if [ -f "$TEMP_DEPLOY/.env" ]; then
        cp "$TEMP_DEPLOY/.env" /opt/spooltracker/.env
        echo "   🔧 Environment configuration updated"
    fi
    
    # Backup and update backend if needed
    if [ "$DEPLOY_BACKEND" = "true" ]; then
        echo "📦 Deploying backend..."
        if [ -d "backend" ]; then
            BACKUP_DIR="backup-backend-$(date +%Y%m%d-%H%M%S)"
            mkdir -p "$BACKUP_DIR"
            mv backend "$BACKUP_DIR/"
            echo "   ✅ Old backend backed up to $BACKUP_DIR"
        fi
        mv "$TEMP_DEPLOY/backend" /opt/spooltracker/
        echo "   ✅ New backend deployed"
    fi
    
    # Backup and update frontend if needed
    if [ "$DEPLOY_FRONTEND" = "true" ]; then
        echo "🎨 Deploying frontend..."
        if [ -d "frontend" ]; then
            BACKUP_DIR="backup-frontend-$(date +%Y%m%d-%H%M%S)"
            mkdir -p "$BACKUP_DIR"
            mv frontend "$BACKUP_DIR/"
            echo "   ✅ Old frontend backed up to $BACKUP_DIR"
        fi
        mv "$TEMP_DEPLOY/frontend" /opt/spooltracker/
        echo "   ✅ New frontend deployed"
    fi
    
    # Cleanup temp deployment
    rm -rf "$TEMP_DEPLOY"
    
    # Ensure SSL certificates exist before starting containers
    SSL_DIR="/opt/spooltracker/ssl"
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        echo "🔐 Generating SSL certificates..."
        mkdir -p "$SSL_DIR"
        # Try with subjectAltName first (newer openssl), fallback to older syntax
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
          -keyout "$SSL_DIR/key.pem" \
          -out "$SSL_DIR/cert.pem" \
          -subj "/C=US/ST=State/L=City/O=SpoolTracker/CN=192.168.2.13" \
          -addext "subjectAltName=IP:192.168.2.13,DNS:localhost,DNS:192.168.2.13" 2>/dev/null || \
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
          -keyout "$SSL_DIR/key.pem" \
          -out "$SSL_DIR/cert.pem" \
          -subj "/C=US/ST=State/L=City/O=SpoolTracker/CN=192.168.2.13"
        chmod 600 "$SSL_DIR/key.pem"
        chmod 644 "$SSL_DIR/cert.pem"
        echo "   ✅ SSL certificates generated"
    fi
    
    # Enable BuildKit for cache mount support
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    if [ "$DEPLOY_BACKEND" = "true" ] && [ "$DEPLOY_FRONTEND" = "true" ]; then
        echo "🛑 Stopping all containers..."
        docker-compose down || true
        
        BUILD_START=$(date +%s)
        echo "🔨 Building all Docker images (with cache)..."
        docker-compose build
        BUILD_END=$(date +%s)
        echo "   ⏱️  Build completed in $(format_time $((BUILD_END - BUILD_START)))"
        
        echo "▶️  Starting all containers..."
        docker-compose up -d
    elif [ "$DEPLOY_BACKEND" = "true" ]; then
        echo "🛑 Stopping backend container..."
        docker-compose stop backend || true
        docker-compose rm -f backend || true
        
        BUILD_START=$(date +%s)
        echo "🔨 Building backend Docker image (with cache)..."
        docker-compose build backend
        BUILD_END=$(date +%s)
        echo "   ⏱️  Backend build completed in $(format_time $((BUILD_END - BUILD_START)))"
        
        echo "▶️  Starting backend container..."
        docker-compose up -d backend
    elif [ "$DEPLOY_FRONTEND" = "true" ]; then
        echo "🛑 Stopping frontend container..."
        docker-compose stop frontend || true
        docker-compose rm -f frontend || true
        
        BUILD_START=$(date +%s)
        echo "🔨 Building frontend Docker image (with cache)..."
        docker-compose build frontend
        BUILD_END=$(date +%s)
        echo "   ⏱️  Frontend build completed in $(format_time $((BUILD_END - BUILD_START)))"
        
        echo "▶️  Starting frontend container..."
        docker-compose up -d frontend
    fi
    
    # Clean up old backups (keep last 3)
    echo ""
    echo "🧹 Cleaning up old backups..."
    ls -dt backup-backend-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    ls -dt backup-frontend-* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    
    REMOTE_END=$(date +%s)
    echo ""
    echo "✅ Deployment complete!"
    echo "   ⏱️  Remote deployment took $(format_time $((REMOTE_END - REMOTE_START)))"
    echo ""
    echo "Container status:"
    docker-compose ps
    
    echo ""
    echo "📋 Recent logs:"
    docker-compose logs --tail=20
ENDSSH

show_step_time

# Save current commit as last deploy marker
git rev-parse HEAD > .last-deploy 2>/dev/null || true

echo ""
echo "🎉 Deployment finished!"
show_total_time
echo ""
echo "🌐 Application URLs:"
echo "   Frontend (HTTP): http://$REMOTE_HOST:3000"
echo "   Frontend (HTTPS): https://$REMOTE_HOST:3443"
echo "   Backend API: http://$REMOTE_HOST:9002/api"
echo ""
echo "📸 For camera access, use HTTPS: https://$REMOTE_HOST:3443"
echo "   (You'll need to accept the security warning for the self-signed certificate)"
echo ""
echo "📊 To view logs, run:"
echo "   ./deploy.sh --logs"
echo ""
echo "🔧 Usage options:"
echo "   ./deploy.sh              # Auto-detect changes"
echo "   ./deploy.sh --all        # Deploy everything"
echo "   ./deploy.sh --frontend   # Deploy frontend only"
echo "   ./deploy.sh --backend    # Deploy backend only"
echo "   ./deploy.sh --status     # Check status"
echo "   ./deploy.sh --logs       # Stream logs"
echo "   ./deploy.sh --stop       # Stop containers"
echo "   ./deploy.sh --restart    # Restart containers"
echo ""

# Cleanup local deployment package
rm -f spooltracker-deploy.tar.gz

echo "✨ All done!"
