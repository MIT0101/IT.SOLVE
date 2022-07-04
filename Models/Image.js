const mongoose=require("mongoose");

mongoose.connect(process.env.DBCON_IMAGES_SEC1,(err)=>{

    if (!err) {
        console.console.log("DBCON_IMAGES_SEC1 Seccessfull");
      } else {
        console.console.log("DBCON_IMAGES_SEC1 Fail");
      }
});

const imagetSchema=mongoose.Schema({
content:[]
});

module.exports=mongoose.model("Image",imagetSchema);