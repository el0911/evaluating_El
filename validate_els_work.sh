#!/bin/bash

# Function to check if Docker and Docker Compose are installed
check_dependencies() {
  if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
  fi
}

# Function to run Docker Compose
run_docker_compose() {
  echo "Starting Docker containers with 'docker-compose up'..."
  docker-compose up 
}

# Function to ensure wait-for-it.sh is executable
set_executable_permission() {
  echo "Setting executable permissions for 'wait-for-it.sh'..."
  chmod +x wait-for-it.sh
}

# Run checks and setup
check_dependencies
set_executable_permission
run_docker_compose


echo "Validation and setup complete."
