# **Nest Store**

**Nest Store** is a backend application designed to facilitate **order management** and **real-time communication** between users and admins. It provides a comprehensive API that supports **user authentication**, **order management**, and **chatroom messaging** via WebSocket.

---

## **Features**

- **User Authentication**: Secure user registration and login with JWT tokens.
- **Order Management**: Admins and users can create, view, and manage orders.
- **Real-Time Chatrooms**: Admins and users can interact through real-time WebSocket connections in dedicated chatrooms linked to orders.
- **Role-Based Access Control**: Differentiates user access between **ADMIN** and **USER** roles for endpoints.

---

## **Tech Stack**

- **Backend**:  
  - **NestJS**: Framework for building efficient, scalable Node.js applications.
  - **Prisma**: ORM for database interactions.
  - **Socket.IO**: For real-time communication between the server and clients.
  - **JWT**: For secure user authentication.

- **Database**:  
  - **MySQL** (or other relational database)

---

## **API Endpoints**

### **Authentication**
- **POST** `/auth/register`: Register a new user with email, password, and role (admin or user).
- **POST** `/auth/login`: Log in an existing user with email and password, receiving a JWT token.
- **GET** `/users`: Get all users (admin only).
- **GET** `/users/:id`: Get a specific user by ID (admin only).

### **Orders**
- **POST** `/orders`: Create a new order (authenticated users).
- **GET** `/orders`: View all orders (users only see their own, admins see all).
- **GET** `/orders/:id`: View a specific order.
- **PATCH** `/orders/:id/status`: Update the status of an order (admin only).

### **Chatrooms**
- **GET** `/chatroom`: Get all chatrooms (users only see their own, admins see all).
- **GET** `/chatroom/:chatroomId`: View a specific chatroom.
- **PATCH** `/chatroom/:chatroomId/close`: Close a chatroom (admin only).
- **POST** `/chatroom/:chatroomId/create-message`: Send a message in a chatroom (user and admin).
- **GET** `/chatroom/:chatroomId/messages`: Get all messages in a specific chatroom.

---

## **WebSocket Communication**

- **Namespace**: `/chat`
- **Events**:
  - **sendMessage**: Used to send messages in the chatroom.
  - **error**: Emitted when an error occurs in the WebSocket communication.

---

## **Running the Project Locally**

### **Prisma Setup**
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file with the correct database URL and JWT Secret:
   ```bash
   DATABASE_URL="your-database-connection-url"
   JWT_SECRET=yoursecret
   ```

3. Run Prisma migrations to set up your database:
   ```bash
   npx prisma migrate deploy
   ```

4. Seed your database if needed:
   ```bash
   npx prisma db seed
   ```

### **Start the Application**
1. Start the application locally:
   ```bash
   npm run start:dev
   ```

2. The application will run on `http://localhost:3000`.

---

## **Testing**

Use Postman to test the API endpoints. The documentation for the endpoints is available **[here]([insert-link-to-postman-collection](https://documenter.getpostman.com/view/37830700/2sAYJ7geRy))**.

---

### Running E2E Tests

You can run your end-to-end (e2e) tests in two ways:

1. **Run All E2E Tests:**
   To run all the e2e tests at once for your project, use the following command:

   ```bash
   npm run test:e2e
   ```

   This will run all the test suites for the various features (Auth, Chat, Order, etc.).

2. **Run Specific E2E Tests:**
   If you want to run tests for a specific feature, you can specify the feature name. The available options are:
   
   - `auth`
   - `chat`
   - `order`
   - `app`

   To run the e2e tests for a specific feature, use the following command:

   ```bash
   npm run test:e2e <feature-name>
   ```

   Example:

   - To run tests for authentication (`auth`):

     ```bash
     npm run test:e2e auth
     ```

   - To run tests for chat (`chat`):

     ```bash
     npm run test:e2e chat
     ```

   - To run tests for orders (`order`):

     ```bash
     npm run test:e2e order
     ```

   - To run tests for the app (`app`):

     ```bash
     npm run test:e2e app
     ```

---

### Troubleshooting:
- To resolve errors that may arise from database conflicts when running tests together, consider using `maxWorkers: 1` in the Jest config.

### **Testing WebSocket Connection**

You can easily test the WebSocket connection using the HTML files provided in the project.

### **Steps to Test:**

1. Start the application
2. Create two users - one admin and one user.
3. Login and generate auth tokens for both users.
4. Navigate to the [`./test_html`](./test_html/) folder in the project directory.
5. Open the provided **HTML files** in your browser. User in one tab, Admin in the other.
6. Locate the **script section** in the HTML file where the WebSocket connection is set up.
7. **Add your Auth Tokens and ChatroomID** in the script, replacing the placeholder with your valid JWT token and a valid chatroomID. Place user token in the user HTML and admin token in the admin HTML file.
   
   Example:
   ```javascript
    const chatroomId = 1; // Example chatroom ID
    const authToken = 'eyJhbGciOiJIUz...'; // Replace with your AUTH token
    const socket = io('http://localhost:3000/chat', {
      query: { chatroomId },
      extraHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
   ```

8. After adding the token, you can interact with the WebSocket server by sending messages in the chatroom.
9. You will receive real-time updates in the chatroom, and you can also test the `sendMessage` event to ensure it works properly.

This allows you to simulate real-time messaging and test the WebSocket functionality before integrating it into your frontend application.

---

## **Contributing**

I welcome contributions to the project!
Please fork the repository, create a feature branch, and submit a pull request.

---

## **To-Do**

- [ ] Set up **Error Logging** and **Monitoring** for better debugging.
- [ ] Add **Unit Tests** for chatroom and order management services.
- [ ] Create **Admin Dashboard** for order management and user management.
- [ ] Improve **WebSocket UI** to better handle real-time messaging for users and admins.
- [ ] Integrate **Frontend** application to interact with API endpoints.