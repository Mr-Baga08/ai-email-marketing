# #For a alredy npm install project

# # #!/bin/bash
# # # Comprehensive Deployment Script for AI-Powered Email Marketing Platform

# # # Color Codes
# # GREEN='\033[0;32m'
# # YELLOW='\033[1;33m'
# # RED='\033[0;31m'
# # BLUE='\033[0;34m'
# # NC='\033[0m' # No Color

# # # Error Handling
# # set -e
# # set -o pipefail
# # trap 'handle_error $?' ERR

# # # Error Handler Function
# # handle_error() {
# #     echo -e "${RED}❌ Deployment Failed with Error Code: $1 ${NC}"
# #     echo -e "${YELLOW}Error occurred on line $LINENO${NC}"
# #     exit 1
# # }

# # # Logging Function
# # log() {
# #     echo -e "${BLUE}➤ $1${NC}"
# # }

# # # Pre-Deployment Checks
# # pre_deployment_checks() {
# #     log "Running Pre-Deployment Checks"

# #     # Check Required Tools
# #     local tools=("gcloud" "node" "npm" "openssl")
# #     for tool in "${tools[@]}"; do
# #         if ! command -v "$tool" &> /dev/null; then
# #             echo -e "${RED}Error: $tool is not installed.${NC}"
# #             exit 1
# #         fi
# #     done

# #     # Node.js Version Check
# #     local node_version=$(node --version | sed 's/v//')
# #     local min_version="20.0.0"
# #     if [ "$(printf '%s\n' "$min_version" "$node_version" | sort -V | head -n1)" != "$min_version" ]; then
# #         echo -e "${RED}❌ Node.js version must be $min_version or higher. Current: $node_version${NC}"
# #         exit 1
# #     fi

# #     # GCP Project Check
# #     local project_id=$(gcloud config get-value project 2>/dev/null)
# #     if [ -z "$project_id" ]; then
# #         echo -e "${RED}❌ No Google Cloud project selected.${NC}"
# #         echo "Run: gcloud config set project YOUR_PROJECT_ID"
# #         exit 1
# #     fi
# #     log "Using GCP Project: $project_id"
# # }

# # # Enable GCP Services
# # enable_gcp_services() {
# #     log "Enabling GCP Services"
# #     local services=(
# #         "appengine.googleapis.com"
# #         "secretmanager.googleapis.com"
# #         "aiplatform.googleapis.com"
# #         "cloudfunctions.googleapis.com"
# #         "firestore.googleapis.com"
# #         "cloudtrace.googleapis.com"
# #         "monitoring.googleapis.com"
# #     )

# #     for service in "${services[@]}"; do
# #         log "Enabling $service"
# #         gcloud services enable "$service" || {
# #             echo -e "${YELLOW}Warning: Could not enable $service${NC}"
# #         }
# #     done
# # }

# # # Update client package.json to ensure react-scripts is in dependencies
# # update_client_package_json() {
# #     log "Updating client package.json for react-scripts"
    
# #     cd client
    
# #     # Check if package.json exists
# #     if [ ! -f "package.json" ]; then
# #         echo -e "${RED}Error: client/package.json not found${NC}"
# #         exit 1
# #     fi
    
# #     # Use node to modify package.json to ensure react-scripts is in dependencies
# #     node -e '
# #     const fs = require("fs");
# #     const pkg = JSON.parse(fs.readFileSync("package.json"));
    
# #     // Ensure react-scripts is in dependencies
# #     if (!pkg.dependencies) pkg.dependencies = {};
# #     pkg.dependencies["react-scripts"] = "^5.0.1";
    
# #     // Update build script to use explicit path
# #     if (!pkg.scripts) pkg.scripts = {};
# #     pkg.scripts.build = "node ./node_modules/react-scripts/bin/react-scripts.js build";
    
# #     // Write updated package.json
# #     fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
    
# #     console.log("Updated client package.json with react-scripts in dependencies");
# #     '
    
# #     cd ..
# # }

# # # Create cloudbuild.yaml for Google Cloud Build
# # create_cloudbuild_yaml() {
# #     log "Creating cloudbuild.yaml for Google Cloud Build"
    
# #     cat > cloudbuild.yaml << EOL
# # steps:
# #   # Install root dependencies
# #   - name: 'gcr.io/cloud-builders/npm'
# #     args: ['install']
    
