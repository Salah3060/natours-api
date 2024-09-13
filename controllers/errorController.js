const AppError = require('../helpers/AppError');
const { handle } = require('../node_modules/express/lib/application');
const sendErrDev = (err, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrPro = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const handleValidationError = (err) => {
  const errMsg = Object.values(err.errors)
    .map((el) => el.message)
    .join(' ');
  return new AppError(errMsg, 404);
};

const handleJwtError = () => {
  return new AppError('Invalid Token , Please Login Again ...', 401);
};

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  }
  // invalid cast id
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name.startsWith('Cast')) {
      error = new AppError(`Invaid ${err.path}`, 404);
    }

    // dulplicate unique
    if (err.code === 11000)
      error = new AppError(
        `Duplicate ${Object.entries(error.keyValue)[0][0]}: ( ${Object.entries(error.keyValue)[0][1]} ) is not valid `,
        404,
      );
    //invlid enum
    if (err.name === 'ValidationError') {
      error = handleValidationError(error);
    }

    if (err.name === 'JsonWebTokenError') error = handleJwtError();
    sendErrPro(error, res);
  }
};
