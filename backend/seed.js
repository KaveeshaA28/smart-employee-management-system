/**
 * Database Seeder
 * ============================================================
 * Seeds the database with:
 * 1. Default Admin account
 * 2. Sample HR, Manager, and Employee accounts
 * 3. Sample departments, tasks, etc.
 *
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding...\n');

    // ── 1. Check if admin already exists ──────────────────────
    const existingAdmin = await Employee.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log(`⚠️  Admin already exists: ${existingAdmin.email}`);
      console.log('Seeder will only add missing accounts.\n');
    }

    // ── 2. Seed Users ─────────────────────────────────────────
    const users = [
      {
        firstName: 'System',
        lastName: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@smartems.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'Admin',
        department: 'Management',
        designation: 'System Administrator',
        basicSalary: 0,
        status: 'Active',
      },
      {
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'hr@smartems.com',
        password: 'HR@123456',
        role: 'HR',
        department: 'Human Resources',
        designation: 'HR Manager',
        basicSalary: 5500,
        status: 'Active',
      },
      {
        firstName: 'James',
        lastName: 'Wilson',
        email: 'manager@smartems.com',
        password: 'Manager@123456',
        role: 'Manager',
        department: 'Engineering',
        designation: 'Engineering Manager',
        basicSalary: 7500,
        status: 'Active',
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'employee@smartems.com',
        password: 'Employee@123456',
        role: 'Employee',
        department: 'Engineering',
        designation: 'Software Developer',
        basicSalary: 4500,
        status: 'Active',
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@smartems.com',
        password: 'Employee@123456',
        role: 'Employee',
        department: 'Marketing',
        designation: 'Marketing Specialist',
        basicSalary: 4000,
        status: 'Active',
      },
    ];

    let created = 0;
    for (const userData of users) {
      const exists = await Employee.findOne({ email: userData.email });
      if (!exists) {
        const emp = await Employee.create(userData);
        console.log(`✅ Created: [${emp.role}] ${emp.fullName} (${emp.email}) → ID: ${emp.employeeId}`);
        created++;
      } else {
        console.log(`⏭️  Skipped (exists): ${userData.email}`);
      }
    }

    console.log(`\n✨ Seeding complete! ${created} new account(s) created.`);
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────────────────────');
    console.log('ADMIN   → admin@smartems.com     / Admin@123456');
    console.log('HR      → hr@smartems.com        / HR@123456');
    console.log('MANAGER → manager@smartems.com   / Manager@123456');
    console.log('EMPLOYEE→ employee@smartems.com  / Employee@123456');
    console.log('─────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();
