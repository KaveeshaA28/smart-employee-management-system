# 🏢 Smart Employee Management System - Complete Project

A full-stack, production-ready Employee Management System built with modern web technologies.

## 📋 Project Overview

This is a comprehensive solution for managing employees, attendance, leaves, payroll, tasks, and performance in organizations. It includes role-based access control, real-time notifications, PDF generation, and advanced analytics.

**Live Features:**
- ✅ User authentication & authorization (JWT)
- ✅ Employee CRUD operations
- ✅ Attendance tracking & reporting
- ✅ Leave management with approval workflow
- ✅ Payroll generation & payslip download
- ✅ Task assignment & tracking
- ✅ Performance analytics with charts
- ✅ Report generation & export
- ✅ Email notifications (Nodemailer)
- ✅ Responsive UI design
- ✅ Mobile-friendly interface

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
```
React 18.2          → UI Library
Vite 5.0            → Fast build tool
Tailwind CSS 3.3    → Styling
Chart.js 4.4        → Data visualization
Axios 1.6           → HTTP client
React Router DOM    → Navigation
```

#### Backend
```
Node.js + Express   → Server & API
MongoDB + Mongoose  → Database
JWT                 → Authentication
bcryptjs            → Password hashing
Multer              → File uploads
PDFKit              → PDF generation
Nodemailer          → Email service
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Pages: Dashboard, Employees, Attendance, Leave, etc.        │ │
│  │ Components: Navbar, Sidebar, Tables, Charts, Forms          │ │
│  │ Auth: JWT Token, Role-based Access Control                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS (Axios)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Controllers: Handle business logic                          │ │
│  │ Routes: API endpoints with auth/role middleware             │ │
│  │ Models: Employee, Attendance, Leave, Task, etc.             │ │
│  │ Services: Email, PDF, Session tracking                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Mongoose ODM
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                  DATABASE (MongoDB)                              │
│  Collections: employees, attendance, leaves, tasks, etc.        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
employee-management-system/
│
├── backend/                          # Node.js Backend
│   ├── controllers/                  # Business logic
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── payrollController.js
│   │   ├── taskController.js
│   │   ├── performanceController.js
│   │   ├── reportController.js
│   │   └── notificationController.js
│   │
│   ├── models/                       # Database schemas
│   │   ├── Employee.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   ├── Payroll.js
│   │   ├── Performance.js
│   │   └── Task.js
│   │
│   ├── routes/                       # API routes
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── payrollRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── performanceRoutes.js
│   │   ├── reportRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── middleware/                   # Custom middleware
│   │   ├── authMiddleware.js         # JWT verification
│   │   ├── roleMiddleware.js         # Role-based access
│   │   └── uploadMiddleware.js       # File upload handling
│   │
│   ├── services/                     # Business services
│   │   ├── emailService.js           # Nodemailer service
│   │   ├── pdfService.js             # PDFKit service
│   │   └── ...
│   │
│   ├── utils/                        # Utility functions
│   │   ├── generateEmployeeId.js
│   │   └── sessionTracker.js
│   │
│   ├── uploads/                      # Uploaded files
│   │   ├── avatars/
│   │   ├── documents/
│   │   ├── leave-docs/
│   │   ├── pdfs/
│   │   └── task-attachments/
│   │
│   ├── server.js                     # Main server file
│   ├── .env                          # Environment variables
│   ├── package.json
│   ├── seed.js                       # Initial data seed
│   └── README.md
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Leave.jsx
│   │   │   ├── Payroll.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Notifications.jsx
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   │
│   │   ├── context/                  # React Context
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── services/                 # API services
│   │   │   ├── apiClient.js
│   │   │   └── authService.js
│   │   │
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Global styles
│   │
│   ├── public/                       # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── SETUP_GUIDE.md
│   └── README.md
│
├── QUICK_START.md                    # Quick start guide
└── README.md                          # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- npm or yarn
- MongoDB (local or Atlas)

### Installation

**1. Clone or Extract Project**
```bash
# Navigate to project directory
cd employee-management-system
```

**2. Setup Backend**
```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ems
JWT_SECRET=your_secret_key_here
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_specific_password
EOF

# Start backend
npm run dev
```

**3. Setup Frontend**
```bash
cd ../frontend
npm install

