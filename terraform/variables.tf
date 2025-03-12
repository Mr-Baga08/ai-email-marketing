variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "app_engine_location" {
  description = "The App Engine location"
  type        = string
  default     = "us-central"
}

variable "firestore_location" {
  description = "The Firestore database location"
  type        = string
  default     = "us-central"
}