# #   # Install client dependencies with legacy peer deps flag
# #   - name: 'gcr.io/cloud-builders/npm'
# #     args: ['install', '--legacy-peer-deps']
# #     dir: 'client'
    
# #   # Explicitly install react-scripts in client directory
# #   - name: 'gcr.io/cloud-builders/npm'
# #     args: ['install', 'react-scripts', '--save']
# #     dir: 'client'
    
# #   # Build the client application using explicit path to react-scripts
# #   - name: 'gcr.io/cloud-builders/npm'
# #     args: ['run', 'build']
# #     dir: 'client'
# #     env:
# #       - 'NODE_ENV=production'
# #       - 'CI=false'
# #       - 'NODE_OPTIONS=--max_old_space_size=2048'
    
# #   # Deploy to App Engine
# #   - name: 'gcr.io/cloud-builders/gcloud'
# #     args: ['app', 'deploy']
    
# # timeout: '1800s'  # 30 minutes
# # options:
# #   logging: CLOUD_LOGGING_ONLY
# # EOL

# #     log "Created cloudbuild.yaml"
# # }

# # # Update app.yaml to include necessary environment variables
# # update_app_yaml() {
# #     log "Updating app.yaml with deployment settings"
    
# #     # Backup existing app.yaml if it exists
# #     if [ -f "app.yaml" ]; then
# #         cp app.yaml app.yaml.bak
# #         log "Backed up existing app.yaml to app.yaml.bak"
# #     fi
    
# #     # Create new app.yaml with optimized settings
# #     cat > app.yaml << EOL
# # runtime: nodejs20

# # env_variables:
# #   NODE_ENV: "production"
# #   GOOGLE_CLOUD_PROJECT: "${PROJECT_ID}"
# #   PORT: "8080"
# #   MONGODB_URI: \${MONGODB_URI}
# #   JWT_SECRET: \${JWT_SECRET}
# #   NODE_OPTIONS: "--max_old_space_size=2048"
# #   NPM_CONFIG_LEGACY_PEER_DEPS: "true"

# # # Cloud Build specific settings
# # build_env_variables:
# #   NPM_CONFIG_LEGACY_PEER_DEPS: "true"
# #   NODE_OPTIONS: "--max_old_space_size=2048"

# # handlers:
# #   # Serve static assets with caching
# #   - url: /static
# #     static_dir: client/build/static
# #     secure: always
# #     http_headers:
# #       Cache-Control: "public, max-age=31536000, immutable"
    
# #   # Serve other static files with appropriate caching
# #   - url: /(.*\\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot))$
# #     static_files: client/build/\\1
# #     upload: client/build/.*\\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$
# #     secure: always
# #     http_headers:
# #       Cache-Control: "public, max-age=31536000"
    
# #   # All other requests go to the Node.js app
# #   - url: /.*
# #     script: auto
# #     secure: always

# # automatic_scaling:
# #   min_idle_instances: 1
# #   max_idle_instances: 3
# #   min_pending_latency: 30ms
# #   max_pending_latency: automatic
# #   min_instances: 1
# #   max_instances: 5

# # network:
# #   session_affinity: true
# # EOL

# #     log "Updated app.yaml with optimized settings"
# # }

# # # Create .npmrc file for npm configuration
# # create_npmrc() {
# #     log "Creating .npmrc files"
    
# #     # Root .npmrc
# #     cat > .npmrc << EOL
# # legacy-peer-deps=true
# # loglevel=verbose
# # EOL

# #     # Client .npmrc
# #     cat > client/.npmrc << EOL
# # legacy-peer-deps=true
# # loglevel=verbose
# # EOL

# #     log "Created .npmrc files for better npm compatibility"
# # }

# # # Prepare Dependencies with special handling for react-scripts
# # prepare_dependencies() {
# #     log "Preparing Project Dependencies"
    
# #     # Clean npm cache
# #     npm cache clean --force

# #     # Root dependencies
# #     npm ci

# #     # Client dependencies with special handling for react-scripts
# #     cd client
# #     log "Installing client dependencies with legacy-peer-deps flag"
# #     npm ci --legacy-peer-deps
    
# #     # Explicitly install react-scripts if it's missing
# #     if ! [ -d "node_modules/react-scripts" ]; then
# #         log "Installing react-scripts explicitly..."
# #         npm install react-scripts --save
# #     fi
    
