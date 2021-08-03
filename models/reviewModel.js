const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    __v: {
      type: Number,
      select: false,
    },
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // parent referencing👇
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must have an author"],
    },
  },
  // show fields that are not stored in the db
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
// we will use indexes in order to have only one review on tour from one specific user
reviewSchema.index({ tour: 1, user: -1 }, { unique: true }); // nese nuk funksionon try it from MongoDB Compass

// if we enable this it will poplate user and tour when we get a single tour. we turn it of since it's not really needed to have that much info when we get the reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name photo" }) /* .populate({ path: "tour", select: "name" }). */;
  next();
});

// STATIC METHOD of mongoose.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this keyword in a static function will reference the model directly
  // aggregate returns a promise
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: { _id: "$tour", nRating: { $sum: 1 }, avgRating: { $avg: "$rating" } },
    },
  ]);
  // console.log(stats, "stats");
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, //defalt
    });
  }
};

reviewSchema.post("save", function () {
  /* in order to call calcAverageRatings() na duhet akses te modeli . por ketu modeli akoma seshte krijuar gjithashtu kte pre hook function nuk mund ta kalojme poshte 
  deklarimit te skemes me poshte sepse njesoj si express dhe ketu middleware functions ekzekutohen ne sequence dhe kjo dmthn qe nese do e kalonim ky middleware fnc 
  nuk do te ishte fare pjese e ketij modeli. keshtu qe perdorim konstruktorin e dokumentit aktual i cili eshte prp modeli nga krijohet instanca qe i bie e njejta gje */
  this.constructor.calcAverageRatings(this.tour);
});

// for findByIdAndUpdate and findByIdAndDelete we only have query middleware not document middleware. and in query middleware we don't have direct access in the document middleware
// so this is a nice workaround for that limitation
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
