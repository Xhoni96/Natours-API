const crypto = require("crypto");
const mongoose = require("mongoose");
const isEmail = require("validator/lib/isEmail");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  __v: {
    type: Number,
    select: false,
  },
  name: {
    type: String,
    required: [true, "A user must have a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "A user must have an email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // Works only on CREATE and SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// DOCUMENT MIDDLEWARE i moongoose do te behet run midis marrjes se te dhenave dhe ruajtjes se tyre ne databaze. Perfect time to do smthn like this
// "this" in document middleware points to current document👇
// when we do user.save() for exmp. the validators on our schema are also called again
userSchema.pre("save", async function (next) {
  //run only if passw is modified
  if (!this.isModified("password")) return next();

  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;

  // hash the password with the cost paramter of 12. the bigger the number the more cpu intensive and better the encryption
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});
// 👇 QUERY middleware with regex for every query that starts with find
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

// this instance will be available in all user documents
userSchema.methods.comparePassword = async function (candidatePasword, userPasword) {
  return await bcrypt.compare(candidatePasword, userPasword);
};

userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // parse to integer
    const changedTimestamp = this.passwordChangedAt.getMilliseconds();
    // console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // random token that we are going to send to the user👇
  const resetToken = crypto.randomBytes(32).toString("hex");

  //encrypted token that we're going to save to the database
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  this.passwordResetExpires = Date.now() + 600000;

  return resetToken;

  // we have used crypto built in node package since this doesn't need to have a complex encryption like the password
};

// all documents created by this model👇 are instances of this model.
const User = mongoose.model("User", userSchema);

module.exports = User;
