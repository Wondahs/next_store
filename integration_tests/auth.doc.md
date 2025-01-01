# Integration Testing for AuthController

This document explains how to set up and run integration tests for the `AuthController` in your NestJS application. These tests will interact with a real database, create users, and generate real JWT tokens.

## Explanation

The following integration tests are included:

### 1. **Register User Test**
   - **Endpoint**: `POST /auth/register`
   - **Description**: This test sends a request to register a new user with the given `email`, `password`, and `role`. The response should return the user object, including an `id`, `email`, and `role`.

### 2. **Login User Test**
   - **Endpoint**: `POST /auth/login`
   - **Description**: This test registers a user and then logs in with the same credentials. The response should return a JWT token (`access_token`) that can be used to authenticate subsequent requests.

### 3. **Admin Access to Users Test**
   - **Endpoint**: `GET /auth/users`
   - **Description**: This test logs in as an admin and retrieves a list of all users in the database. The request requires a valid JWT token with admin privileges, and the response should return an array of user objects.

### 4. **Non-Admin Access to Users Test**
   - **Endpoint**: `GET /auth/users`
   - **Description**: This test attempts to access the `/auth/users` endpoint with a non-admin user's JWT token. It should return a `403 Forbidden` response with an appropriate error message.

## Setup Instructions

1. **Configure Test Database**:
   - Ensure that your application connects to a separate test database (e.g., `test_db`) by using an environment variable or a separate database connection in your `prisma.schema` or `.env.test` file.
   
2. **Test Database Cleanup**:
   - The tests ensure database isolation by cleaning up all users after each test using `prismaService.user.deleteMany({})`.

3. **Install Dependencies**:
   - If you haven't already, install the necessary dependencies for testing:
   ```bash
   npm install --save-dev jest @nestjs/testing supertest
