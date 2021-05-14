const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // In Rest API it's common in delete requests to not send any body back to the client
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
      // next nese therritet me parameter brenda express e quan automatikisht si error dhe therret our error handling global middlerare, te cilit i kalojme err tone
    }

    res.status(204).end();
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // kjo ben qe validatoret te behen run perseri ketu, pa kete mongo i pranon updatet pa marre parasysh validatoret qe kemi vendos tek schema
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
      // next nese therritet me parameter brenda express e quan automatikisht si error dhe therret our error handling global middlerare, te cilit i kalojme err tone
    }
    res.status(201).json({
      status: "success",
      updatedData: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      createdData: doc,
    });

    // Always need to send something back in order to complete the "request/response cycle"
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
      // next nese therritet me parameter brenda express e quan automatikisht si error dhe therret our error handling global middlerare, te cilit i kalojme err tone
    }
    // Tour.findOne({_id: req.params.id}) same as 👆👆
    res.status(200).json({
      status: "success",
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow nested GET reviews on tour
    // filter serves in case we ask for a specific review belonging to a tour
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); /* .populate("tour user"); */ // another way to populate 2 doc at the same time
    const doc = await features.query.explain();

    res.status(200).json({
      status: "success",
      results: doc.length,
      data: doc,
    });
  });
