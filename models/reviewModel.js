const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
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
    unique: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review must have an author"],
  },
});

reviewSchema.pre("find", function (next) {
  this.populate("tour");
  this.populate("user");
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
