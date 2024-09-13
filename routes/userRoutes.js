const express = require('express');
const userController = require('../controllers/userControllers');
const authController = require('../controllers/authController');
//read tours

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.patch('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// need authentication
router.use(authController.protect);
router.patch('/updatePassword', authController.updatePassword);
router.get('/getMe', authController.getMe, userController.getUser);
router.patch('/updateMe', authController.updateMe);
router.delete('/deleteMe', authController.deleteMe);

router.get(
  '/',
  authController.restrictTo('admin', 'lead-guide'),
  userController.getAllUsers,
);

router.patch(
  '/:id',
  authController.restrictTo('admin'),
  userController.updateUser,
);

router.delete(
  '/:id',
  authController.restrictTo('admin'),
  userController.deleteUser,
);

module.exports = router;
