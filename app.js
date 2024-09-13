const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitinze = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require(`${__dirname}/helpers/AppError`);
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require(`${__dirname}/routes/userRoutes`);
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const reviewRouter = require('./routes/reviewRoutes');
const app = express(); // here we create the server ...

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//  GLOBAL MIDDLEWARES

//  1==>  ################SECURITY MIDDLEWARW################3

/// best practice to put the first middle ware
// to more secure headers
app.use(helmet());

//sanitization the No sql query injection
app.use(mongoSanitinze());

//sanitization agianst xss
app.use(xss());

//prevent agianst parameters Pollution
app.use(
  hpp({
    whitelist: [
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
      'duration',
      'price',
    ],
  }),
);
// limit requets from one user for more security
const limit = rateLimit({
  max: 100,
  windowMs: 1 * 60 * 60 * 100,
  message: 'more than available requests from this IP , try agian in an hour',
});

//          ##########################################################
app.use('/api', limit);

app.use(express.json({ limit: '10kb' })); //  BUILT IN MIDDLEWARE WHICH ADD THE BODY TO THE REQ

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

//ERROR HANDLER

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!!!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
