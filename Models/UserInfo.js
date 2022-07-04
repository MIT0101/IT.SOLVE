 require("dotenv").config();
const mongoose = require("mongoose");

// mongoose.connect(process.env.DBCON_INFO_SEC1, (err) => {
//   if (!err) {
//     console.console.log("DBCON_INFO_SEC1 Seccessfull");
//   } else {
//     console.console.log("DBCON_INFO_SEC1 Fail");
//   }
// });


const UserInfoSchema = mongoose.Schema(
  {
    //must get user authtication id here
    _id: { type: String, required: true },
    imageUrl: { type: String, required: true, default: "NO URL" },
    postsId: [String],
    score: { type: Number, required: true, default: 0 },
    isAdmin: { type: Boolean, required: true, default: false },
    flowingUsers: [String]
  
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserInfo", UserInfoSchema);
