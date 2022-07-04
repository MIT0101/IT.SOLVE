const mongoose = require("mongoose");

// mongoose.connect(process.env.DBCON_POST_SEC1, (err) => {
//   if (!err) {
//     console.console.log("DBCON_POST_SEC1 Seccessfull");
//   } else {
//     console.console.log("DBCON_POST_SEC1 Fail");
//   }
// });

const PostSchema = mongoose.Schema(
  {
    //get auther id
    autherId: {type:String,required:true},
    postTitle:{type:String,required:true},
    postMessage: {type:String,required:true},
    imageUrl:{type:String,default:"noImage"},
    department: {
      type: String,
      enum: {
        values: ["software", "network","security"],
        message: "{VALUE} is not supported",
      },
      required:true
    },
    coments: [{_id:{type:String,required:true}}],
    isSolved: {type:Boolean,required:true,default:false},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", PostSchema);
