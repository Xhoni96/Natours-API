const mongoose = require("mongoose");
// const User = require("./userModel");
// const validator = require("validator");

const tourSchema = new mongoose.Schema(
  {
    __v: {
      type: Number,
      select: false,
    },
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must have more or equal then 10 characters"],
      // validate: [validator.isAlpha, "Tour name must only contain characters"], // checks if it contains only strings not other characters 👈 external validator
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy,medium,difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      // this below is a custom validator since mongoose can't provide us with a validator like that
      validate: {
        validator: function (val) {
          // this will works only in current document when it's being created , not in update for exmp.
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below the regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // select:false ben qe useri mos ta marri asnjehere kte fushe ne response
    },
    startDates: [Date],
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      addres: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
// virtual property doesn't exists in database it's a property we create on the fly basically
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-passwordChangedAt",
  });
  next();
});

//DOCUMENT MIDDLEWARE IN MONGOOSE: runs before the .save() and .create() command. but not in .insertMany()
// tourSchema.pre("save", function () {
//   console.log(this);
// });

// 👇 for embedding users in tours
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
