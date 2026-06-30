# Quick Start Guide - Employee Management System

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js v16+ installed
- MongoDB running (local or Atlas)
- Two terminal windows

---

## Terminal 1: Start Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Create .env file with your MongoDB URI
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000

# Start backend server
npm run dev

# Backend running at: http://localhost:5000
```

---

## Terminal 2: Start Frontend

```bash
# In new terminal, navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev

# Frontend running at: http://localhost:5173
```

---

## 🔐 Login Credentials

Use any of these credentials to test:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | password123 |
| HR | hr@company.com | password123 |
| Manager | manager@company.com | password123 |
| Employee | emp1@company.com | password123 |

---

## 📱 Available Features by Role

### Admin Dashboard
- ✅ View all employees
- ✅ Create/Edit/Delete employees
- ✅ View attendance records
- ✅ Manage leave requests
- ✅ Access payroll
- ✅ Generate reports
- ✅ View notifications

### HR Dashboard
- ✅ Manage employees
- ✅ Mark attendance
- ✅ Approve/Reject leaves
- ✅ View payroll records
- ✅ Download payslips
- ✅ Generate reports
- ✅ View notifications

### Manager Dashboard
- ✅ View team attendance
- ✅ Assign tasks
- ✅ Review performance
- ✅ Submit performance reviews

### Employee Dashboard
- ✅ View own attendance
- ✅ Apply for leave
- ✅ View assigned tasks
- ✅ Check performance
- ✅ Download own payslips

---

## 🛠️ Common Commands

### Backend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run seed     # Seed initial data
```

### Frontend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🔗 API Endpoints

All API endpoints require JWT token in header:
```
Authorization: Bearer {token}
```

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/mark` - Mark attendance

### Leave
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave` - Get leave requests
- `PUT /api/leave/:id/approve` - Approve leave
- `PUT /api/leave/:id/reject` - Reject leave

### Payroll
- `GET /api/payroll` - Get payroll records
- `GET /api/payroll/:id/pdf` - Download payslip

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Performance
- `GET /api/performance` - Get performance records

### Reports
- `GET /api/reports/:type` - Generate report

### Notifications
- `GET /api/notifications` - Get notifications
- `DELETE /api/notifications/:id` - Delete notification

---

## 📁 Directory Structure

```
employee-management-system/
├── backend/                 # Node.js + Express backend
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── frontend/                # React + Vite frontend
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   ├── services/
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
```
Check: Is backend running on http://localhost:5000?
Solution: Start backend first, then frontend
```

### Port 5173 already in use
```bash
npm run dev -- --port 5174
```

### Port 5000 already in use
```bash
# Change PORT in backend .env
PORT=5001
npm run dev
```

### Styles not loading
```bash
# Clear cache and reinstall
rm -rf node_modules/.cache
npm run dev
```

### Token expired errors
```
Clear localStorage and login again
localStorage.clear()
```

---

## 🎯 Next Steps

1. ✅ Start backend and frontend
2. ✅ Login with any credentials
3. ✅ Explore dashboard
4. ✅ Test different roles
5. ✅ Review code documentation
6. ✅ Customize as needed

---

## 📚 Documentation

- Backend: See `backend/README.md`
- Frontend: See `frontend/README.md`
- Setup Guide: See `frontend/SETUP_GUIDE.md`

---

## 💡 Tips

- Use browser DevTools (F12) to debug
- Check Console tab for errors
- Use Network tab to monitor API calls
- Try different user roles
- Test all features
- Read code comments

---

## 🚢 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Creates optimized build in dist/
```

### Build Backend
```bash
cd backend
npm run build
# Prepare for production
```

### Deploy
- Frontend: Vercel, Netlify, GitHub Pages
- Backend: Heroku, Railway, AWS, DigitalOcean

---

**Happy Coding! 🎉**

For issues: Check documentation or review console errors.