# #     # Verify react-scripts is installed
# #     if [ -d "node_modules/react-scripts" ]; then
# #         log "✅ react-scripts is installed in client/node_modules"
# #     else
# #         echo -e "${RED}❌ Failed to install react-scripts${NC}"
# #         exit 1
# #     fi
    
# #     cd ..
# # }

# # # Build Client Application with explicit path to react-scripts
# # build_client() {
# #     log "Building Client Application"
# #     cd client
    
# #     # Set environment variables for build
# #     export NODE_ENV=production
# #     export CI=false
    
# #     log "Using explicit path to react-scripts for build"
# #     NODE_OPTIONS="--max-old-space-size=2048" node ./node_modules/react-scripts/bin/react-scripts.js build
    
# #     # Verify build was successful
# #     if [ -d "build" ]; then
# #         log "✅ Client build successful"
# #     else
# #         echo -e "${RED}❌ Client build failed - build directory not found${NC}"
# #         exit 1
# #     fi
    
# #     cd ..
# # }

# # # Create JWT Secret
# # create_jwt_secret() {
# #     log "Managing JWT Secret"
# #     if ! gcloud secrets describe jwt-secret &>/dev/null; then
# #         local jwt_secret=$(openssl rand -base64 32)
# #         echo -n "$jwt_secret" | gcloud secrets create jwt-secret --data-file=-
# #         echo -e "${GREEN}✅ JWT Secret created${NC}"
# #     else
# #         echo -e "${YELLOW}⚠️ JWT Secret already exists${NC}"
# #     fi
# # }

# # # Deployment with additional options
# # deploy_to_appengine() {
# #     log "Deploying to App Engine"
# #     local version_tag=$(date +"%Y%m%d%H%M%S")
    
# #     log "Running deployment with cloudbuild.yaml configuration"
# #     gcloud app deploy app.yaml \
# #         --project="$PROJECT_ID" \
# #         --version="v$version_tag" \
# #         --quiet
# # }

# # # Main Deployment Workflow
# # main() {
# #     clear
# #     echo -e "${BLUE}=== AI Email Marketing Platform Deployment ===${NC}"

# #     # Validate Project ID
# #     PROJECT_ID=$(gcloud config get-value project)
# #     if [ -z "$PROJECT_ID" ]; then
# #         echo -e "${RED}❌ No GCP Project Selected${NC}"
# #         exit 1
# #     fi

# #     # Execute Enhanced Deployment Steps
# #     pre_deployment_checks
# #     enable_gcp_services
# #     update_client_package_json
# #     create_cloudbuild_yaml
# #     update_app_yaml
# #     create_npmrc
# #     prepare_dependencies
# #     build_client
# #     create_jwt_secret
# #     deploy_to_appengine

# #     echo -e "${GREEN}✅ Deployment Completed Successfully!${NC}"
# #     echo -e "${YELLOW}Access your app at: https://$PROJECT_ID.uc.r.appspot.com${NC}"
# # }

# # # Execute Main Function
# # main "$@"



# # For npm install insted of npm ci which is used for a existing package-lock.json


# #!/bin/bash
# # Comprehensive Deployment Script for AI-Powered Email Marketing Platform

# # Color Codes
# GREEN='\033[0;32m'
# YELLOW='\033[1;33m'
# RED='\033[0;31m'
# BLUE='\033[0;34m'
# NC='\033[0m' # No Color

# # Error Handling
# set -e
# set -o pipefail
# trap 'handle_error $?' ERR

# # Error Handler Function
# handle_error() {
#     echo -e "${RED}❌ Deployment Failed with Error Code: $1 ${NC}"
#     echo -e "${YELLOW}Error occurred on line $LINENO${NC}"
#     exit 1
# }

# # Logging Function
# log() {
#     echo -e "${BLUE}➤ $1${NC}"
# }

# # Pre-Deployment Checks
# pre_deployment_checks() {
#     log "Running Pre-Deployment Checks"

#     # Check Required Tools
#     local tools=("gcloud" "node" "npm" "openssl")
#     for tool in "${tools[@]}"; do
#         if ! command -v "$tool" &> /dev/null; then
#             echo -e "${RED}Error: $tool is not installed.${NC}"
#             exit 1
#         fi
#     done

