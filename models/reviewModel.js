const mongoose = require("mongoose");

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
// if we enable this it will poplate user and tour when we get a single tour. we turn it of since it's not really needed to have that much info when we get the reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "name photo" }) /* .populate({ path: "tour", select: "name" }). */;
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
