const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    phone_number: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    priority: {
        type: Number,
        enum: [0, 1, 2],
        default: 0
    }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
  
    next();
  });
  
  userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
  ) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };

const User = mongoose.model('User', userSchema);

module.exports = User;