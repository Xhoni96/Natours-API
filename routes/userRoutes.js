const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();
router.post("/signup", authController.signup);
// the signup doesn't really fit the REST Architecture like the routes below.👇

router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

/* Now the protectData is a middleware, and middleware runs always in secuence. And since the router is kind of like a mini application 
that means we can use middleware on him too. And since these routes are middleware themselves they run in secuence and that means that after those 4 middleware above
the next middleware in stack is the patch below that we provide which means that after router.use the protectData is available for all middlewares below👇*/
router.use(authController.protectData);

router.patch("/updateMyPassword", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);
router.patch("/updateMe", userController.updateMe);
router.patch("/deleteMe", userController.deleteMe);

router.use(authController.allowDataOnlyTo("admin"));

router.route("/").get(userController.getAllUsers);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);
//   .delete( userController.deleteUser);

module.exports = router;
