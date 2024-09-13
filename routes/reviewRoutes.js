const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.get('/', reviewController.getAllReviews);

router.use(authController.protect);
//authentication
router.post(
  '/',
  authController.restrictTo('user'),
  reviewController.setTourUserIds,
  reviewController.createReview,
);

router
  .route('/:id')
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview,
  )
  .get(authController.restrictTo('admin', 'user'), reviewController.getReview);

module.exports = router;
