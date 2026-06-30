# Employee Management System - Frontend

Modern React-based frontend for a comprehensive Employee Management System built with Vite, Tailwind CSS, and Chart.js.

## Features

- ✅ JWT Authentication with role-based access control
- ✅ Responsive dashboard with real-time statistics
- ✅ Employee management (Create, Read, Update, Delete)
- ✅ Attendance tracking and reporting
- ✅ Leave management with approval workflow
- ✅ Payroll management with PDF download
- ✅ Task management with status workflow
- ✅ Performance analytics with charts
- ✅ Report generation (PDF export)
- ✅ Notification system
- ✅ Mobile-responsive design

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Chart.js + react-chartjs-2** - Data visualization
- **Axios** - HTTP client
- **React Router DOM** - Navigation
- **React Icons** - Icon library

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env.local
```

3. **Configure API URL in `.env.local`:**
```
VITE_API_URL=http://localhost:5000/api
```

## Development

### Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
/src
  /pages
    - Login.jsx
    - Register.jsx
    - Dashboard.jsx
    - Employees.jsx
    - Attendance.jsx
    - Leave.jsx
    - Payroll.jsx
    - Tasks.jsx
    - Performance.jsx
    - Reports.jsx
    - Notifications.jsx
  /components
    - LoginForm.jsx
    - RegisterForm.jsx
    - ProtectedRoute.jsx
    - Sidebar.jsx
    - Navbar.jsx
  /context
    - AuthContext.jsx
  /services
    - apiClient.js
    - authService.js
  App.jsx
  main.jsx
  index.css
```

## Pages

### Public Pages
- **Login** - User authentication
- **Register** - User registration

### Protected Pages
- **Dashboard** - Main dashboard with statistics
- **Employees** - Employee CRUD operations (Admin/HR only)
- **Attendance** - Mark and track attendance
- **Leave** - Apply and manage leave requests
- **Payroll** - View payroll records and download payslips (HR only)
- **Tasks** - Create and manage tasks
- **Performance** - View performance analytics
- **Reports** - Generate and export reports (HR only)
- **Notifications** - View system notifications

## Authentication

The app uses JWT-based authentication with the following user roles:
- **Admin** - Full system access
- **HR** - Employee, attendance, leave, payroll, and reports management
- **Manager** - Can assign tasks and review performance
- **Employee** - Can view personal data and apply for leave

### Login Credentials (Demo)

```
Admin: admin@company.com / password123
HR: hr@company.com / password123
Manager: manager@company.com / password123
Employee: emp1@company.com / password123
```

## API Integration

All API calls are made through the centralized `apiClient` which:
- Automatically adds JWT token to headers
- Handles authentication errors
- Redirects to login on unauthorized access

### Example API Calls

```javascript
// Fetch employees
const response = await apiClient.get('/employees');

// Create employee
await apiClient.post('/employees', employeeData);

// Update employee
await apiClient.put(`/employees/${id}`, updatedData);

// Delete employee
await apiClient.delete(`/employees/${id}`);
```

## Styling

The app uses Tailwind CSS with custom utility classes defined in `index.css`:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success` - Button styles
- `.input-field` - Form input styles
- `.card` - Card component style
- `.badge-*` - Badge styles
- `.alert-*` - Alert notification styles

## Components

### ProtectedRoute
Wraps routes that require authentication and optional role checking.

```jsx
<ProtectedRoute requiredRole="Admin">
  <AdminPage />
</ProtectedRoute>
```

### AuthContext
Provides authentication state and methods:
- `user` - Current user object
- `login()` - Login function
- `logout()` - Logout function
- `isAuthenticated` - Auth status
- `hasRole()` - Role checking

## Best Practices

- Use `useAuth()` hook for authentication in components
- Protected routes automatically handle unauthorized access
- API errors are caught and displayed in modals
- Token refresh is handled automatically
- Responsive design works on all screen sizes

## Deployment

### Build
```bash
npm run build
```

### Deploy to Services

#### Vercel
```bash
npm i -g vercel
vercel
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy
```

#### GitHub Pages
Update `package.json` homepage and deploy using `gh-pages` package.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for learning and development.

## Support

For issues and feature requests, please create an issue in the repository.
