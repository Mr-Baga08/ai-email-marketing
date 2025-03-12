#!/bin/bash
# deploy.sh

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== AI-Powered Email Marketing & Automation Deployment ===${NC}"

# Check for gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: Google Cloud SDK (gcloud) is not installed or not in PATH.${NC}"
    echo "Please install the Google Cloud SDK from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get GCP project ID
echo -e "${YELLOW}Checking GCP configuration...${NC}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No Google Cloud project ID found.${NC}"
    echo "Please set your project ID: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}Using GCP project: $PROJECT_ID${NC}"

# Ensure app.yaml exists in root directory
echo -e "${YELLOW}Checking for app.yaml in root directory...${NC}"
if [ ! -f "app.yaml" ]; then
    echo -e "${YELLOW}Creating app.yaml in root directory...${NC}"
    cat > app.yaml << 'EOL'
runtime: nodejs18

env_variables:
  NODE_ENV: "production"
  GOOGLE_CLOUD_PROJECT: "your-project-id"
  PORT: "8080"

handlers:
  # Serve static assets
  - url: /static
    static_dir: client/build/static
    secure: always
    
  # Serve other static files
  - url: /(.*\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot))$
    static_files: client/build/\1
    upload: client/build/.*\.(json|ico|js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$
    secure: always
    
  # All other requests go to the Node.js app
  - url: /.*
    script: auto
    secure: always

automatic_scaling:
  min_idle_instances: 1
  max_idle_instances: automatic
  min_pending_latency: automatic
  max_pending_latency: automatic
  min_instances: 1
  max_instances: 10

network:
  session_affinity: true
EOL
fi

# Update app.yaml with project ID
echo -e "${YELLOW}Updating app.yaml with project ID...${NC}"
sed -i "s/your-project-id/$PROJECT_ID/g" app.yaml

# Enable required APIs
echo -e "${YELLOW}Enabling required GCP APIs...${NC}"
gcloud services enable appengine.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com

# Check for ThemeContext
echo -e "${YELLOW}Checking for ThemeContext...${NC}"
if [ ! -f "client/src/contexts/ThemeContext.jsx" ]; then
    echo -e "${YELLOW}Creating ThemeContext...${NC}"
    mkdir -p client/src/contexts
    cat > client/src/contexts/ThemeContext.jsx << 'EOL'
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Check if user has a theme preference stored
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    } else {
      // Check for OS level preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Update body class and localStorage when theme changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
EOL
    echo -e "${GREEN}ThemeContext created.${NC}"
fi

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm install
cd client && npm install && npm run build && cd ..

# Deploy to App Engine
echo -e "${YELLOW}Deploying to App Engine...${NC}"
gcloud app deploy app.yaml --quiet

# Create secret for JWT
echo -e "${YELLOW}Setting up JWT secret in Secret Manager...${NC}"
if ! gcloud secrets describe jwt-secret &>/dev/null; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
  echo -e "${GREEN}JWT secret created.${NC}"
else
  echo -e "${YELLOW}JWT secret already exists, skipping creation...${NC}"
fi

echo -e "${GREEN}Deployment completed! Your application is now live on App Engine.${NC}"
echo -e "You can access it at: https://$PROJECT_ID.uc.r.appspot.com"