# Create .env.local
cp .env.example .env.local

# Start frontend
npm run dev
```

**4. Open Browser**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 🔐 Authentication & Roles

### User Roles
1. **Admin**
   - Full system access
   - Can manage all employees
   - Can approve/reject leaves
   - Can generate reports
   - Can manage payroll

2. **HR**
   - Manage employees
   - Handle leave requests
   - Generate payroll
   - Generate reports
   - View all attendance

3. **Manager**
   - Assign tasks
   - Review performance
   - View team attendance
   - Submit reviews

4. **Employee**
   - View personal data
   - Apply for leave
   - View own tasks
   - Check performance
   - Download payslips

### Demo Credentials

```
Admin:       admin@company.com    /  password123
HR:          hr@company.com       /  password123
Manager:     manager@company.com  /  password123
Employee:    emp1@company.com     /  password123
```

---

## 📊 Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Secure password hashing (bcryptjs)
- Role-based access control
- Automatic session tracking
- Token expiry (8 hours)
- Auto-logout on expiry

### 2. Employee Management
- Complete CRUD operations
- Employee ID auto-generation
- Document upload (Multer)
- Search and filter
- Bulk operations

### 3. Attendance System
- Daily attendance marking
- Automatic login/logout tracking
- Late tracking
- Attendance reports
- Historical data

### 4. Leave Management
- Multiple leave types (Sick, Casual, Earned, etc.)
- Document upload for leaves
- HR approval workflow
- Leave balance tracking
- Leave history

### 5. Payroll System
- Automatic payroll calculation
- Formula: Net = (Basic + Allowances) - (Deductions + Tax + Loans)
- Payslip generation (PDF)
- Monthly payroll records
- Tax calculation

### 6. Task Management
- Task creation and assignment
- Status workflow (To Do → In Progress → Review → Completed)
- Priority levels
- Due date tracking
- Task comments

### 7. Performance Management
- Performance scoring
- Formula: Overall = (Attendance + Tasks + Quality) / 3
- Manager feedback
- Performance charts
- Historical tracking

### 8. Reports & Analytics
- Attendance reports (PDF)
- Payroll reports (PDF)
- Leave reports (PDF)
- Performance reports
- Data export

### 9. Notifications
- Email notifications (Nodemailer)
- In-app notifications
- Leave approval alerts
- Task assignments
- System notifications

### 10. Dashboard & UI
- Admin dashboard
- HR dashboard
- Manager dashboard
- Employee dashboard
- Responsive design
- Mobile-friendly
- Real-time statistics

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register user
POST   /api/auth/login             - Login user
```

### Employees
```
GET    /api/employees              - Get all employees
GET    /api/employees/:id          - Get single employee
POST   /api/employees              - Create employee
PUT    /api/employees/:id          - Update employee
DELETE /api/employees/:id          - Delete employee
GET    /api/employees/count        - Count employees
```

### Attendance
```
GET    /api/attendance             - Get attendance records
POST   /api/attendance/mark        - Mark attendance
GET    /api/attendance/today-count - Today's count
GET    /api/attendance/my-recent   - My recent records
```

### Leave
```
POST   /api/leave/apply            - Apply for leave
GET    /api/leave                  - Get all leaves
PUT    /api/leave/:id/approve      - Approve leave
PUT    /api/leave/:id/reject       - Reject leave
GET    /api/leave/pending-count    - Pending count
```

### Payroll
```
GET    /api/payroll                - Get payroll records
GET    /api/payroll/:id/pdf        - Download payslip
POST   /api/payroll/generate       - Generate payroll
```

### Tasks
```
GET    /api/tasks                  - Get all tasks
POST   /api/tasks                  - Create task
PUT    /api/tasks/:id              - Update task
DELETE /api/tasks/:id              - Delete task
GET    /api/tasks/pending-count    - Pending count
GET    /api/tasks/my-pending       - My pending tasks
```

### Performance
```
GET    /api/performance            - Get performance records
GET    /api/performance/:id        - Get employee performance
POST   /api/performance            - Create performance record
```

### Reports
```
GET    /api/reports/attendance     - Attendance report
GET    /api/reports/payroll        - Payroll report
GET    /api/reports/leave          - Leave report
GET    /api/reports/performance    - Performance report
```

