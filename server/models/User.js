const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userPoints: { type: Number, default: 0 },

    test: [
      {
        score: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
        timeTaken: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
        answered: [
          {
            questionid: { type: Number, required: true },
            questionText: { type: String, required: true },
            userAnswer: { type: String, required: true },
            correctAnswer: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
          },
        ],
        improvements: {
          type: [String],
          default: [],
        },
      },
    ],

    fullName: { type: String },
    profilePicture: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    department: { type: String },
    isVerified: { type: Boolean, default: true },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// הצפנת סיסמה
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// השוואת סיסמה
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// יצירת טוקן לאיפוס סיסמה
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
