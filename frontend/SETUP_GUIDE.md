# Smart Employee Management System - Complete Setup Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Frontend Setup](#frontend-setup)
4. [Running the Application](#running-the-application)
5. [Available Routes](#available-routes)
6. [Component Documentation](#component-documentation)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

This is a **full-stack Smart Employee Management System** with:
- JWT-based authentication with role-based access control
- Comprehensive employee management
- Attendance tracking and reporting
- Leave management with approval workflow
- Payroll management with PDF generation
- Task management system
- Performance analytics with charts
- Report generation and export
- Notification system

---

## Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite 5.0** - Fast build tool
- **Tailwind CSS 3.3** - Utility-first CSS
- **Chart.js 4.4** - Data visualization
- **Axios 1.6** - HTTP client
- **React Router DOM 6.20** - Client-side routing
- **React Icons 4.12** - Icon library

### Backend (Pre-built)
- **Node.js + Express.js** - Backend server
- **MongoDB + Mongoose** - Database
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **PDFKit** - PDF generation
- **Nodemailer** - Email notifications

---

## Frontend Setup

### Step 1: Install Dependencies

Navigate to the frontend directory and install all required packages:

```bash
cd frontend
npm install
```

This will install:
- React and React DOM
- Vite (build tool)
- Tailwind CSS and PostCSS
- Axios (HTTP client)
- Chart.js and react-chartjs-2
- React Router DOM
- React Icons
- ESLint for code quality

### Step 2: Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:

```env
# Backend API URL (ensure backend is running on this URL)
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Project Structure

```
frontend/
├── src/
│   ├── pages/                 # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Employees.jsx
│   │   ├── Attendance.jsx
│   │   ├── Leave.jsx
│   │   ├── Payroll.jsx
│   │   ├── Tasks.jsx
│   │   ├── Performance.jsx
│   │   ├── Reports.jsx
│   │   └── Notifications.jsx
│   ├── components/            # Reusable components
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   ├── context/               # React Context
│   │   └── AuthContext.jsx
│   ├── services/              # API services
│   │   ├── apiClient.js
│   │   └── authService.js
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .gitignore
└── README.md
```

---

## Running the Application

### Prerequisites
1. **Backend running**: Start the backend server first
   ```bash
   cd backend
   npm install
   npm run dev
   # Backend runs on http://localhost:5000
   ```

2. **MongoDB**: Ensure MongoDB is running (local or Atlas)

3. **Node.js**: v16 or higher

### Start Development Server

From the frontend directory:

```bash
npm run dev
```

The frontend will be available at:
- **http://localhost:5173** (Vite dev server)

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Available Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page

### Protected Routes (Require Authentication)

| Route | Component | Required Role | Description |
|-------|-----------|--------------|-------------|
| `/dashboard` | Dashboard | All | Main dashboard with statistics |
| `/employees` | Employees | Admin, HR | Employee management CRUD |
| `/attendance` | Attendance | All | Attendance marking & tracking |
| `/leave` | Leave | All | Leave requests management |
| `/payroll` | Payroll | HR | Payroll records & payslip download |
| `/tasks` | Tasks | All | Task management & tracking |
| `/performance` | Performance | All | Performance analytics |
| `/reports` | Reports | HR | Report generation |
| `/notifications` | Notifications | All | System notifications |

---

## Component Documentation

### AuthContext (`context/AuthContext.jsx`)

Provides authentication state and methods to all components.

**Usage:**
```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated, hasRole } = useAuth();
  
  if (!isAuthenticated) return <p>Not logged in</p>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

**Available Methods:**
- `user` - Current user object
- `login(email, password)` - Login user
- `logout()` - Logout user
- `isAuthenticated` - Boolean indicating if user is logged in
- `hasRole(role)` - Check if user has specific role
- `hasAnyRole(roles)` - Check if user has any of the provided roles

### ProtectedRoute (`components/ProtectedRoute.jsx`)

Protects routes from unauthorized access.

**Usage:**
```javascript
<ProtectedRoute requiredRole="Admin">
  <AdminPage />
</ProtectedRoute>
```

### API Client (`services/apiClient.js`)

Axios instance with automatic JWT token handling.

**Features:**
- Automatically adds authorization header
- Handles 401 errors and redirects to login
- Centralized error handling

**Usage:**
```javascript
import apiClient from './services/apiClient';

// GET request
const response = await apiClient.get('/employees');

// POST request
await apiClient.post('/employees', { name: 'John' });

// PUT request
await apiClient.put(`/employees/${id}`, { name: 'Jane' });

// DELETE request
await apiClient.delete(`/employees/${id}`);
```

### Auth Service (`services/authService.js`)

Utility functions for authentication operations.

**Methods:**
- `login(email, password)` - Login and store token
- `register(userData)` - Register new user
- `logout()` - Clear stored credentials
- `getCurrentUser()` - Get user from localStorage
- `getToken()` - Get stored JWT token
- `isAuthenticated()` - Check if user is logged in
- `hasRole(role)` - Check user role
- `hasAnyRole(roles)` - Check multiple roles

---

## API Integration

### Authentication Flow

1. **Register**
   ```javascript
   POST /api/auth/register
   {
     "name": "John Doe",
     "email": "john@company.com",
     "password": "securepass123",
     "role": "Employee"
   }
   ```

2. **Login**
   ```javascript
   POST /api/auth/login
   {
     "email": "john@company.com",
     "password": "securepass123"
   }
   // Response includes JWT token and user data
   ```

3. **Protected Requests**
   - Token is automatically added to headers as: `Authorization: Bearer {token}`
   - Token expires after 8 hours (auto logout)

### Employee Management

```javascript
// Fetch all employees
GET /api/employees

// Get single employee
GET /api/employees/:id

// Create employee
POST /api/employees
{ "name", "email", "position", "department", "salary" }

// Update employee
PUT /api/employees/:id
{ updated fields }

// Delete employee
DELETE /api/employees/:id
```

### Attendance

```javascript
// Get attendance for date
GET /api/attendance?date=2024-01-15

// Mark attendance
POST /api/attendance/mark
{ "employeeId", "date", "status" }

// Get attendance history
GET /api/attendance/employee/:id
```

### Leave Management

```javascript
// Apply for leave
POST /api/leave/apply
{ "startDate", "endDate", "leaveType", "reason" }

// Get all leave requests
GET /api/leave

// Approve leave
PUT /api/leave/:id/approve

// Reject leave
PUT /api/leave/:id/reject
```

### Payroll

```javascript
// Get payroll records
GET /api/payroll?month=2024-01

// Download payslip
GET /api/payroll/:id/pdf
```

### Tasks

```javascript
// Get all tasks
GET /api/tasks

// Create task
POST /api/tasks
{ "title", "description", "assignedTo", "dueDate", "priority" }

// Update task status
PUT /api/tasks/:id
{ "status" }

// Delete task
DELETE /api/tasks/:id
```

### Performance

```javascript
// Get performance records
GET /api/performance

// Get performance for employee
GET /api/performance/employee/:id
```

### Reports

```javascript
// Generate attendance report
GET /api/reports/attendance?month=2024-01

// Generate payroll report
GET /api/reports/payroll?month=2024-01

// Generate leave report
GET /api/reports/leave?month=2024-01

// Generate performance report
GET /api/reports/performance?month=2024-01
```

---

## Styling

### Tailwind CSS Utilities

The app uses Tailwind CSS with custom styles in `index.css`:

```css
/* Buttons */
.btn-primary    /* Blue button */
.btn-secondary  /* Gray button */
.btn-danger     /* Red button */
.btn-success    /* Green button */

/* Forms */
.input-field    /* Standard input styling */

/* Cards */
.card           /* Card with shadow and padding */

/* Badges */
.badge          /* Badge base style */
.badge-success  /* Green badge */
.badge-danger   /* Red badge */
.badge-warning  /* Yellow badge */
.badge-info     /* Blue badge */

/* Alerts */
.alert          /* Alert base style */
.alert-success  /* Success alert */
.alert-error    /* Error alert */
.alert-warning  /* Warning alert */
.alert-info     /* Info alert */
```

### Color Scheme

- **Primary**: Blue (#3B82F6)
- **Secondary**: Green (#10B981)
- **Danger**: Red (#EF4444)
- **Warning**: Amber (#F59E0B)
- **Dark**: Gray-900 (#1F2937)
- **Light**: Gray-100 (#F3F4F6)

---

## Demo Credentials

For testing the application, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | password123 |
| HR | hr@company.com | password123 |
| Manager | manager@company.com | password123 |
| Employee | emp1@company.com | password123 |

---

## Troubleshooting

### Issue: "Cannot GET /api/..."

**Solution**: Ensure backend is running on `http://localhost:5000`
```bash
cd backend
npm run dev
```

### Issue: Token not persisting

**Solution**: Clear browser localStorage and login again
```javascript
localStorage.clear();
// Then refresh page and login
```

### Issue: CORS errors

**Solution**: Check backend CORS configuration in `server.js`
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue: "Failed to load modules"

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use

**Solution**: Kill the process or use different port
```bash
# Use different port
npm run dev -- --port 5174
```

### Issue: Styles not loading

**Solution**: Clear Tailwind CSS cache
```bash
rm -rf node_modules/.cache
npm run dev
```

---

## Best Practices

### 1. Authentication
- Always check `isAuthenticated` before rendering protected content
- Use `ProtectedRoute` wrapper for route protection
- Tokens auto-expire after 8 hours

### 2. Error Handling
- Wrap API calls in try-catch
- Display user-friendly error messages
- Log errors to console for debugging

### 3. Performance
- Use React.memo for component optimization
- Implement lazy loading for large lists
- Minimize re-renders with useCallback

### 4. Code Organization
- Keep components small and focused
- Use custom hooks for shared logic
- Separate API logic from UI logic

### 5. Security
- Never store sensitive data in localStorage
- Always validate user input
- Use HTTPS in production
- Implement CSRF protection

---

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages
Update `vite.config.js` with base URL and deploy using `gh-pages`.

---

## Support

For issues, bug reports, or feature requests:
1. Check the troubleshooting section
2. Review console errors (F12)
3. Check network requests in DevTools
4. Create an issue with error details

---

## License

MIT License - Open source project

---

**Last Updated**: January 2024
**Version**: 1.0.0
