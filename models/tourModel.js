const mongoose = require('mongoose');
const slugify = require('slugify');
const { type } = require('../node_modules/express/lib/response');
// const User = require('./userModel');

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name '],
      unique: true,
      minLength: 10,
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: Number,
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Invalid difficulty , The Valid difficulities : easy , medium , difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      set: (val) => Math.round(val * 10) / 10,
    },
    sercet: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      description: String,
      coordinates: [Number],
      address: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        description: String,
        coordinates: [Number],
        day: Number,
      },
    ],
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    description: { type: String, trim: true },
    summary: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image'],
    },
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], /// child refernce
    images: [String],
    startDates: [Date],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeek').get(function () {
  return (this.durationWeek = this.duration / 7);
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOC MIDDLEWARW
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name);
  next();
});

// QUERY MIDDLE WARE
tourSchema.pre(/^find/, function (next) {
  this.find({ sercet: { $ne: true } });

  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});

//AGGREGATION MIDDLEWARW
tourSchema.pre('aggregate', function (next) {
  // this.pipeline().unshift({ $match: { sercet: { $ne: true } } });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
