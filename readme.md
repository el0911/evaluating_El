Certainly! Here's an extensive documentation in Markdown format for your project. This guide will cover project setup, usage, and how to get started, including running the `./validate_els_work.sh` script.

---

# Project Documentation

## Overview

This project provides a system for managing and executing flows based on specific events. Each flow can contain multiple actions, which can either be email notifications or delays. The system ensures that flows and actions are managed efficiently and prevents duplication of trigger events and action orders.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
  - [Create Flow](#create-flow)
  - [Get Flow](#get-flow)
  - [Create Event](#create-event)
  - [Edit Flow](#edit-flow)
  - [Delete Flow](#delete-flow)
- [Error Handling](#error-handling)
- [Scripts](#scripts)
  - [validate_els_work.sh](#validate_els_worksh)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you start, make sure you have the following installed:

- **Node.js**: Required for running the application server.
- **npm**: Node.js package manager.

- **PostgreSQL**: Database system used by the application.
- **Prisma**: ORM for interacting with the PostgreSQL database.
### Scrap the last 2 i dockerized it 
- **Docker**: For containerization and running PostgreSQL.


## Project Setup

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```
 
2. **Configure Environment Variables**

   Create a `.env` file in the root directory and add your database configuration:

   ```plaintext
   DATABASE_URL=postgresql://user:password@localhost:5432/email_automation
   ```

3. **Run `validate_els_work.sh` Script**

   This script performs initial validations and setup checks. Ensure you run this script before starting the project.

   ```bash
   ./validate_els_work.sh
   ```

   This script ensures that the environment is properly configured and that necessary preconditions are met and runs the project.

   The application will start and listen for requests on the specified port (default is 3000).


 
## Approach to the task
Flows shoud be seen as chains of actions and this actions can be anything from sending emails, delaying, making logs, sending push notification, launching nuclear warheads, but we are just using email and delay, fr the email service that is already provided, for delay i could use timeout to perform delays but i opted for bullmq queeing service, and implmented a simple postgres Db architecture to save flows and know which actions come after the other. 

Actions should be incharge of calling thee next actions so the flow is handled recursively which lets us have btter handling of possible errors.


## API Endpoints

### Create Flow

- **Endpoint:** `POST /api/flows`
- **Description:** Creates a new flow with specified actions.
- **Request Body:**

  ```json
  {
    "triggerEvent": "user_delete",
    "actions": [
      {
        "type": "email",
        "emailSubject": "Account Deleted",
        "emailBody": "We're sorry to see you go. Your account has been successfully deleted.",
        "delayMinutes": 0,
        "order": 1
      },
      {
        "type": "delay",
        "emailSubject": null,
        "emailBody": null,
        "delayMinutes": 5,
        "order": 2
      }
    ]
  }
  ```

- **Response:**

  ```json
  {
    "id": 1,
    "triggerEvent": "user_delete",
    "actions": [
      {
        "id": 1,
        "type": "email",
        "emailSubject": "Account Deleted",
        "emailBody": "We're sorry to see you go. Your account has been successfully deleted.",
        "delayMinutes": 0,
        "order": 1
      },
      {
        "id": 2,
        "type": "delay",
        "emailSubject": null,
        "emailBody": null,
        "delayMinutes": 5,
        "order": 2
      }
    ],
    "createdAt": "2024-08-07T12:00:00.000Z",
    "updatedAt": "2024-08-07T12:00:00.000Z"
  }
  ```
### Create Event

- **Endpoint:** `POST /api/event`
- **Description:** Creates a new event wiith a flow.
- **Request Body:**

  ```json
    {
        "eventName": "user_signup",
        "userEmail": "pete@healthtech1.uk"
    }
  ```

- **Response:**

  ```json
        {
            "message": "Flow execution queued"
        }
  ```

### Get Flow

- **Endpoint:** `GET /api/flows/:id`
- **Description:** Retrieves a flow by its ID.
- **Response:**

  ```json
  {
    "id": 1,
    "triggerEvent": "user_delete",
    "actions": [
      {
        "id": 1,
        "type": "email",
        "emailSubject": "Account Deleted",
        "emailBody": "We're sorry to see you go. Your account has been successfully deleted.",
        "delayMinutes": 0,
        "order": 1
      },
      {
        "id": 2,
        "type": "delay",
        "emailSubject": null,
        "emailBody": null,
        "delayMinutes": 5,
        "order": 2
      }
    ],
    "createdAt": "2024-08-07T12:00:00.000Z",
    "updatedAt": "2024-08-07T12:00:00.000Z"
  }
  ```

### Edit Flow

- **Endpoint:** `PUT /api/flows/:id`
- **Description:** Updates an existing flow.
- **Request Body:**

  ```json
  {
    "triggerEvent": "user_update",
    "actions": [
      {
        "type": "email",
        "emailSubject": "Account Updated",
        "emailBody": "Your account information has been updated.",
        "delayMinutes": 0,
        "order": 1
      },
      {
        "type": "delay",
        "emailSubject": null,
        "emailBody": null,
        "delayMinutes": 10,
        "order": 2
      }
    ]
  }
  ```

- **Response:**

  ```json
  {
    "id": 1,
    "triggerEvent": "user_update",
    "actions": [
      {
        "id": 1,
        "type": "email",
        "emailSubject": "Account Updated",
        "emailBody": "Your account information has been updated.",
        "delayMinutes": 0,
        "order": 1
      },
      {
        "id": 2,
        "type": "delay",
        "emailSubject": null,
        "emailBody": null,
        "delayMinutes": 10,
        "order": 2
      }
    ],
    "createdAt": "2024-08-07T12:00:00.000Z",
    "updatedAt": "2024-08-07T12:00:00.000Z"
  }
  ```

### Delete Flow

- **Endpoint:** `DELETE /api/flows/:id`
- **Description:** Deletes a flow by its ID.
- **Response:**

  ```json
  {
    "message": "Flow deleted successfully"
  }
  ```

## Error Handling

- **400 Bad Request:** Returned when validation fails (e.g., missing `triggerEvent`, invalid action types, duplicate orders).
- **409 Conflict:** Returned if the `triggerEvent` already exists.
- **500 Internal Server Error:** Returned for unexpected errors or database issues.

## Scripts

### `validate_els_work.sh`

- **Purpose:** This script is used to perform initial validations and setup checks for the project.
- **Usage:**

  ```bash
  chmod +x validate_els_work.sh

  ./validate_els_work.sh
  ```

  This script will ensure that all necessary configurations are in place and that the environment is ready for running the application.

## Troubleshooting

- **Database Connection Issues:** Ensure that PostgreSQL is running and that the `DATABASE_URL` in your `.env` file is correctly configured.
- **Dependency Errors:** Ensure that all npm packages are installed. Run `npm install` to install missing dependencies.
- **API Errors:** Check the server logs for detailed error messages to diagnose issues.

---

Feel free to customize this documentation based on additional features or specific requirements of your project.