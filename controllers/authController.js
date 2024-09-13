const User = require('../models/userModel');
const catchAsync = require('../helpers/catchAsync');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../helpers/AppError');
const sendMail = require('../helpers/sendMail');
const { send } = require('../node_modules/express/lib/response');
const crypto = require('crypto');
const req = require('../node_modules/express/lib/request');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  const token = createToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    photo: req.body.photo,
    role: req.body.role,
  });
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // check if there is email , password
  if (!email || !password)
    return next(new AppError('Please provide email and password'));

  // check user acc with this email and password

  const candidteUser = await User.findOne({ email }).select('+password');
  if (
    !candidteUser ||
    !(await candidteUser.correct(password, candidteUser.password))
  ) {
    return next(new AppError('Invalid email or password ', 401));
  }
  createSendToken(candidteUser, 200, res);
});
exports.protect = catchAsync(async (req, res, next) => {
  // check token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('protected route , Please login to access'));
  }

  // is valid token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // chaeck that the acc was not deleted after token has been sent
  const curUser = await User.findById(decoded.id);
  if (!curUser) {
    return next(new AppError('acc was deleted ... please login again', 403));
  }
  //check if password is changed
  if (curUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('password has been changed ... please login again', 403),
    );
  }
  req.user = curUser;
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(`role of user : ${req.user.role}`);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you are not allowed to acces this protected route ', 403),
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // get the email and check its valid
  const email = req.body.email;
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new AppError(`This email doesn't exist , Please Try again`, 403),
    );
  }
  /// create the random token

  const passwordResetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // assume that email sent
  // send token to email
  // try {
  //   const URL = `${req.protocol}://${req.get('host')}/api/v1/users/forgetPassword/${passwordResetToken}`;
  //   const message = `to reset your password send patch request to ${URL}`;
  //   console.log('start');
  //   await sendMail({
  //     email,
  //     subject: 'your password reset token (valid only 10 m)',
  //     message,
  //   });
  //   res.status(200).json({
  //     status: 'success',
  //     message: 'Mail has been sent ',
  //   });
  // } catch (err) {
  //   next(new AppError('falied to send Mail , please try again later....', 500));
  // }
  res.status(200).json({
    status: 'success',
    passwordResetToken,
    message: 'sent',
  });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = req.params.token;
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTokenExpiresIn: { $gt: Date.now() },
  });

  // chech that isn't expired

  if (!user) {
    return next(new AppError('Invlaid token ot user  , please try again'));
  }

  ///
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // check password is valid

  const curUser = await User.findById(req.user._id).select('+password');
  if (!(await curUser.correct(req.body.password, curUser.password)))
    return next(
      new AppError("Old password is n't correct ,Plesea try again...", 401),
    );

  ///update and save
  curUser.password = req.body.newPassword;
  curUser.passwordConfirm = req.body.newPasswordConfirm;

  await curUser.save();

  // login user with the new password

  createSendToken(curUser, 200, res);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(
      new AppError(
        'Invalid operation , To change password hit /updatePassword',
      ),
    );
  }
  const { name, email } = req.body;
  const newUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    message: 'Updated Successfully',
    user: newUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