### Notifications
```
GET    /api/notifications          - Get notifications
DELETE /api/notifications/:id      - Delete notification
```

---

## 🛠️ Development

### Running in Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# http://localhost:5173
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
```

**Frontend:**
```bash
cd frontend
npm run build
# Creates dist/ folder
```

### Environment Variables

**Backend (.env)**
```
MONGODB_URI=your_mongodb_url
JWT_SECRET=your_secret
PORT=5000
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing

### Test Credentials
Use the demo credentials to test different roles and features:

| Feature | How to Test |
|---------|------------|
| Employee Management | Login as Admin/HR, go to Employees |
| Attendance | Mark attendance in Attendance page |
| Leave Request | Apply leave, approve as HR |
| Payroll | View payroll, download payslip as HR |
| Tasks | Create task, assign to employee |
| Performance | View performance metrics |
| Reports | Generate and download reports as HR |

---

## 🚀 Deployment

### Frontend Deployment

**Vercel:**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

**GitHub Pages:**
Update `vite.config.js` base and deploy using gh-pages.

### Backend Deployment

**Heroku:**
```bash
heroku create your-app-name
git push heroku main
```

**Railway:**
Connect GitHub repo and deploy automatically.

**AWS/EC2:**
```bash
npm install
npm run build
node server.js
```

---

## 📚 Documentation

- **Quick Start:** See [QUICK_START.md](./QUICK_START.md)
- **Frontend Setup:** See [frontend/SETUP_GUIDE.md](./frontend/SETUP_GUIDE.md)
- **Frontend README:** See [frontend/README.md](./frontend/README.md)
- **Backend README:** See [backend/README.md](./backend/README.md)

---

## 🐛 Troubleshooting

### Backend Issues
- **MongoDB Connection Failed**: Check MONGODB_URI in .env
- **Port 5000 in Use**: Change PORT in .env
- **CORS Errors**: Check backend CORS configuration

### Frontend Issues
- **API Not Connecting**: Ensure backend is running
- **Port 5173 in Use**: Use `npm run dev -- --port 5174`
- **Styles Not Loading**: Clear cache and reinstall

### Common Solutions
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear browser cache/localStorage
localStorage.clear()

# Kill processes on ports
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

---

## 📈 Metrics & Dashboards

### Admin Dashboard
- Total Employees
- Present Today
- Pending Leaves
- Pending Tasks

### HR Dashboard
- Employee Count
- Attendance Overview
- Payroll Summary
- Leave Statistics

### Employee Dashboard
- My Tasks
- My Attendance
- Leave Balance
- Performance Score

---

## 🔒 Security Features

- ✅ JWT Token Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ Role-Based Access Control
- ✅ Request Validation
- ✅ CORS Protection
- ✅ Input Sanitization
- ✅ Rate Limiting (to be added)
- ✅ HTTPS Ready

---

## 🎯 Future Enhancements

- [ ] Real-time notifications (Socket.io)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Biometric attendance
- [ ] Video conferencing integration
- [ ] Expense management
- [ ] Time tracking
- [ ] Inventory management
- [ ] Email integration
- [ ] API rate limiting
- [ ] Two-factor authentication
- [ ] Audit logs

---

## 📝 License

MIT License - Open Source Project

---

## 💬 Support

For questions, issues, or suggestions:
1. Check documentation files
2. Review code comments
3. Check error messages in console
4. Ensure backend is running
5. Verify MongoDB connection

---

## 👥 Contributors

Built with modern web technologies for enterprise-level employee management.

---

## 🎉 Getting Help

**Quick Help:**
- Backend won't start? → Check MongoDB connection
- Frontend won't connect? → Is backend running on port 5000?
- Can't login? → Use demo credentials
- Styles broken? → Clear browser cache

**Documentation:**
- Frontend: [frontend/README.md](./frontend/README.md)
- Backend: [backend/README.md](./backend/README.md)
- Setup: [frontend/SETUP_GUIDE.md](./frontend/SETUP_GUIDE.md)
- Quick Start: [QUICK_START.md](./QUICK_START.md)

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready ✅

🎊 **Happy Coding!** 🎊
