const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
const dotenv = require('dotenv');
const fs = require('fs');

// data base field

dotenv.config({ path: '../../config.env' });

const mongoose = require('mongoose');

const db = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(db).then((c) => {
  console.log('hello db');
});

const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));

const importData = async (Model, data, opts) => {
  try {
    await Model.create(data, opts);
    console.log('data imported successfully');
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async (Model) => {
  try {
    await Model.deleteMany();
    console.log('data deleted successfully');
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '---import') {
  if (process.argv[3] === 'tours') importData(Tour, tours);
  if (process.argv[3] === 'users') {
    const opts = {
      validateBeforeSave: false,
    };
    importData(User, users, opts);
  }
  if (process.argv[3] === 'reviews') importData(Review, reviews);
} else if (process.argv[2] === '---delete') {
  if (process.argv[3] === 'tours') deleteData(Tour);
  if (process.argv[3] === 'users') deleteData(User);
  if (process.argv[3] === 'reviews') deleteData(Review);
}
console.log(process.argv);
