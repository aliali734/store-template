const mongoose = require("mongoose");

const connectDB = async () => { 
    try { 
        // We prioritize the environment variable (Render)
        const dbURI = process.env.MONGO_URI;

        if (!dbURI) {
            console.error("❌ ERROR: MONGO_URI is not defined in environment variables.");
            process.exit(1);
        }

        const conn = await mongoose.connect(dbURI); 

        console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`); 

        mongoose.connection.on("error", err => { 
            console.error("❌ MongoDB runtime error:", err.message); 
        }); 

    } catch (err) { 
        console.error("❌ MongoDB connection failed:", err.message); 
        process.exit(1); 
    }
};

module.exports = connectDB;
