const User = require('../models/userModel');
const catchAsync = require('../helpers/catchAsync');
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
