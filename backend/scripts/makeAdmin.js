require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function makeAdmin() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log("❌ Please provide an email.");
      console.log("Example: node scripts/makeAdmin.js admin@example.com");
      process.exit(1);
    }

    if (!process.env.MONGO_URI) {
      console.log("❌ MONGO_URI is missing in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }

    user.role = "admin";
    await user.save();

    console.log(`✅ ${user.email} is now an admin`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

makeAdmin();