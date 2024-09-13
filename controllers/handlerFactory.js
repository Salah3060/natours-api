const catchAsync = require('../helpers/catchAsync');
const Tour = require('../models/tourModel');
const AppError = require('../helpers/AppError');
const APIFeatures = require('../helpers/APIFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('NO id matched !!', 404));
    }
    res.status(204).json({
      statue: 'success',
      message: 'deleted ',
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.body.password)
      return next(new AppError('you are not allowed to change password'));
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document matches that id !!', 404));
    }
    res.status(200).json({
      statue: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      statue: 'success',
      data: {
        tour: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);

    const doc = await query;
    if (!doc) {
      return next(new AppError('NO id matched !!', 404));
    }
    res.status(200).json({
      statue: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    ///filteration for detected tour (small hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // excuting queries
    const feature = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const all = await feature.query;
    res.status(200).json({
      statue: 'success',
      results: Array.from(all).length,
      data: {
        data: all,
      },
    });
  });
