# 🍭 Sweet Shop Management System

A full-stack web application for managing a sweet shop inventory with user authentication, admin controls, and real-time inventory management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Setup](#database-setup)
- [My AI Usage](#my-ai-usage)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Authentication
- User registration and login
- JWT-based authentication
- Role-based access control (User/Admin)
- Protected routes
- Auto-redirect after login

### User Features
- Browse all available sweets
- Search and filter sweets by name, category, and price range
- Purchase sweets (decreases quantity automatically)
- View sweet details (name, category, price, quantity, images)

### Admin Features
- Add new sweets with images
- Update existing sweets
- Delete sweets
- Restock inventory
- Full CRUD operations on sweets

### UI/UX
- Responsive design with Tailwind CSS
- Modern and intuitive interface
- Real-time updates
- Error handling and validation
- Loading states

## 🛠 Tech Stack

### Frontend
- **React 19.2.0** - UI library
- **Vite 7.2.2** - Build tool and dev server
- **React Router DOM 7.9.6** - Client-side routing
- **Axios 1.13.2** - HTTP client
- **Tailwind CSS 4.1.17** - Utility-first CSS framework

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **MongoDB** - Database
- **Mongoose 8.19.4** - MongoDB object modeling
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **bcryptjs 3.0.3** - Password hashing
- **Multer 2.0.2** - File upload handling
- **CORS 2.8.5** - Cross-origin resource sharing

## 📁 Project Structure

```
sweet-shop-managment-system/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── jwt.js              # JWT token generation
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── sweetController.js # Sweet CRUD operations
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT authentication
│   │   └── adminMiddleware.js # Admin role check
│   ├── models/
│   │   ├── userModel.js       # User schema
│   │   └── sweetModel.js      # Sweet schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── sweetRoutes.js     # Sweet endpoints
│   ├── scripts/
│   │   └── fixDatabaseIndexes.js # DB cleanup script
│   └── server.js               # Express server
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── SearchBar.jsx
    │   │   └── SweetCard.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx # Global auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── AdminPanel.jsx
    │   ├── utils/
    │   │   ├── axios.js        # API client
    │   │   └── jwt.js          # JWT utilities
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_jwt_key
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

4. Fix database indexes (if needed):
```bash
npm run fix-db
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run server

# Production mode
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
- `MONGODB_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `NODE_ENV` - Environment (development/production)

#### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)

## 📖 Usage

### Starting the Application

1. **Start MongoDB** (if running locally)

2. **Start Backend Server**:
```bash
cd backend
npm run server
```

3. **Start Frontend** (in a new terminal):
```bash
cd frontend
npm run dev
```

4. **Access the Application**:
   - Open `http://localhost:5173` in your browser
   - Register a new account or login
   - For admin access, register with role "admin"

### User Workflow

1. Register/Login → Dashboard
2. Browse sweets in the dashboard
3. Use search/filter to find specific sweets
4. Click "Purchase" to buy a sweet (decreases quantity)

### Admin Workflow

1. Login as admin → Admin Panel
2. Click "Add New Sweet" to create a sweet
3. Use "Edit" to update sweet details
4. Use "Restock" to increase quantity
5. Use "Delete" to remove a sweet

## 📡 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Body: { username, password, role? }
Response: { token, user: { id, username, role } }
```

#### Login
```
POST /api/auth/login
Body: { username, password }
Response: { token, user: { id, username, role } }
```

### Sweet Endpoints (Protected)

#### Get All Sweets
```
GET /api/sweets
Headers: Authorization: Bearer <token>
Response: Array of sweet objects
```

#### Search Sweets
```
GET /api/sweets/search?name=&category=&minPrice=&maxPrice=
Headers: Authorization: Bearer <token>
Response: Array of filtered sweet objects
```

#### Add Sweet (Admin Only)
```
POST /api/sweets
Headers: Authorization: Bearer <token>
Body: FormData { name, category, price, quantity, image? }
Response: Created sweet object
```

#### Update Sweet (Admin Only)
```
PUT /api/sweets/:id
Headers: Authorization: Bearer <token>
Body: FormData { name?, category?, price?, quantity?, image? }
Response: Updated sweet object
```

#### Delete Sweet (Admin Only)
```
DELETE /api/sweets/:id
Headers: Authorization: Bearer <token>
Response: { message: "Sweet deleted successfully" }
```

#### Purchase Sweet
```
POST /api/sweets/:id/purchase
Headers: Authorization: Bearer <token>
Response: Updated sweet object (quantity decreased by 1)
```

#### Restock Sweet (Admin Only)
```
POST /api/sweets/:id/restock
Headers: Authorization: Bearer <token>
Body: { amount: number }
Response: Updated sweet object (quantity increased)
```

## 🗄 Database Setup

### MongoDB Connection

1. Create a MongoDB database (local or MongoDB Atlas)
2. Update `MONGODB_URI` in backend `.env`:
   - Local: `mongodb://localhost:27017/sweet-shop`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/sweet-shop`

### Database Indexes

If you encounter duplicate key errors related to email indexes, run:
```bash
cd backend
npm run fix-db
```

This script will:
- Remove old `email_1` index (if exists)
- Ensure `username_1` index is properly created

## 🤖 My AI Usage

### Overview

Throughout the development of this Sweet Shop Management System, I leveraged various AI tools to enhance productivity, solve complex problems, and improve code quality. This section documents my AI-assisted development journey.

### AI Tools Used

#### 1. **Cursor AI (Primary Tool)**
- **Purpose**: Code generation, debugging, and refactoring
- **Usage**: 
  - Generated complete frontend components (Login, Register, Dashboard, AdminPanel)
  - Created backend controllers and middleware
  - Fixed database index issues and error handling
  - Refactored code for better structure and maintainability

#### 2. **GitHub Copilot**
- **Purpose**: Inline code suggestions and autocompletion
- **Usage**:
  - Suggested React hooks and component patterns
  - Auto-completed API endpoint structures
  - Generated utility functions for JWT decoding
  - Provided boilerplate code for error handling

#### 3. **ChatGPT (OpenAI)**
- **Purpose**: Problem-solving and architecture decisions
- **Usage**:
  - Brainstormed API endpoint structures and RESTful design
  - Discussed authentication flow and JWT implementation
  - Resolved MongoDB schema design questions
  - Analyzed error messages and suggested fixes

### Specific Use Cases

#### 1. **Frontend Development**

**Component Generation:**
- I used Cursor AI to generate the complete React component structure for the Dashboard, AdminPanel, and authentication pages. For example, I prompted: *"Create a Dashboard component that fetches sweets from the API and displays them in a grid layout with search functionality"*

**State Management:**
- Used AI to design the AuthContext structure. I asked: *"How should I structure a React context for authentication that handles login, register, and token management?"*

**API Integration:**
- Generated the Axios configuration with interceptors. Prompt: *"Create an Axios instance with token interceptor and error handling for 401 responses"*

#### 2. **Backend Development**

**API Endpoint Design:**
- Used ChatGPT to brainstorm the RESTful API structure. Discussion: *"What endpoints do I need for a sweet shop management system with user and admin roles?"*

**Error Handling:**
- Asked Cursor AI: *"How should I handle MongoDB duplicate key errors and provide meaningful error messages?"* This led to improved error handling in the authController.

**Database Schema:**
- Consulted AI about Mongoose schema design: *"What's the best way to store images in MongoDB? Should I use Buffer or Cloudinary?"*

#### 3. **Problem Solving**

**Database Index Issue:**
- When encountering the `E11000 duplicate key error` for email indexes, I asked: *"I'm getting a duplicate key error on email_1 index but my schema doesn't have an email field. How do I fix this?"* The AI suggested creating a cleanup script to remove old indexes.

**FormData Handling:**
- Encountered issues with file uploads. Asked: *"How do I properly handle FormData in Express with Multer and send it from React?"* This led to fixing Content-Type headers and FormData handling.

**Authentication Flow:**
- Discussed JWT implementation: *"How do I implement JWT authentication with role-based access control in Express?"* This helped structure the middleware and token generation.

#### 4. **Code Quality**

**Refactoring:**
- Used AI to refactor code for better structure. Example: *"How can I improve error handling in my controllers to be more consistent?"*

**Validation:**
- Generated validation logic: *"Add input validation for sweet creation that checks price, quantity, and image types"*

**Documentation:**
- Asked AI to help structure this README: *"What sections should a comprehensive README include for a full-stack project?"*

### Impact on Workflow

#### Positive Impacts

1. **Accelerated Development**: AI tools significantly sped up the development process. What would have taken days to build manually was completed in hours with AI assistance.

2. **Learning Enhancement**: While using AI, I learned new patterns and best practices. For example, I learned about React Context API patterns, JWT implementation details, and MongoDB index management.

3. **Error Resolution**: AI was invaluable for debugging. When I encountered the database index error, AI provided a clear explanation and solution path.

4. **Code Consistency**: AI helped maintain consistent code style and patterns across the codebase, especially in error handling and API responses.

5. **Architecture Decisions**: AI served as a sounding board for architectural decisions, helping me think through trade-offs.

#### Challenges and Learnings

1. **Over-reliance Risk**: Initially, I found myself relying too heavily on AI-generated code without fully understanding it. I learned to review and understand all AI-generated code before using it.

2. **Context Management**: AI sometimes lost context in long conversations. I learned to break down complex problems into smaller, focused questions.

3. **Code Review**: AI-generated code isn't always perfect. I learned to always test and review AI suggestions, especially for security-sensitive areas like authentication.

4. **Best Practices**: Not all AI suggestions follow best practices. I learned to cross-reference AI suggestions with official documentation and community standards.

### Reflection

**Overall Assessment:**

AI tools have been transformative for this project. They enabled me to:
- Build a full-stack application faster than I could have manually
- Learn modern development patterns through AI-generated examples
- Solve complex problems (like database index issues) that would have required extensive research
- Maintain code quality and consistency

However, I also learned that AI is a tool, not a replacement for:
- Understanding the code you write
- Testing and debugging
- Security considerations
- Code review and quality assurance

**Key Takeaway:**

The most effective use of AI was when I used it as a collaborative partner—asking questions, getting suggestions, but always understanding and adapting the code to fit my specific needs. The combination of AI assistance with my own knowledge and critical thinking resulted in a robust, well-structured application.

**Future Use:**

I plan to continue using AI tools for:
- Generating boilerplate code
- Debugging complex issues
- Learning new technologies
- Code refactoring suggestions

But I'll always ensure I understand the code, test thoroughly, and maintain security best practices.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- MongoDB for the flexible database solution
- Tailwind CSS for the utility-first CSS framework
- All the open-source contributors whose packages made this project possible

---

**Note**: This project was developed as a learning exercise and demonstrates full-stack development skills with modern technologies.

