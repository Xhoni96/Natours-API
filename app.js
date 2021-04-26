const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
// 1) GLOBAL MIDDLEWARES
app.use(helmet()); // Security HTTP headers..   returns a function

// Morgan eshte middleware function qe e pedorim per development.Na jep info rreth req qe vjen.
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// Limit requests from the same API
const limiter = rateLimit({
  max: 100,
  widnowMs: 60 * 60 * 1000,
  message: "To many requests from this IP, try again in an hour",
});
app.use("/api", limiter);

// Middleware function needed to read data from body since express doesn't supports it out of the box. exp req.body
// qendron ne mes te req dhe response.
app.use(express.json({ limit: "10kb" })); // limiting the body amount of request

// After express.json is a good place to sanitaze data since here expres.json reads the data from the body

// Data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    // whitelist fields which we can use twice to filter in our api
    whitelist: ["duration", "ratingsQuantity", "ratingsAverage", "maxGroupSize", "difficulty", "price"],
  })
);

// kur e aksesojme skemi nevoje te percakojme folderin public ne url sepse kjo behet si root url direkt
app.use(express.static(`${__dirname}/public`));

// create our own midleware function 👇
app.use((req, res, next) => {
  // krijojme propertyn tone ne middleware per te pare kohen e req, ne rast se psh do duhet tia dergojme klientit
  req.requestTime = new Date().toISOString();
  next();
});
// We load the file that we sent to client in the top level code so we don't block the event loop, because top level code is the code
//that is loaded once at the beggining at the page

// we call this function route handler
// app.get("/api/v1/tours", getAllTours);
// route handler for url . For unique tour
// app.get("/api/v1/tours/:id", getTour);

// app.post("/api/v1/tours", createTour);

// app.patch("/api/v1/tours/:id", updateTour);

// app.delete("/api/v1/tours/:id", deleteTour);
// 4) ROUTES
// mounting the router

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
/* the middleware function below gets called only if the specified url was not corect, so wasn't handled from the routes above. we use the .all because we want
to handle every request that comes. And as the url we use '*' which means all the url that weren't handled before from the other handler functions. Noth this gets called
becase remember, the midleware stack works in the order that you specify in the code. so since this is the last middleware function and it catches a url that wasn't 
handled before it means that it's not the correct url */
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

// 👇 below is the global error handling middleware. By specifying 4 parameters express knows that this is an error handling middleware and it will be called only when there is an error
app.use(globalErrorHandler);

module.exports = app;
