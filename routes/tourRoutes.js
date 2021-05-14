const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");

// const Tour = require("../models/tourModel");

const router = express.Router();

// param is a middleware function qe therritet vetem kur ne url ka id
// router.param("id", tourController.checkId);

// 👇 router itself is a middleware so we can use the.use method in here.basically we say:
// if you encounter a route like the one specified below your should use the reviewRouter instead of creating another route.since they do basically the same thing
router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protectData,
    authController.allowDataOnlyTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );
router
  .route("/")
  .get(/* authController.protectData, */ tourController.getAllTours)
  .post(authController.protectData, authController.allowDataOnlyTo("admin", "lead-guide"), tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(authController.protectData, authController.allowDataOnlyTo("admin", "lead-guide"), tourController.updateTour)
  .delete(authController.protectData, authController.allowDataOnlyTo("admin", "lead-guide"), tourController.deleteTour);

module.exports = router;
