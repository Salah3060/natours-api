const mongoose = require('mongoose');
const { type } = require('../node_modules/express/lib/response');
const Validator = require('validator');
const bcryptjs = require('bcryptjs');
const bcrypt = require('../node_modules/bcryptjs/dist/bcrypt');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name '],
  },
  email: {
    type: String,
    required: [true, 'Please provide your Email '],
    validate: {
      validator: function (email) {
        return Validator.isEmail(email);
      },
      message: 'Please provide a valid Email',
    },
  },
  photo: String,
  active: {
    type: Boolean,
    default: true,
    select: 0,
  },
  role: {
    type: String,
    enum: ['admin', 'guide', 'lead-guide', 'user'],
    default: 'user',
  },
  passwordChangedAt: Date,
  password: {
    type: String,
    required: [true, 'Please Provide a valid Password '],
    minLength: 8,
    select: 0,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],

    // only work in save-create not in findByIdAndUpdate
    validate: {
      validator: function (cPass) {
        return this.password === cPass;
      },
      message: 'passwords are not the same ',
    },
  },
  passwordResetToken: String,
  passwordResetTokenExpiresIn: Date,
});

// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password') || !this.isNew) return next();
//   this.password = await bcryptjs.hash(this.password, 12);

//   this.passwordConfirm = undefined;
//   next();
// });

userSchema.methods.correct = async (candidatePass, userPass) => {
  const val = await bcrypt.compare(candidatePass, userPass);
  return val;
};

userSchema.methods.changePasswordAfter = function (jwtTimestamp) {
  console.log(this.passwordChangedAt);
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // Convert to seconds

    // If the password was changed after the JWT was issued, return true
    return jwtTimestamp < changedAt;
  }

  // Return false if password hasn't been changed after the JWT
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const randomHexString = crypto.randomBytes(32).toString('hex'); // create 32 byte string

  // encrpt it to strore in database
  // remebrer that : any important data store in database with encryption provided any hacking
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(randomHexString)
    .digest('hex');
  this.passwordResetTokenExpiresIn = Date.now() + 10 * 60 * 1000;
  return randomHexString;
};

userSchema.pre('save', function (next) {
  if (this.isModified('password') || this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});
userSchema.post('save', () => {
  console.log('saved succefully ');
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
