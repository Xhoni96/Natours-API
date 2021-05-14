const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });
// ☝ mergeParams allows us to get access to the id param "/:tourId" when the reviewRoutes is called in tourRoutes and redirect it to the router below 👇

// router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours);

router.use(authController.protectData);

router
  .route("/")
  .get(/* authController.protectData, */ reviewController.getAllReviews)
  .post(authController.allowDataOnlyTo("user"), reviewController.setTourUserIds, reviewController.createReview);

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(authController.allowDataOnlyTo("user", "admin"), reviewController.updateReview)
  .delete(authController.allowDataOnlyTo("user", "admin"), reviewController.deleteReview);

module.exports = router;
