const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true, // only in https
    httpOnly: true, // cant be accessed by the browser, modified or even deleted
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  // creating the token that user stores in it's browser
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and passw exists
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // 2) check if user exists && passw is correct
  const user = await User.findOne({ email }).select("+password"); // use select since we dont show the passw to te user in userModel

  // 3) if everythingok, send token to client
  if (!user || !(await user.comparePassword(password, user.password)))
    return next(new AppError("Incorrect email or pasword", 401));
  createSendToken(user, 200, res);
});

// 👇 it's called  in order to protect data from unauthorized users by checking if they're logged in
exports.protectData = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it's there
  let token;
  // auth header is only for api testing
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in! Please log in to get access.", 401));
  }
  //2) Verify token if someone altered the payload
  // use promisify to return a promise so we can use await and keep the same style with promises as in other functions
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user trying to access the route still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError("The user belonging to the token does no longer exist", 401));

  // 4) Check if user changed password after the token was issued

  if (currentUser.isPasswordChanged(decoded.iat))
    return next(new AppError("User recently changed password! Please log in again", 401));

  req.user = currentUser;

  // 👇 GRANT acces to protected route
  next();
});

// eslint-disable-next-line arrow-body-style
exports.allowDataOnlyTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError("You do not have permission to perform this action", 403));
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  if (!req.body.email) return next(new AppError("You must provide an email address", 404));

  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("There is no user with that email address", 404));

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  // we need to save the user beacuse with createPasswordResetToken function above we only modify the user document but it doesn't get saved also disable validation in this case
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user email
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Click the link below to enter a new password for your email address. 👇👇 \n ${resetURL}.\n If you didn't forgot your password, simply ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is valid for 10 min",
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("There was an error sending the email. Try again later!", 500));
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  // 2) If token has not expired, and there is user, do the things you need to do 😄

  if (!user) return next(new AppError("Token is invalid or has expired", 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // we don't turn off validators here beacuse we want them to validate ,for exmp if passw is == to passwordConfirm

  // 3) Log in the user , send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from FeatureCollection

  const user = await User.findById(req.user.id).select("+password"); // at this point the user is logged in so we have id from protectData function

  // 2) Check if posted current password is correct

  if (
    !(await user.comparePassword(req.body.passwordCurrent, user.password)) ||
    (await user.comparePassword(req.body.password, user.password))
  )
    return next(new AppError("Current password is not correct or new password is the same as old password"));

  // 3) If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save(); // don't turn the validators of this time since we want to validate for pasword
  // Nuk perdorim findByIdAndUpdate sepse validatori qe kemi ne schema per passw nuk do funksionoje
  // gjithashtu  pre save middleware qe bejne encriptimin e passw sdo funksionojne gjithashtu sepse jane ne save
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
