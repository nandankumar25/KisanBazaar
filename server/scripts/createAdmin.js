const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const bootstrapAdmin = async () => {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@kisanbazaar.com').toLowerCase().trim();
  const password = args[1] || process.env.ADMIN_PASSWORD || 'Admin@KisanBazaar2026';
  const name = args[2] || process.env.ADMIN_NAME || 'KisanBazaar Administrator';

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar';

  try {
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    let admin = await User.findOne({ email });

    if (admin) {
      console.log(`User ${email} already exists. Updating role to ADMIN...`);
      admin.role = 'ADMIN';
      admin.isEmailVerified = true;
      admin.password = password; // pre-save hook will hash with bcrypt
      await admin.save();
      console.log(`✓ Admin user ${email} successfully updated.`);
    } else {
      console.log(`Creating new ADMIN user: ${email}...`);
      admin = await User.create({
        name,
        email,
        password, // pre-save hook will hash with bcrypt
        role: 'ADMIN',
        isEmailVerified: true,
        phone: '+91 99999 00000',
        location: {
          state: 'Punjab',
          district: 'Ludhiana',
          city: 'Ludhiana Central',
          village: 'HQ',
        },
      });
      console.log(`✓ Admin user created successfully with ID: ${admin._id}`);
    }

    console.log(`Admin Email: ${email}`);
    console.log(`Admin Role:  ${admin.role}`);
    console.log(`Email Verified: ${admin.isEmailVerified}`);
    console.log('\nUse this account to access the KisanBazaar Admin Portal.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

bootstrapAdmin();
