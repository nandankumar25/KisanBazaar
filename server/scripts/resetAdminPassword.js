const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');
const { Writable } = require('stream');

// Load server environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

/**
 * Securely prompts the user for masked input without echoing to stdout.
 */
function promptSecure(promptText) {
  return new Promise((resolve) => {
    // If not a TTY (piped or redirected), fall back to standard readline question
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(promptText, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    let isMuted = false;
    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!isMuted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    process.stdout.write(promptText);
    isMuted = true;

    rl.question('', (answer) => {
      isMuted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });
}

const resetAdminPassword = async () => {
  const args = process.argv.slice(2);
  const targetEmail = (args[0] && args[0].includes('@') ? args[0] : process.env.ADMIN_EMAIL || 'admin@kisanbazaar.com')
    .toLowerCase()
    .trim();

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kisanbazaar';

  try {
    console.log('=====================================================');
    console.log(' KisanBazaar Platform Admin Password Reset Tool');
    console.log('=====================================================');
    console.log(`Connecting to database...`);
    await mongoose.connect(mongoUri);

    // 1. Locate existing admin user (DO NOT create a duplicate account)
    const admin = await User.findOne({ email: targetEmail });

    if (!admin) {
      console.error(`\n[ERROR]: No account found with email "${targetEmail}".`);
      console.error('This script will not create a new or duplicate account.');
      console.error('Please verify the email address or run the seed script.');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (admin.role !== 'ADMIN') {
      console.warn(`\n[WARNING]: User "${targetEmail}" currently has role "${admin.role}".`);
      console.warn('This account will be preserved as ADMIN.');
    }

    // 2. Prompt for new password securely
    let newPassword = '';
    // Check if password was provided as CLI argument or environment variable
    if (args[1]) {
      newPassword = args[1].trim();
    } else if (process.env.ADMIN_NEW_PASSWORD) {
      newPassword = process.env.ADMIN_NEW_PASSWORD.trim();
    } else {
      console.log(`\nResetting password for: ${admin.name} (${admin.email})`);
      console.log('Note: Password input will not be displayed on screen for security.\n');

      newPassword = await promptSecure('Enter new password (min 6 characters): ');
      if (!newPassword || newPassword.length < 6) {
        console.error('\n[ERROR]: Password must be at least 6 characters long.');
        await mongoose.disconnect();
        process.exit(1);
      }

      const confirmPassword = await promptSecure('Confirm new password: ');
      if (newPassword !== confirmPassword) {
        console.error('\n[ERROR]: Passwords do not match. Reset cancelled.');
        await mongoose.disconnect();
        process.exit(1);
      }
    }

    if (newPassword.length < 6) {
      console.error('\n[ERROR]: Password must be at least 6 characters long.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // 3. Update existing user's password using application's bcrypt pre-save hook
    admin.password = newPassword;
    admin.role = 'ADMIN';
    admin.isEmailVerified = true;
    await admin.save();

    // 4. Verify that bcrypt hash matches the new password
    const isMatch = await admin.matchPassword(newPassword);
    if (!isMatch) {
      throw new Error('Hash verification failed after saving password.');
    }

    // Clear reference from memory
    newPassword = null;

    console.log('\n=====================================================');
    console.log(' ✓ SUCCESS: Admin Password Reset Complete!');
    console.log('=====================================================');
    console.log(`- Email:           ${admin.email}`);
    console.log(`- Role:            ${admin.role}`);
    console.log(`- Email Verified:  ${admin.isEmailVerified}`);
    console.log(`- Bcrypt Hashing:  ✓ Successfully verified`);
    console.log(`- Duplicate Check: ✓ Existing account updated in place`);
    console.log('=====================================================\n');
    console.log('You can now log in at http://localhost:3000/login with your new password.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n[FATAL ERROR]:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

resetAdminPassword();
