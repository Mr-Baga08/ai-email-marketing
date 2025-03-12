provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# VPC Network
resource "google_compute_network" "vpc_network" {
  name                    = "email-marketing-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "email-marketing-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# Firewall rule to allow external traffic
resource "google_compute_firewall" "allow_external" {
  name    = "allow-external"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "3000", "5000"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# MongoDB instance
resource "google_compute_instance" "mongodb" {
  name         = "mongodb-instance"
  machine_type = "e2-medium"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size  = 50
    }
  }

  network_interface {
    network    = google_compute_network.vpc_network.name
    subnetwork = google_compute_subnetwork.subnet.name
    access_config {}
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl gnupg
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-6.0.gpg
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
  EOF

  tags = ["mongodb", "database"]
}

# Backend App Engine service
resource "google_app_engine_application" "app" {
  project     = var.project_id
  location_id = var.app_engine_location
}

# Cloud Storage bucket for static files and uploads
resource "google_storage_bucket" "static_files" {
  name          = "${var.project_id}-static-files"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
}

# Cloud Storage bucket for uploaded contact lists
resource "google_storage_bucket" "contact_uploads" {
  name          = "${var.project_id}-contact-uploads"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
}

# Vertex AI - Natural Language API
resource "google_project_service" "vertex_ai" {
  project = var.project_id
  service = "aiplatform.googleapis.com"

  disable_dependent_services = true
}

# Secret Manager for storing sensitive information
resource "google_project_service" "secretmanager" {
  project = var.project_id
  service = "secretmanager.googleapis.com"

  disable_dependent_services = true
}

# Create a secret for the email service API key
resource "google_secret_manager_secret" "email_api_key" {
  secret_id = "email-api-key"
  
  replication {
    automatic = true
  }

  depends_on = [google_project_service.secretmanager]
}

# Create secret for MongoDB connection string
resource "google_secret_manager_secret" "mongodb_uri" {
  secret_id = "mongodb-uri"
  
  replication {
    automatic = true
  }

  depends_on = [google_project_service.secretmanager]
}

# Cloud Functions for email automation
resource "google_project_service" "cloudfunctions" {
  project = var.project_id
  service = "cloudfunctions.googleapis.com"

  disable_dependent_services = true
}

# Cloud Function for processing incoming emails
resource "google_storage_bucket" "function_bucket" {
  name     = "${var.project_id}-function-bucket"
  location = var.region
}

# Firestore database for real-time updates
resource "google_project_service" "firestore" {
  project = var.project_id
  service = "firestore.googleapis.com"

  disable_dependent_services = true
}

resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}