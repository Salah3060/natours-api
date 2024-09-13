const mongoose = require('mongoose');
const { type } = require('../node_modules/express/lib/response');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review have an author '],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review belongs to tour'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'you must rate the tour'],
    },
    createdAt: { type: Date, default: Date.now() },
    review: {
      type: String,
      required: [true, 'A review can not be empty'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'tour', select: 'name' });
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

reviewSchema.statics.calcAverageReviews = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRev: { $sum: 1 },
        ratingAvr: { $avg: '$rating' },
      },
    },
  ]);

  /// render data to the tour
  let updated;
  if (stats.length > 0) {
    updated = {
      ratingsAverage: stats[0].ratingAvr,
      ratingsQuantity: stats[0].numRev,
    };
  } else {
    updated = {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    };
  }
  await Tour.findByIdAndUpdate(tourId, updated);
  console.log(stats.length !== 0 ? stats[0].ratingAvr : undefined);
};

reviewSchema.post('save', function () {
  //this point to current doc
  this.constructor.calcAverageReviews(this.tour);
});

// Step 1: Pre hook to store the query parameters (to use later in post hook)

reviewSchema.pre(/^findOneAndDelete/, async function (next) {
  this.r = await this.model.findOne(this.getQuery()); // Retrieve the document to be deleted using getQuery()
  next();
});

// Step 2: Post hook to use the stored document for recalculating average reviews
reviewSchema.post(/^findOneAndDelete/, async function () {
  // Recalculate average reviews based on the tour ID of the deleted review
  if (this.r) {
    await this.r.constructor.calcAverageReviews(this.r.tour);
    console.log(this.r);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
