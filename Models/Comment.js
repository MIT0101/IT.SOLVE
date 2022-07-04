const mongoose = require("mongoose");

// mongoose.connect(process.env.DBCON_COMENTS_SEC1, (err) => {
//   if (!err) {
//     console.console.log("DBCON_COMENTS_SEC1 Seccessfull");
//   } else {
//     console.console.log("DBCON_COMENTS_SEC1 Fail");
//   }
// });

const CommentSchema = mongoose.Schema(
  {
    autherId: String,
    message: String,
    isSolve: { type: Boolean, default: false },
    //another coments id
    upUsers:[{_userId:String}],
    replayes: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", CommentSchema);
