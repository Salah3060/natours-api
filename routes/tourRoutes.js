const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
//read tours

// handlers

const router = express.Router();

// no authentication
router.get('/', tourController.getAllTours);
router.get(
  '/top-5-tours',
  tourController.getCheapest5,
  tourController.getAllTours,
);
router.route('/tour-stats').get(tourController.getTourStats);

/// only for authentication
router.use(authController.protect);

router.use('/:tourId/reviews', reviewRouter);

router.get(
  '/distance/:distance/centre/:latlng/unit/:unit',
  tourController.getTourWithIn,
);
router.get('/distances/:latlng/unit/:unit', tourController.getDistances);

router.get(
  '/tour-monthly/:year',
  authController.restrictTo('admin'),
  tourController.getTourMonths,
);

router.post(
  '/',
  authController.restrictTo('admin', 'lead-guide'),
  tourController.createTour,
);

router
  .route('/:id')
  .get(tourController.getTour)
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  )
  .patch(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  );

module.exports = router;