#     # Node.js Version Check
#     local node_version=$(node --version | sed 's/v//')
#     local min_version="20.0.0"
#     if [ "$(printf '%s\n' "$min_version" "$node_version" | sort -V | head -n1)" != "$min_version" ]; then
#         echo -e "${RED}❌ Node.js version must be $min_version or higher. Current: $node_version${NC}"
#         exit 1
#     fi

#     # GCP Project Check
#     local project_id=$(gcloud config get-value project 2>/dev/null)
#     if [ -z "$project_id" ]; then
#         echo -e "${RED}❌ No Google Cloud project selected.${NC}"
#         echo "Run: gcloud config set project YOUR_PROJECT_ID"
#         exit 1
#     fi
#     log "Using GCP Project: $project_id"
# }

# # Enable GCP Services
# enable_gcp_services() {
#     log "Enabling GCP Services"
#     local services=(
#         "appengine.googleapis.com"
#         "secretmanager.googleapis.com"
#         "aiplatform.googleapis.com"
#         "cloudfunctions.googleapis.com"
#         "firestore.googleapis.com"
#         "cloudtrace.googleapis.com"
#         "monitoring.googleapis.com"
#     )

#     for service in "${services[@]}"; do
#         log "Enabling $service"
#         gcloud services enable "$service" || {
#             echo -e "${YELLOW}Warning: Could not enable $service${NC}"
#         }
#     done
# }

# # Update client package.json to ensure react-scripts is in dependencies
# update_client_package_json() {
#     log "Updating client package.json for react-scripts"
    
#     cd client
    
#     # Check if package.json exists
#     if [ ! -f "package.json" ]; then
#         echo -e "${RED}Error: client/package.json not found${NC}"
#         exit 1
#     fi
    
#     # Use node to modify package.json to ensure react-scripts is in dependencies
#     node -e '
#     const fs = require("fs");
#     const pkg = JSON.parse(fs.readFileSync("package.json"));
    
#     // Ensure react-scripts is in dependencies
#     if (!pkg.dependencies) pkg.dependencies = {};
#     pkg.dependencies["react-scripts"] = "^5.0.1";
    
#     // Update build script to use explicit path
#     if (!pkg.scripts) pkg.scripts = {};
#     pkg.scripts.build = "node ./node_modules/react-scripts/bin/react-scripts.js build";
    
#     // Write updated package.json
#     fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
    
#     console.log("Updated client package.json with react-scripts in dependencies");
#     '
    
#     cd ..
# }

# # Create cloudbuild.yaml for Google Cloud Build
# create_cloudbuild_yaml() {
#     log "Creating cloudbuild.yaml for Google Cloud Build"
    
#     cat > cloudbuild.yaml << EOL
# steps:
#   # Install root dependencies
#   - name: 'gcr.io/cloud-builders/npm'
#     args: ['install']
    
#   # Install client dependencies with legacy peer deps flag
#   - name: 'gcr.io/cloud-builders/npm'
#     args: ['install', '--legacy-peer-deps']
#     dir: 'client'
    
#   # Explicitly install react-scripts in client directory
#   - name: 'gcr.io/cloud-builders/npm'
#     args: ['install', 'react-scripts', '--save']
#     dir: 'client'
    
#   # Build the client application using explicit path to react-scripts
#   - name: 'gcr.io/cloud-builders/npm'
#     args: ['run', 'build']
#     dir: 'client'
#     env:
#       - 'NODE_ENV=production'
#       - 'CI=false'
#       - 'NODE_OPTIONS=--max_old_space_size=2048'
    
#   # Deploy to App Engine
#   - name: 'gcr.io/cloud-builders/gcloud'
#     args: ['app', 'deploy']
    
# timeout: '1800s'  # 30 minutes
# options:
#   logging: CLOUD_LOGGING_ONLY
# EOL

#     log "Created cloudbuild.yaml"
# }

# # Update app.yaml to include necessary environment variables
# update_app_yaml() {
#     log "Updating app.yaml with deployment settings"
    
#     # Backup existing app.yaml if it exists
#     if [ -f "app.yaml" ]; then
#         cp app.yaml app.yaml.bak
#         log "Backed up existing app.yaml to app.yaml.bak"
#     fi
    
#     # Create new app.yaml with optimized settings
#     cat > app.yaml << EOL
# runtime: nodejs20

