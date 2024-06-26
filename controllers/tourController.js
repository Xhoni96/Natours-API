const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// middleware function not needed anymore beacuse mongo will give as a warning if we put an invalidId.Just an example on how to use a middleware function
// exports.checkId = (req, res, next, val) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: "fail",
//       message: "Invalid ID",
//     });
//   }
//   next();
// };

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, "reviews");
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  /* the aggregation pipeline is a bit like a regular query ,but in aggregations we can manipulate the data in couple of diffrent steps.
    we pas an array of so called stages, and the document pass through these stages one by one step by step in the defined sequence .
    NOTE : The aggregation pipeline belongs to mongoDB not mongoose. but we have access through mongoose
    $match  aggregation operator is mostly used to match documents, basically to select documents */
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        numRatings: { $sum: "ratingsQuantity" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  /* Unwind aggregation operator is very powerful and it will solve us a real bussines problem. In this case let's say the company wants to know 
    whic month of a specifik year is the busiest. The unwind deconstruct nje arryay qe ti i jep dhe krijon nga nje document per secilin element te arrayt.
    pra ne kte moment ne kemi 9 plane ajo do te gjeneroje 27 sepse array jone i statDates ka 3 data brenda*/

  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        // id na duhet muaji qe ti grupojme po duke qene se muajin se kemi e kemi date te plote atehere do perdorim nje mongodb aggregation pipeline operator qe extracts the month from the date
        _id: { $month: "$startDates" },
        numToursStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      // project makes the id dissapear in the client response
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numToursStarts: -1 },
    },
    {
      // not useful in this case, but just for reference
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "success",
    results: plan.length,
    data: {
      plan,
    },
  });
});

// tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  if (!latlng) return next(new AppError("Please provide latitude and longitude in the format: lat,lng", 400));

  const [lat, lng] = latlng.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  // needs the index defined at the model for the field startLocation down below
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  if (!latlng) return next(new AppError("Please provide latitude and longitude in the format: lat,lng", 400));

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  const [lat, lng] = latlng.split(",");

  const distances = await Tour.aggregate([
    // geoNear is the only aggregation pipeline stage for geospatial aggregation and it always needs to be first
    // also it requires at least one of our fields to have a geospatial index , but we have that defined already
    // if you have multiple fields indexed with geospatial we have to use the key operator to define which field to use for calculation
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [+lng, +lat],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier, // convert it to cilometers or miles
      },
    },
    {
      $project: {
        // get only these fields
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: distances.length,
    data: { data: distances },
  });
});
