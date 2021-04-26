const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use a different value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const message = Object.values(err.errors)
    .map((el) => el.message)
    .join(". ");
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

const sendErrorProduction = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error. We don't want to leak error details here
    res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    /* Ka errore qe sjane operational por qe i krijon mongoose psh kur eshte invalid id. Duam qe ne production ti cojme userit nje mesazh te kuptueshem dhe jo ate default
    te mongoose. Kemi krijuar nje funksion te cilit i kalojme errorin dhe ky fnc do te ktheje nje error te ri te krijuar me klasen tone te errorit e cila do ta shenoje si operational error
    dhe do te dergoje nje mesazh me user friendly */
    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = new AppError("Invalid token. Please log in again!", 401);
    if (err.name === "TokenExpiredError") error = new AppError("Your token has expired. Please log in again!", 401);
    return sendErrorProduction(error, res);
  }
};

// GLOBAL error handling middleware 👆
// By specifying 4 parameters express knows that this is an error handling middleware and it will be called only when there is an error,
// error te cilin e aktivizojme me klasen tone ne utils te erroreve
