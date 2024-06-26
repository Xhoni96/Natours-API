const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../../models/tourModel");
const Review = require("../../models/reviewModel");
const User = require("../../models/userModel");

dotenv.config({ path: "./config.env" });
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB, {
    // these are standard methods
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"));

// READ FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // await Tour.create(tours);
    // await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });
    console.log("Data successfuly loaded 😃😃");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
// DELETE DATA FROM DB
const deleteData = async () => {
  try {
    // await Tour.deleteMany();
    // await Review.deleteMany();
    await User.deleteMany();
    console.log("Data successfuly deleted 😃😃");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
console.log("Proceset", process.argv);

// we run this in the terminal dhe kthen array. e kapim me process.arv kte array dhe kapim nese i kemi dhene --import apo --delete ne terminal
// node dev-data/data/import-dev-data.js --import