# env_variables:
#   NODE_ENV: "production"
#   GOOGLE_CLOUD_PROJECT: "${PROJECT_ID}"
#   PORT: "8080"
#   MONGODB_URI: \${MONGODB_URI}
#   JWT_SECRET: \${JWT_SECRET}
#   NODE_OPTIONS: "--max_old_space_size=2048"
#   NPM_CONFIG_LEGACY_PEER_DEPS: "true"

# # Cloud Build specific settings
# build_env_variables:
#   NPM_CONFIG_LEGACY_PEER_DEPS: "true"
#   NODE_OPTIONS: "--max_old_space_size=2048"

# # Add a pre-deploy script to ensure react-scripts is installed
# lifecycle:
#   tools:
#     nodejs: 20
#   build:
#     - npm install -g npm@latest
#     - npm install
#     - cd client && npm install --legacy-peer-deps && npm install react-scripts --save
#     - cd client && node node_modules/react-scripts/bin/react-scripts.js build
#     - cd ..

# handlers:
#   # Serve static assets with caching
#   - url: /static
#     static_dir: client/build/static
#     secure: always
#     http_headers:
#       Cache-Control: "public, max-age=31536000, immutable"
    
#   # Serve other static files with appropriate caching
#   - url: /(.*\\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot))$
#     static_files: client/build/\\1
#     upload: client/build/.*\\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$
#     secure: always
#     http_headers:
#       Cache-Control: "public, max-age=31536000"
    
#   # All other requests go to the Node.js app
#   - url: /.*
#     script: auto
#     secure: always

# automatic_scaling:
#   min_idle_instances: 1
#   max_idle_instances: 3
#   min_pending_latency: 30ms
#   max_pending_latency: automatic
#   min_instances: 1
#   max_instances: 5

# network:
#   session_affinity: true
# EOL

#     log "Updated app.yaml with optimized settings"
# }

# # Create .npmrc file for npm configuration
# create_npmrc() {
#     log "Creating .npmrc files"
    
#     # Root .npmrc
#     cat > .npmrc << EOL
# legacy-peer-deps=true
# loglevel=verbose
# EOL

#     # Client .npmrc
#     cat > client/.npmrc << EOL
# legacy-peer-deps=true
# loglevel=verbose
# EOL

#     log "Created .npmrc files for better npm compatibility"
# }

# # Prepare Dependencies with special handling for react-scripts
# prepare_dependencies() {
#     log "Preparing Project Dependencies"
    
#     # Clean npm cache
#     npm cache clean --force

#     # Root dependencies - use npm install instead of npm ci
#     log "Installing root dependencies with npm install"
#     npm install

#     # Client dependencies with special handling for react-scripts
#     cd client
#     log "Installing client dependencies with legacy-peer-deps flag"
#     npm install --legacy-peer-deps
    
#     # Explicitly install react-scripts if it's missing
#     if ! [ -d "node_modules/react-scripts" ]; then
#         log "Installing react-scripts explicitly..."
#         npm install react-scripts --save
#     fi
    
#     # Verify react-scripts is installed
#     if [ -d "node_modules/react-scripts" ]; then
#         log "✅ react-scripts is installed in client/node_modules"
#     else
#         echo -e "${RED}❌ Failed to install react-scripts${NC}"
#         exit 1
#     fi
    
#     cd ..
# }

# # Build Client Application with explicit path to react-scripts
# build_client() {
#     log "Building Client Application"
#     cd client
    
#     # Set environment variables for build
#     export NODE_ENV=production
#     export CI=false
    
#     log "Using explicit path to react-scripts for build"
#     NODE_OPTIONS="--max-old-space-size=2048" node ./node_modules/react-scripts/bin/react-scripts.js build
    
#     # Verify build was successful
#     if [ -d "build" ]; then
#         log "✅ Client build successful"
#     else
#         echo -e "${RED}❌ Client build failed - build directory not found${NC}"
#         exit 1
#     fi
    
#     cd ..
# }

# # Create JWT Secret
# create_jwt_secret() {
#     log "Managing JWT Secret"
#     if ! gcloud secrets describe jwt-secret &>/dev/null; then
#         local jwt_secret=$(openssl rand -base64 32)
#         echo -n "$jwt_secret" | gcloud secrets create jwt-secret --data-file=-
#         echo -e "${GREEN}✅ JWT Secret created${NC}"
#     else
#         echo -e "${YELLOW}⚠️ JWT Secret already exists${NC}"
#     fi
# }

