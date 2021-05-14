const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
// updates current user data
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("You can't update your password here. Use anothor route", 400));
  const { name, email } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    {
      new: true, // returns the updated object
      runValidators: true,
    }
  );

  res.status(200).json({ status: "success", data: updatedUser });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).end();
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// these last 2 functions are only for Administrators👇
exports.updateUser = factory.updateOne(User); // here we don't change password but only other data

exports.deleteUser = factory.deleteOne(User);
