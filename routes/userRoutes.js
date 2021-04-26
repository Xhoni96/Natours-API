const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();
router.post("/signup", authController.signup);
// the signup doesn't really fit the REST Architecture like the routes below.👇

router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.patch("/updateMyPassword", authController.protectData, authController.updatePassword);
router.patch("/updateMe", authController.protectData, userController.updateMe);
router.delete("/deleteUser", authController.protectData, userController.deleteUser);

router.route("/").get(userController.getAllUsers).post(userController.createUser);
router.route("/:id").get(userController.getUser).patch(userController.updateUser);
//   .delete(authController.protectData, userController.deleteUser);

module.exports = router;