# # Deployment with additional options
# deploy_to_appengine() {
#     log "Deploying to App Engine"
#     local version_tag=$(date +"%Y%m%d%H%M%S")
    
#     log "Running deployment with gcloud app deploy"
#     gcloud app deploy app.yaml \
#         --project="$PROJECT_ID" \
#         --version="v$version_tag" \
#         --quiet
# }

# # Main Deployment Workflow
# main() {
#     clear
#     echo -e "${BLUE}=== AI Email Marketing Platform Deployment ===${NC}"

#     # Validate Project ID
#     PROJECT_ID=$(gcloud config get-value project)
#     if [ -z "$PROJECT_ID" ]; then
#         echo -e "${RED}❌ No GCP Project Selected${NC}"
#         exit 1
#     fi

#     # Execute Enhanced Deployment Steps
#     pre_deployment_checks
#     enable_gcp_services
#     update_client_package_json
#     create_cloudbuild_yaml
#     update_app_yaml
#     create_npmrc
#     prepare_dependencies
#     build_client
#     create_jwt_secret
#     deploy_to_appengine

#     echo -e "${GREEN}✅ Deployment Completed Successfully!${NC}"
#     echo -e "${YELLOW}Access your app at: https://$PROJECT_ID.uc.r.appspot.com${NC}"
# }

# # Execute Main Function
# main "$@"

#!/bin/bash
# Comprehensive Deployment Script for AI-Powered Email Marketing Platform

# Color Codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error Handling
set -e
set -o pipefail
trap 'handle_error $?' ERR

# Error Handler Function
handle_error() {
    echo -e "${RED}❌ Deployment Failed with Error Code: $1 ${NC}"
    echo -e "${YELLOW}Error occurred on line $LINENO${NC}"
    exit 1
}

# Logging Function
log() {
    echo -e "${BLUE}➤ $1${NC}"
}

# Pre-Deployment Checks
pre_deployment_checks() {
    log "Running Pre-Deployment Checks"

    # Check Required Tools
    local tools=("gcloud" "node" "npm" "openssl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo -e "${RED}Error: $tool is not installed.${NC}"
            exit 1
        fi
    done

    # Node.js Version Check
    local node_version=$(node --version | sed 's/v//')
    local min_version="20.0.0"
    if [ "$(printf '%s\n' "$min_version" "$node_version" | sort -V | head -n1)" != "$min_version" ]; then
        echo -e "${RED}❌ Node.js version must be $min_version or higher. Current: $node_version${NC}"
        exit 1
    fi

    # GCP Project Check
    local project_id=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$project_id" ]; then
        echo -e "${RED}❌ No Google Cloud project selected.${NC}"
        echo "Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    log "Using GCP Project: $project_id"
}

# Enable GCP Services
enable_gcp_services() {
    log "Enabling GCP Services"
    local services=(
        "appengine.googleapis.com"
        "secretmanager.googleapis.com"
        "aiplatform.googleapis.com"
        "cloudfunctions.googleapis.com"
        "firestore.googleapis.com"
        "cloudtrace.googleapis.com"
        "monitoring.googleapis.com"
    )

    for service in "${services[@]}"; do
        log "Enabling $service"
        gcloud services enable "$service" || {
            echo -e "${YELLOW}Warning: Could not enable $service${NC}"
        }
    done
}

# Update client package.json to ensure react-scripts is in dependencies
update_client_package_json() {
    log "Updating client package.json for react-scripts"
    
    cd client
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: client/package.json not found${NC}"
        exit 1
    fi
    
    # Use node to modify package.json to ensure react-scripts is in dependencies
    node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync("package.json"));
    
    // Ensure react-scripts is in dependencies
    if (!pkg.dependencies) pkg.dependencies = {};
    pkg.dependencies["react-scripts"] = "^5.0.1";
    
    // Update build script to use explicit path
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts.build = "node ./node_modules/react-scripts/bin/react-scripts.js build";
    
    // Write updated package.json
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
    
    console.log("Updated client package.json with react-scripts in dependencies");
    '
    
    cd ..
}

