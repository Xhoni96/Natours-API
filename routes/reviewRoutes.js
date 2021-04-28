const express = require("express");
const reviewController = require("../controllers/reviewController");
// const authController = require("../controllers/authController");

const router = express.Router();

// router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route("/")
  .get(/* authController.protectData, */ reviewController.getAllReviews)
  .post(reviewController.createReview);

module.exports = router;
