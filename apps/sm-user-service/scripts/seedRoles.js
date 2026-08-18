const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { RoleModel } = require(path.resolve(__dirname, '../../../packages/shared/models'));

const defaultRoles = [
  {
    roleCode: 'super_admin',
    roleName: 'Super Admin',
    prefix: 'SA',
    basePath: '/super-admin',
    colorTheme: 'error',
    description: 'Universal access across all schools and global settings.',
  },
  {
    roleCode: 'sch_admin',
    roleName: 'School Admin',
    prefix: 'A',
    basePath: '/school-admin',
    colorTheme: 'primary',
    description: 'Administrative access for a specific school.',
  },
  {
    roleCode: 'teacher',
    roleName: 'Teacher',
    prefix: 'T',
    basePath: '/teacher',
    colorTheme: 'warning',
    description: 'Access to classroom management and academic tools.',
  },
  {
    roleCode: 'student',
    roleName: 'Student',
    prefix: 'S',
    basePath: '/student',
    colorTheme: 'success',
    description: 'Access to personal academic records and learning resources.',
  },
  {
    roleCode: 'parent',
    roleName: 'Parent',
    prefix: 'P',
    basePath: '/parent',
    colorTheme: 'info',
    description: 'Access to child progress and school communications.',
  },
  {
    roleCode: 'principal',
    roleName: 'Principal',
    prefix: 'PR',
    basePath: '/principal',
    colorTheme: 'secondary',
    description: 'School principal leadership dashboard and management.',
  },
  {
    roleCode: 'driver',
    roleName: 'Driver',
    prefix: 'D',
    basePath: '/driver',
    colorTheme: 'default',
    description: 'Transport driver route and trip management.',
  },
];

async function seedRoles() {
  try {
    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const role of defaultRoles) {
      const existing = await RoleModel.findOne({ roleCode: role.roleCode });
      if (existing) {
        console.log(`ℹ️ Role '${role.roleCode}' already exists. Updating...`);
        await RoleModel.updateOne({ roleCode: role.roleCode }, role);
      } else {
        console.log(`➕ Creating role '${role.roleCode}'...`);
        await RoleModel.create(role);
      }
    }

    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedRoles();
