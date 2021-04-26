const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

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

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour, req.query).filter().sort().limitFields().paginate();
  const tours = await features.query;

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
    // next nese therritet me parameter brenda express e quan automatikisht si error dhe therret our error handling global middlerare, te cilit i kalojme err tone
  }
  // Tour.findOne({_id: req.params.id}) same as 👆👆
  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });

  // Always need to send something back in order to complete the "request/response cycle"
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true, // kjo ben qe validatoret te behen run perseri ketu, pa kete mongo i pranon updatet pa marre parasysh validatoret qe kemi vendos tek schema
  });

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
    // next nese therritet me parameter brenda express e quan automatikisht si error dhe therret our error handling global middlerare, te cilit i kalojme err tone
  }
  res.status(201).json({
    status: "success",
    data: {
      updatedTour: tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // In Rest API it's common in delete requests to not send any body back to the client
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
    // next nese therritet me parameter brenda express e quan automatikisht si error dhe therret our error handling global middlerare, te cilit i kalojme err tone
  }

  res.status(204).end();
});

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