# Create a custom build script for client
create_client_build_script() {
    log "Creating client build script"
    
    cat > client/build.js << 'EOL'
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom build script for React app...');

// Check if node_modules/react-scripts exists
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'react-scripts'))) {
  console.log('Installing react-scripts...');
  execSync('npm install react-scripts --save --legacy-peer-deps', { stdio: 'inherit' });
}

// Check if react-scripts/bin/react-scripts.js exists
const reactScriptsPath = path.join(__dirname, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');
if (!fs.existsSync(reactScriptsPath)) {
  console.error('Error: react-scripts.js not found at expected path');
  process.exit(1);
}

// Run the build command
console.log('Building the React application...');
try {
  // Use node to execute react-scripts directly
  execSync('node ./node_modules/react-scripts/bin/react-scripts.js build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', CI: 'false' }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
EOL

    # Make the script executable
    chmod +x client/build.js
    
    # Update client's package.json to use this build script
    cd client
    node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync("package.json"));
    
    // Update build script to use our custom script
    pkg.scripts.build = "node build.js";
    
    // Write updated package.json
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
    '
    cd ..
    
    log "Created custom build script for client"
}

# Create cloudbuild.yaml for Google Cloud Build
create_cloudbuild_yaml() {
    log "Creating cloudbuild.yaml for Google Cloud Build"
    
    cat > cloudbuild.yaml << EOL
steps:
  # Install root dependencies
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
    
  # Install client dependencies with legacy peer deps flag
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install', '--legacy-peer-deps']
    dir: 'client'
    
  # Explicitly install react-scripts in client directory
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install', 'react-scripts', '--save']
    dir: 'client'
    
  # Run the custom build script in client directory
  - name: 'gcr.io/cloud-builders/node'
    args: ['build.js']
    dir: 'client'
    env:
      - 'NODE_ENV=production'
      - 'CI=false'
      - 'NODE_OPTIONS=--max_old_space_size=2048'
    
  # Deploy to App Engine
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['app', 'deploy']
    
timeout: '1800s'  # 30 minutes
options:
  logging: CLOUD_LOGGING_ONLY
EOL

    log "Created cloudbuild.yaml"
}

# Create .npmrc file for npm configuration
create_npmrc() {
    log "Creating .npmrc files"
    
    # Root .npmrc
    cat > .npmrc << EOL
legacy-peer-deps=true
loglevel=verbose
EOL

    # Client .npmrc
    cat > client/.npmrc << EOL
legacy-peer-deps=true
loglevel=verbose
EOL

    log "Created .npmrc files for better npm compatibility"
}

# Update app.yaml to include necessary environment variables
update_app_yaml() {
    log "Updating app.yaml with deployment settings"
    
    # Backup existing app.yaml if it exists
    if [ -f "app.yaml" ]; then
        cp app.yaml app.yaml.bak
        log "Backed up existing app.yaml to app.yaml.bak"
    fi
    
    # Create new app.yaml with optimized settings (without lifecycle section)
    cat > app.yaml << EOL
runtime: nodejs20

env_variables:
  NODE_ENV: "production"
  GOOGLE_CLOUD_PROJECT: "${PROJECT_ID}"
  PORT: "8080"
  MONGODB_URI: \${MONGODB_URI}
  JWT_SECRET: \${JWT_SECRET}
  NODE_OPTIONS: "--max_old_space_size=2048"
  NPM_CONFIG_LEGACY_PEER_DEPS: "true"

# Cloud Build specific settings
build_env_variables:
  NPM_CONFIG_LEGACY_PEER_DEPS: "true"
  NODE_OPTIONS: "--max_old_space_size=2048"

handlers:
  # Serve static assets with caching
  - url: /static
    static_dir: client/build/static
    secure: always
    http_headers:
      Cache-Control: "public, max-age=31536000, immutable"
    
  # Serve other static files with appropriate caching
  - url: /(.*\\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot))$
    static_files: client/build/\\1
    upload: client/build/.*\\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$
    secure: always
    http_headers:
      Cache-Control: "public, max-age=31536000"
    
  # All other requests go to the Node.js app
  - url: /.*
    script: auto
    secure: always

automatic_scaling:
  min_idle_instances: 1
  max_idle_instances: 3
  min_pending_latency: 30ms
  max_pending_latency: automatic
  min_instances: 1
  max_instances: 5

