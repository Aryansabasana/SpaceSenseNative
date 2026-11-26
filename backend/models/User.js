/**
 * User Model
 * Stores user credentials (hashed) and interior design preferences.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    preferredStyle: {
      type: String,
      enum: ['Minimalist', 'Modern', 'Scandinavian', 'Industrial', 'Cozy', 'Workspace'],
      default: 'Modern',
    },
    measurementUnit: {
      type: String,
      enum: ['meters', 'feet'],
      default: 'meters',
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    resetCodeHash: {
      type: String,
      select: false,
    },
    resetCodeExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving only when it was created or changed
userSchema.pre('save', async function hashPasswordIfModified(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Compare a plain-text password attempt against the stored bcrypt hash
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user fields without sensitive hashes
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profileImage: this.profileImage,
    preferredStyle: this.preferredStyle,
    measurementUnit: this.measurementUnit,
    profileCompleted: this.profileCompleted,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
