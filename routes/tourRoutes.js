const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
// const Tour = require("../models/tourModel");

const router = express.Router();

// param is a middleware function qe therritet vetem kur ne url ka id
// router.param("id", tourController.checkId);

router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router.route("/").get(authController.protectData, tourController.getAllTours).post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(authController.protectData, authController.restrictUser("admin", "lead-guide"), tourController.deleteTour);

module.exports = router;
