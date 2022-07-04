require("dotenv").config();
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

// mongoose.connect(process.env.DBCON_AUTH_SEC1, (err) => {
//   if (!err) {
//     console.log("DBCON_AUTH_SEC1 Seccessfull");
//   } else {
//     console.log("DBCON_AUTH_SEC1 Fail");
//   }
// });

const UserAuthSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true,trim:true },
    email: {
      type: String,
      required: true,
      trim:true,
      // unique: [true,"this email is used try another one"],
       
    },
    username: {
      type: String,
      required: true,
      trim:true,
      lowercase:true,
      unique: [true,"this user is used try another one"],
    },
    password: { type: String},
    department: {
      type: String,
      enum: {
        values: ["software", "network","security"],
        message: "{VALUE} is not supported",
      },
      required:true
    },
  },
  {
    timestamps: true,
  }
);

UserAuthSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("UserAuth", UserAuthSchema);
