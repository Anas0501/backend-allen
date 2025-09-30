const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    roles: {
      accessContent: {
        type: Boolean,
        default: false
      },
      accessProduct: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Generate unique userId before saving
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      userId: this.userId,
      email: this.email,
      isAdmin: this.isAdmin,
      roles: this.roles
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;