network:
  session_affinity: true
EOL

    log "Updated app.yaml with optimized settings (without lifecycle section)"
}

# Prepare Dependencies with special handling for react-scripts
prepare_dependencies() {
    log "Preparing Project Dependencies"
    
    # Clean npm cache
    npm cache clean --force

    # Root dependencies
    log "Installing root dependencies with npm install"
    npm install

    # Client dependencies with special handling for react-scripts
    cd client
    log "Installing client dependencies with legacy-peer-deps flag"
    npm install --legacy-peer-deps
    
    # Explicitly install react-scripts if it's missing
    if ! [ -d "node_modules/react-scripts" ]; then
        log "Installing react-scripts explicitly..."
        npm install react-scripts --save
    fi
    
    # Verify react-scripts is installed
    if [ -d "node_modules/react-scripts" ]; then
        log "✅ react-scripts is installed in client/node_modules"
    else
        echo -e "${RED}❌ Failed to install react-scripts${NC}"
        exit 1
    fi
    
    cd ..
}

# Build Client Application with explicit path to react-scripts using our custom script
build_client() {
    log "Building Client Application"
    cd client
    
    # Set environment variables for build
    export NODE_ENV=production
    export CI=false
    
    log "Using custom build script"
    NODE_OPTIONS="--max-old-space-size=2048" node build.js
    
    # Verify build was successful
    if [ -d "build" ]; then
        log "✅ Client build successful"
    else
        echo -e "${RED}❌ Client build failed - build directory not found${NC}"
        exit 1
    fi
    
    cd ..
}

# Create JWT Secret
create_jwt_secret() {
    log "Managing JWT Secret"
    if ! gcloud secrets describe jwt-secret &>/dev/null; then
        local jwt_secret=$(openssl rand -base64 32)
        echo -n "$jwt_secret" | gcloud secrets create jwt-secret --data-file=-
        echo -e "${GREEN}✅ JWT Secret created${NC}"
    else
        echo -e "${YELLOW}⚠️ JWT Secret already exists${NC}"
    fi
}

# Create a prebuild script to handle building before deployment
create_prebuild_script() {
    log "Creating prebuild.sh script"
    
    cat > prebuild.sh << 'EOL'
#!/bin/bash
# Pre-build script to run before deployment

echo "Running prebuild script to prepare client build..."

# Install dependencies in client directory
cd client || exit 1
npm install --legacy-peer-deps

# Ensure react-scripts is installed
if [ ! -d "node_modules/react-scripts" ]; then
  echo "Installing react-scripts explicitly..."
  npm install react-scripts --save
fi

# Build the client application
export NODE_ENV=production
export CI=false
NODE_OPTIONS="--max-old-space-size=2048" node ./node_modules/react-scripts/bin/react-scripts.js build

# Check if build was successful
if [ ! -d "build" ]; then
  echo "Build failed - build directory not found"
  exit 1
fi

echo "Prebuild completed successfully!"
cd ..
EOL

    chmod +x prebuild.sh
    log "Created prebuild.sh script"
}

# Deployment with additional options
deploy_to_appengine() {
    log "Deploying to App Engine"
    local version_tag=$(date +"%Y%m%d%H%M%S")
    
    # Run prebuild script to ensure client is built before deployment
    log "Running prebuild script"
    ./prebuild.sh
    
    log "Running deployment with gcloud app deploy"
    gcloud app deploy app.yaml \
        --project="$PROJECT_ID" \
        --version="v$version_tag" \
        --quiet
}

# Main Deployment Workflow
main() {
    clear
    echo -e "${BLUE}=== AI Email Marketing Platform Deployment ===${NC}"

    # Validate Project ID
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ No GCP Project Selected${NC}"
        exit 1
    fi

    # Execute Enhanced Deployment Steps
    pre_deployment_checks
    enable_gcp_services
    update_client_package_json
    create_client_build_script
    create_cloudbuild_yaml
    update_app_yaml
    create_npmrc
    create_prebuild_script
    prepare_dependencies
    build_client
    create_jwt_secret
    deploy_to_appengine

    echo -e "${GREEN}✅ Deployment Completed Successfully!${NC}"
    echo -e "${YELLOW}Access your app at: https://$PROJECT_ID.uc.r.appspot.com${NC}"
}

# Execute Main Function
main "$@"