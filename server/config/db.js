const mongoose = require("mongoose");

// חיבור למסד הנתונים MongoDB
// connectDB פונקציה לחיבור למסד הנתונים

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB connection error: ${error.message}`);
    console.warn('Continuing without MongoDB connection (development mode). Some features may be unavailable.');
    // In development we don't exit so routes that don't require DB (like /api/questions) still work
  }
};

module.exports = connectDB;
