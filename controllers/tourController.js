const fs = require('fs');

const Tour = require('./../models/tourModel');
const factory = require('./handlerFactory');

const APIFeatures = require('./../helpers/APIFeatures');
const AppError = require('./../helpers/AppError');
const { dirname } = require('path');

const catchAsync = require('../helpers/catchAsync');

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.createTour = factory.createOne(Tour);

exports.getCheapest5 = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-price';
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: null,
        numTours: { $sum: 1 },
        avrRating: { $avg: '$ratingsAverage' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
        totalPrice: { $sum: '$price' },
      },
    },
    {
      $match: { avrRating: { $gte: 4.3 } },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });

  res.status(400).json({
    statue: 'fail',
    message: err,
  });
});

exports.getTourMonths = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const stats = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numOfTours: { $sum: 1 },
        Tours: { $push: '$name' },
      },
    },
    {
      $addFields: { months: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numOfTours: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });

  res.status(400).json({
    status: 'fail',
    messgae: err,
  });
});

exports.getTourWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  // Split the latitude and longitude
  const [lat, lng] = latlng.split(',');

  // Validate the input
  if (!lat || !lng) {
    return next(
      new AppError('Please provide valid latitude and longitude.', 400),
    );
  }

  // Convert distance to radians based on unit (mi for miles, km for kilometers)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Use the dynamic lat, lng values instead of hardcoded ones
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[+lng, +lat], radius],
      },
    },
  });

  // Return the response with the correct variable name
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
