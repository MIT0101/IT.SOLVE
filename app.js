const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const UserInfo = require("./Models/UserInfo");
const Comment=require("./Models/Comment");
const Joi = require("joi");
const Post = require("./Models/Post");
//for my middile war passport auth che if authrized
const PassportAuthMiddle = require("./Middleware/PassportAuth");
//connect to db 
mongoose.connect(process.env.DBCON_AUTH_SEC1, (err) => {
  if (!err) {
    console.log("DBCON_AUTH_SEC1 Seccessfull");
  } else {
    console.log("DBCON_AUTH_SEC1 Fail");
  }
});
//my class
const PostFunctions=require("./Controllers/PostFunctions");
const Constants = require("./Controllers/Constants");

//******************************************for upload images multer************************************************************ */
const multer = require("multer");

const profileImageStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await cb(null, "uploads/profilesImages");
  },
  filename: async function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    await cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const multerFileFulter = (req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"||
    file.mimetype == "image/gif"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: multerFileFulter,
});

const postImageStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await cb(null, "uploads/postImages");
  },
  filename: async function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    await cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const uploadPostImage = multer({
  storage: postImageStorage,
  fileFilter: multerFileFulter,
});
//end for images uploads

// const f_ck=require("f-ck");
// const {inner}=f_ck;

// import {vowel, inner, grawlix} from "f-ck";


// app.get("/test/:word",(req,res)=>{
//   let word=req.params.word;


// res.send(inner(word));
// });

//******************************************for User Authintiaction my classis and passport setup************************************************************ */
const UserAuthC = require("./Controllers/userAuthC");

//1 setup our pages
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
//1 end
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("uploads"));

//my mongoo store
const MongoStore  = require('connect-mongo');

//2 use sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store  :MongoStore.create({
      mongoUrl: process.env.DBCON_AUTH_SEC1,
      //for delet sexpired sessions
      autoRemove: 'native',
      // The maximum lifetime (in seconds) of the session which will be used to set session.cookie.expires if it is not yet set. Default is 14 days.
      ttl:1209600
    }),
    cookie: {
      //max cooke age in milesecond
      maxAge: 1000*1209600,
       //to secute cooke
       httpOnly: true,
       //First, the secure property takes a boolean (true/false) value which 
       //specifies whether or not this cookie can only be retrieved over an SSL or HTTPS connection.
      //secure:process.env.SESSION_SECRET,
    }
     
  })
);
//2 end
//3 set passport to mange auth
app.use(passport.initialize());
app.use(passport.session());
//3end

//4 requre our Schema and plug in passport-local-mongoose and export model
const UserAuth = require("./Models/UserAuth");
//4end

//5 let passport crate staratgy
let LocalStrategy = require("passport-local");

passport.use(UserAuth.createStrategy());

//5 end

//6 passport will open and close cockies

passport.serializeUser(UserAuth.serializeUser());
passport.deserializeUser(UserAuth.deserializeUser());
//6 end

//**********************************************for show posts Depend On Department *******************************************************/

app.route("/department/:departmentName").get(async (req,res)=>{
  const {departmentName}=req.params;
 //check for depatment validation
  if(isDepartmentValid(departmentName)){
//all work here

//msut show all least post and page and size
let  currentUsername = Constants.DELETEDACOUNTUSERNAME;
let userImageUrl = Constants.DELETEDACOUNTIMAGEURL;
let searchQuryArray=[{department:departmentName}];
let postsArray;
let isAuth=false;

//preper for pageNumber and skip

let postCount = await Post.count({$or:searchQuryArray});


let {pageNo}=req.query;
let skip;
if(pageNo){
if(pageNo>=1){
  let ourRang=Math.ceil(postCount/Constants.POSTSLIMITSHOWNFOREACHPAGE);
if(pageNo>ourRang){
 pageNo=ourRang;
}
skip=Constants.POSTSLIMITSHOWNFOREACHPAGE*(pageNo-1);
}
else{
  skip=0;
  pageNo=1;
}
}


if(req.isAuthenticated()){
 currentUsername = req.user.username;

await UserInfo.findOne({ _id: req.user._id }, (err, useri) => {
  if (!err && useri) {
    userImageUrl = useri.imageUrl;
  }
}).clone();

 postsArray =await PostFunctions.getPosts(searchQuryArray,{createdAt: 'desc'},skip,Constants.POSTSLIMITSHOWNFOREACHPAGE, true,Constants.COMMENTLIMITFORPROFILESHOW, req.user._id);
 //if user is unauthinicated
 isAuth=true;

}
else{
 postsArray =await PostFunctions.getPosts(searchQuryArray,{createdAt: 'desc'},skip,Constants.POSTSLIMITSHOWNFOREACHPAGE, false,Constants.COMMENTLIMITFORPROFILESHOW, "");

}
//first param is posts qury ,second is sort object,third for postskip,fourth for post limit ,fivth is boolean to show comment or not ,
// ,six limit comments show number seven is current user signed

return res.render("mainPage", {
  pageTitle: "IT.SOLVE | Main",
  userImageUrl: userImageUrl,
  currentUsername,
  postsArray,
  postCount,
  showMoreInfo:true,
  isProfile:false,
  isSearch:false,
  searchParams:"",
  pageNo,
  isAuth
});

  }else{
   return res.redirect("/");
  }
});


//******************************************for post delete route **************************************************************** */

app.route("/post/edit/delete/:postId").post(async (req,res)=>{

  const {postId}=req.params;
  const currentUser_id=req.user._id;
  const isDeleteInput=req.body.isDelete;
  let  {isDelete} =req.query;

  try {
    if(isDelete){
      if(isDeleteInput=="true"&&isDelete=="true"){

        let currentPost=await Post.findOne({autherId:currentUser_id,_id:postId}," _id autherId ");

        if(currentPost){
          await Post.deleteOne({_id:currentPost._id});
          
          return res.redirect("/");

        }else{
          return res.redirect( "/post/edit/"+postId+"?errorMessge=post not found to delete or you have not primmesion to delete");

        }

      }
      return res.redirect( "/post/edit/"+postId+"?errorMessge=invalid input to delete");

    }
    else{

      return res.redirect( "/post/edit/"+postId+"?errorMessge=No input passed");

    }
  } catch (error) {
    return res.redirect( "/post/edit/"+postId+"?errorMessge=post not found to delete or you havnt primmesion to delete");
  }

});

//******************************************for post update route ************************************************************ */
app.route("/post/edit/:postId").get(PassportAuthMiddle,async(req,res)=>{
  

const {postId}=req.params;
const currentUser_id=req.user._id;
let  {nextRedirect,errorMessge} =req.query;

if(!nextRedirect){
  nextRedirect="/";
}
if(!errorMessge){
  errorMessge="";
}

//console.log(errorMessge);

try {
  let postInfo={};
  let currentPost=await Post.findOne({autherId:currentUser_id,_id:postId}," _id autherId postTitle postMessage imageUrl department");

  if(await currentPost){
    postInfo=currentPost;
    postInfo.isFound=true;
       //current image path 
     //console.log(__dirname+`/uploads/postImages/${postInfo.imageUrl}`);

    //  postInfo.imagePath=__dirname+`/uploads/postImages/${postInfo.imageUrl}`;

 
    return res.render("postEdit",{postInfo,pageTitle:"IT.SOLVE | Edit Post ",nextRedirect,errorMessge});

  }
  else{
    postInfo.isFound=false;

       return res.render("postEdit",{postInfo:{isFound:false},pageTitle:"IT.SOLVE | Edit Post Not Found",nextRedirect,errorMessge});
  }

  
} catch (error) {

  let postInfo={};
  postInfo.isFound=false;
  postInfo.errorMessge =error.message;

  return res.render("postEdit",{postInfo,pageTitle:"IT.SOLVE | Edit Post ",nextRedirect,errorMessge});
  
}


}).post(PassportAuthMiddle,uploadPostImage.single("postImage"),async (req,res)=>{
  const {postId}=req.params;
  const currentUser_id=req.user._id;
  const { postTitle, postMessage, department } = req.body;
  const{oldImageUrl,newImageUrl}=req.body;

  //console.log(department);

  try {
    let currentPost=await Post.findOne({autherId:currentUser_id,_id:postId}," _id autherId postTitle postMessage imageUrl department");

    if(currentPost){
          //if they are not equal will update post image url
          let imageUrl = oldImageUrl;

          if(oldImageUrl !==newImageUrl){
          //for check if ther An Image
          if ("file" in req && "filename" in req.file) {
            imageUrl = req.file.filename;
          }
          }

        let jioError = validateNewPost({ postTitle:postTitle.trim(), postMessage:postMessage.trim(), department });

        if (jioError.error) {
          return res.redirect(
            "/post/edit/"+postId+"?errorMessge=" + jioError.error.details[0].message
          );
          //console.log("error in Jio");
        } else {

          currentPost.postTitle=postTitle;
          currentPost.postMessage=postMessage;
          currentPost.imageUrl=imageUrl;
          currentPost.department=department;

          await currentPost.save();
          
          return res.redirect("/post/"+postId);
        }

    }else{
    //post not found to update connect to this user
      return res.redirect(
        "/post/edit/"+postId+"?errorMessge=" + "Post Not Found Or You Have not primission to Edit"
      );

    }

  } catch (error) {

    return res.redirect(
      "/post/edit/"+postId+"?errorMessge=" + "Post Not Found Or You Have not primission to Edit"
    );
  }

});



//******************************************here to delete  comment json ************************************************************ */
app.route("/commentDelete/:commentId").post(async (req,res)=>{

  const {commentId}=req.params;
  const {postId}=req.body;
  if(commentId&&postId){
    try {
      let deletedComment=await Comment.deleteOne({_id:commentId,autherId:req.user._id}).clone();
      
      if(deletedComment){
        let postModefired=await Post.updateOne({ _id: postId }, { $pull: {coments: {_id:commentId}}});

        // console.log(postModefired);

      return res.json({isDeleted:true});
      }
      else{
        return res.json({isDeleted:false});
      }
      

    } catch (error) {
      return res.status(502).json({errorMessage:"You havnt premission to Edit this comment or Some error happen"});

    }
  }
  else{
    return res.status(502).json({errorMessage:"Some require info not avarbl"});

  }

  


});
//******************************************here to update comment json************************************************************ */

app.route("/commentEdit/:commentId").post(PassportAuthMiddle,async (req,res)=>{

  const {commentId}=req.params;
  const {postId,commentNewMessage}=req.body;

  if(commentNewMessage||commentNewMessage.trim().length>1){

    try {
      let updatedComment=await Comment.updateOne({_id:commentId,autherId:req.user._id},{message:commentNewMessage.trim()}).clone();
      
      if(updatedComment){
      return res.json({isUpdated:true});
      }

        return res.status(404).json({errorMessage:"No Comment To Edit"});
      

    } catch (error) {
      return res.status(502).json({errorMessage:"You havnt premission to Edit this comment"});

    }

  }
  else{
    return res.status(502).json({errorMessage:"ther is no comment message to Edit"});
  }

});
//******************************************comment score json************************************************************ */

app.route("/commentScore/:commentId").post(PassportAuthMiddle,async(req,res)=>{
  
 const {postId,commentScoreSended}=req.body;
 const commentId=req.params.commentId;
//  try {
   await Comment.findOne({_id:commentId,autherId:req.user._id},async(err,unWontedCommentFound)=>{
     if(err||unWontedCommentFound){return res.status(502).json({errorMessage:"You Cant Up Your Selef Like That"});}
     else{
        // coments
        // {  }
         
          try {
         Comment.findOne({_id:commentId},async(err3,foundedComment1)=>{
           if(err3||!foundedComment1){return res.status(502).json({errorMessage:"Comment Not Found To Up"});}
           else{
             Comment.findOne({_id:commentId,"upUsers._userId":req.user._id},async(err4,foundedComment2)=>{
               if(err4){return res.status(502).json({errorMessage:"Ther are error in finde comment to update"});}
                if(foundedComment2){
                  //must remove the the up of this user and update auther score by decress --
                 await Comment.updateOne({_id:foundedComment1._id }, { $pull: { upUsers : { _userId: req.user._id } } }, async(err5,updatedcomment)=>{
                      //console.log("update secsess by remove upUser");
                      let commentScore=foundedComment1.upUsers.length-1;

                      return res.status(200).json({isUp:false,commentScore:commentScore});
                    }
                ).clone();
                }
                else{
                 //must add this user to comment upUsers and incress auther score
                 foundedComment1.upUsers.push({_userId:req.user._id});
                 let commentScore=foundedComment1.upUsers.length;
                 await foundedComment1.save();
                 return res.status(200).json({isUp:true,commentScore:commentScore});
                }
             }).clone();
           }
         }).clone();

          } catch (error) {
            return res.status(502).json({errorMessage:"Some Error Ctched",commentScore:commentScoreSended});
          }
       
     }
   }).clone();
   
//  } catch (error) {
//    return res.status(502).json({errorMessage:"Some Error May Be Id Is Not Valid"});
//  }

});

//******************************************uploead new post************************************************************ */

app
  .route("/post/newpost")
  .get(PassportAuthMiddle, async (req, res) => {
    let currentUsername = req.user.username;
    let { errorMessge, nextRedirect } = req.query;

    if (!nextRedirect) {
      nextRedirect = "/";
    }

    if (!errorMessge) {
      errorMessge = "";
    }
    res.render("newPost", {
      pageTitle: "IT.SOLVE | New Post",
      errorMessge,
      nextRedirect,
      currentUsername,
    });
  })
  .post(
    PassportAuthMiddle,
    uploadPostImage.single("postImage"),
    async (req, res) => {
      let {addImage}=req.body;

      //console.log(req.body);
      
      let imageUrl = Constants.NOIMAGETOUPLOAD;
      //for check if ther An Image
      if ("file" in req && "filename" in req.file && addImage) {
        if(addImage=="true"){
        imageUrl = req.file.filename;
        }

      }

      const { postTitle, postMessage, department } = req.body;

      let jioError = validateNewPost({ postTitle, postMessage, department });

      if (jioError.error) {
        return res.redirect(
          "/post/newpost?errorMessge=" + jioError.error.details[0].message
        );
        //console.log("error in Jio");
      } else {
        newPost = new Post({
          autherId: req.user._id,
          postTitle,
          postMessage,
          department,
          imageUrl,
        });

        await newPost.save((err, post) => {
          if (!err) {
            newPost_id = post._id;
          }
        });

        let currentUser = await UserInfo.findOne({ _id: req.user._id });

        if (currentUser) {
          currentUser.postsId.push(newPost._id);
          await currentUser.save();
        }

        res.redirect("/post/" + newPost._id);
      }
    }
  );
//******************************************for show single post only************************************************************ */

app.route("/post/:postId").get( async (req, res) => {
//fist param for post qury object like {_Id:postId}, second boolean if showcomment or not ,
// third for get max of comments to show  if -1 mean no limit,fourth for get current userid

//here must chck if user auth will view all comment or not will view zero comment
let userImageUrl=Constants.DELETEDACOUNTIMAGEURL;
let currentUsername=Constants.DELETEDACOUNTUSERNAME;
let postInfo ;
let isAuth=false;
let showComments=false;
let currentuser_id="";
if(req.isAuthenticated()){
    isAuth=true;
    showComments=true;

    await UserInfo.findOne({ _id: req.user._id }, (err, useri) => {
      if (!err && useri) {
        userImageUrl = useri.imageUrl;
      }
    }).clone();

    currentuser_id=req.user._id;
    currentUsername=req.user.username;
}

postInfo = await  PostFunctions.getPostInfo({_id:req.params.postId},showComments,-1,currentuser_id);
let isPostAuther=false;
 try {
  let postWithcurrentUser=await Post.findOne({_id:req.params.postId,autherId:req.user._id},"_id autherId");
  if(postWithcurrentUser){
    isPostAuther=true;
   }
 } catch (error) {
   
 }

 //console.log(isPostAuther);




  return res.render("PostOnly", {
    pageTitle: "IT.SOLVE | Post : "+postInfo.postTitle,
    userImageUrl: userImageUrl,
    currentUsername,
    postInfo,
    showMoreInfo: false,
    isAuth,
    isPostAuther,
  });
  
    

}).post(PassportAuthMiddle,async(req,res)=>{
  //must be done here
  const {postId}=req.params;
  let comentMessage=req.body.comentMessage;

  comentMessage=comentMessage.toString().trim();


  if(comentMessage.length<=0){
    return res.redirect(req.url);
  }

//must check for valid comment message
  try {
  Post.findOne({_id:postId},async(err,foundPost)=>{
  if(!foundPost||!comentMessage||comentMessage.length<=0){return res.redirect(req.url);}
   
  let newComment=new Comment({autherId:req.user._id,message:comentMessage});
  await newComment.save();
  foundPost.coments.push({_id:newComment._id});

  await foundPost.save();
  //console.log("comment aded succeffully");

  return res.redirect(req.url);
  
  }).clone();
    
  } catch (error) {
    //console.log("ther are some error throgh save your comment");
    return res.redirect(req.url);
  }

});


//******************************************for ulpoad profile image route************************************************************ */
app
  .route("/upload/image/profile")
  .get(PassportAuthMiddle, async (req, res) => {
    // if (req.isAuthenticated()) {
      let isAuth=true;
      let {nextRedirect}=req.query;
      if(!nextRedirect){nextRedirect="/"}
    let currentUsername = req.user.username;
     
    let userImageUrl = "profile_img.png";
    await UserInfo.findOne({ _id: req.user._id }, (err, useri) => {
      if (!err && useri) {
        userImageUrl = useri.imageUrl;
      }
    }).clone();

    res.render("updateProfilePhoto", {
      pageTitle: "IT.SOLVE | Update Profile Photo",
      userImageUrl: userImageUrl,
      userFullName: req.user.fullName,
      currentUsername,nextRedirect,isAuth
    });
    // } else {
    //   res.redirect("/login");
    // }
  })
  .post(
    PassportAuthMiddle,
    uploadProfileImage.single("avatar"),
    async (req, res) => {
      let {nextRedirect}=req.query;
      if(!nextRedirect){nextRedirect="/"}
      if (req.isAuthenticated()) {
        let currentUser = await UserInfo.findOne({ _id: req.user._id });
        if ("file" in req && "filename" in req.file) {
          myImageUrl = req.file.filename;

          if (currentUser) {
            await UserInfo.updateOne(
              { _id: req.user._id },
              { _id: req.user._id, imageUrl: myImageUrl },
              (err) => {
                if (!err) {
                  console.log("image uplodedd seccessful: " + myImageUrl);
                }
              }
            ).clone();
          }
          //if there no user
          else {
            let userinfo1 = new UserInfo({
              _id: req.user._id,
              imageUrl: myImageUrl,
            });
            await userinfo1.save();
          }
        }

        res.redirect(nextRedirect);
      } else {
        res.redirect("/login");
      }
    }


  );
  //******************************************for spicifc profile show*********************************************************** */
app
  .route("/profile/:profileusername")
  .get(PassportAuthMiddle, async (req, res) => {
    let isAuth=true;
    let userImageUrl = Constants.DELETEDACOUNTIMAGEURL;
    let currentUsername = req.user.username;

     UserInfo.findOne({ _id: req.user._id }, async (err, useri) => {
      userImageUrl = useri.imageUrl;
    }).clone();

    let userInfo = {};
    // if(req.isAuthenticated()){
    await UserAuth.findOne({ username: req.params.profileusername },async (err, userFromReqAuth) => {
        if (userFromReqAuth) {
          await UserInfo.findOne(
            { _id: userFromReqAuth._id },
            async (err2, userFromrReqParam) => {
              //get user score
              let finalScore=0;

              try {
                let commentsScored= await Comment.find({autherId:userFromrReqParam._id},"upUsers");
                commentsScored.forEach(comment => {
                  finalScore+=comment.upUsers.length;
                });
               
              } catch (error) {
              console.log("some error");
              }
              //console.log(finalScore);
              // console.log("user info from q2"+userFromrReqParam);

              userInfo.mainImageUrl = userFromrReqParam.imageUrl;
              userInfo.score = finalScore;
              userInfo.userName = userFromReqAuth.username;
              userInfo.department = userFromReqAuth.department;
              userInfo.fullName = userFromReqAuth.fullName;
              userInfo.isFound = true;
        
              //first param is posts qury ,second is sort object,third for postskip,fourth for post limit ,fivth is boolean to show comment or not ,
              // ,six limit comments show number seven is current user signed

              let postSingleQury={autherId:userFromReqAuth._id};

              let postsQueryArray=[];

              postsQueryArray.push(postSingleQury)

              let postCount= await Post.count(postSingleQury);

              let {pageNo}=req.query;
              let skip;
              if(pageNo){
                if(pageNo>=1){
                  let ourRang=Math.ceil(postCount/Constants.POSTSLIMITSHOWNFOREACHPAGE);
               if(pageNo>ourRang){
                 pageNo=ourRang;
               }
                skip=Constants.POSTSLIMITSHOWNFOREACHPAGE*(pageNo-1);
              }
                else{
                  skip=0;
                  pageNo=1;
                }
              }

              

              const postsArray =await PostFunctions.getPosts(postsQueryArray,{createdAt: 'desc'},skip,Constants.POSTSLIMITSHOWNFOREACHPAGE, true,Constants.COMMENTLIMITFORPROFILESHOW, req.user._id);

              return res.render("profilePage", {
                pageTitle: "IT.SOLVE | " + req.params.profileusername,
                userImageUrl: userImageUrl,
                userInfo,
                currentUsername,
                postsArray,
                postCount,
                profileusername: req.params.profileusername,
                isProfile:true,
                isSearch:false,
                searchParams:"",
                showMoreInfo:true,
                pageNo,
                isAuth,
              });
              
           
            }
          ).clone();
        } else {
          userInfo.isFound = false;
          const postCount=0;
           let pageNo=0;
         // console.log("user is " + userInfo.isFound);
            
          return res.render("profilePage", {
            pageTitle: "IT.SOLVE | " + req.params.profileusername,
            userImageUrl: userImageUrl,
            userInfo,
            profileusername: req.params.profileusername,
            currentUsername,
            postCount,
              showMoreInfo:true,
              isProfile:false,
              isSearch:false,
              searchParams:"",
               pageNo,
              isAuth
          });
        }
      }
    ).clone();



  });

//******************************************Search route*********************************************************** */
app.route("/search").get(async (req,res)=>{
  let userImageUrl = Constants.DELETEDACOUNTIMAGEURL;
  let isAuth=false;
 let showComments=false;
  let currentuser_id="";

  let currentUsername = Constants.DELETEDACOUNTUSERNAME;

  if(req.isAuthenticated()){
    currentUsername=req.user.username;
    isAuth=true;
    showComments=true;

    await UserInfo.findOne({ _id: req.user._id }, (err, useri) => {
      if (!err && useri) {
        userImageUrl = useri.imageUrl;
      }
    }).clone();

    currentuser_id=req.user._id;

  }



  let searchQuryArray=[];
  const {searchParams}=req.query;

  let searchString="";
  let allPostConnectToCommentFinal=[];

  
  if(searchParams){
    //here desgin posts find qury
      searchString= searchParams.toString().trim();

    if(searchString.length>0){
      // $or:[ {'_id':objId}, {'name':param}, {'nickname':param} ]
      // $or:
      searchQuryArray.push({postTitle:{$regex :`.*${searchString}.*`,$options:"i"}});
      searchQuryArray.push({postMessage:{$regex :`.*${searchString}.*`,$options:"i"}});

      // here get all comments id has a messag with this query 

      const allCommentsContain=await Comment.find({message:{$regex :`.*${searchString}.*`,$options:"i"}},"_id");

      if(allCommentsContain&&allCommentsContain.length>0){

        // now for each commen get it post and push it to array


        for (let i = 0; i < allCommentsContain.length; i++) {
          const comment = allCommentsContain[i];
          let singlePostsConnectToComment = await  PostFunctions.getPostInfo({coments:{_id:comment._id}},showComments,Constants.COMMENTLIMITFORPROFILESHOW,currentuser_id);
          allPostConnectToCommentFinal.push(singlePostsConnectToComment);
        }

      }

    }
    else{
      searchQuryArray.push({});

    }
  }
  else{
    searchQuryArray.push({});
  }

  let postsArray =await PostFunctions.getPosts(searchQuryArray,{createdAt: 'desc'},0,Constants.POSTSLIMITSHOWNFOREACHPAGE, showComments,Constants.COMMENTLIMITFORPROFILESHOW, currentuser_id);

//   //hre new work
   const allmap=new Map();

  for (let k = 0; k < postsArray.length; k++) {
    const element = postsArray[k];
    if(!allmap.has(element._id)){
      allmap.set(element.postId,element);
    }
  }
  for (let k2 = 0; k2 < allPostConnectToCommentFinal.length; k2++) {
    const element = allPostConnectToCommentFinal[k2];
    if(!allmap.has(element._id)){
      allmap.set(element.postId,element);

    }
  }

//old code
//   let uniqpostsArray =getUniqueListBy(postsArray,"_id") ;
//   let uniqpostsArray2 =getUniqueListBy(allPostConnectToCommentFinal,"_id") ;
//   let myFinalArray = Array.from(new Set(uniqpostsArray.concat(uniqpostsArray2))); 
// let postCount=myFinalArray.length;
//old code end

let myFinalArray=Array.from(allmap.values());
let postCount=myFinalArray.length;

      let {pageNo}=req.query;
      let skip;
      if(pageNo){
        if(pageNo>=1){
          let ourRang=Math.ceil(postCount/Constants.POSTSLIMITSHOWNFOREACHPAGE);
          if(pageNo>ourRang){
            pageNo=ourRang;
          }
         skip=Constants.POSTSLIMITSHOWNFOREACHPAGE*(pageNo-1);
        }
        else{
            skip=0;
            pageNo=1;
          }
      }
      else{
        skip=0;
        pageNo=1;

      }


let myFinalArray2=myFinalArray.slice(pageNo-1,(pageNo-1)+Constants.POSTSLIMITSHOWNFOREACHPAGE);

let profilesfound=await UserAuth.find({$or: [{fullName:{$regex :`.*${searchString}.*`,$options:"i"}},{username:{$regex :`.*${searchString}.*`,$options:"i"}}]},"_id fullName username").limit(4).clone();

// profilesfound= profilesfound.map(async(elemt)=>{
//   await UserInfo.findOne({_id:elemt._id},"imageUrl");
// });


let lastProfiles=[];

for (let k = 0; k < profilesfound.length; k++) {
  const elemt = profilesfound[k];
  let profile=  await UserInfo.findOne({_id:elemt._id},"_id imageUrl");
  lastProfiles.push({fullName:elemt.fullName,username:elemt.username,imageUrl:profile.imageUrl});
}



  return res.render("mainPage", {
    pageTitle: "IT.SOLVE | Search",
    userImageUrl: userImageUrl,
    currentUsername,
    postsArray:myFinalArray2,
    profilesfound:lastProfiles,
    postCount,
    showMoreInfo:true,
    isProfile:false,
    isSearch:true,
    searchParams:searchString,
    pageNo,
    isAuth,
  });




});

//******************************************for main route ********************************************************** */
//disapled Passport Auth MiddleWare
app.route("/").get(async(req, res) => {
  // if (req.isAuthenticated()) {
  //msut show all least post and page and size
  let  currentUsername = Constants.DELETEDACOUNTUSERNAME;
  let userImageUrl = Constants.DELETEDACOUNTIMAGEURL;
  let searchQuryArray=[{}];
  let postsArray;
  let isAuth=false;

//preper for pageNumber and skip

let postCount = await Post.count({$or:searchQuryArray});


let {pageNo}=req.query;
let skip;
if(pageNo){
  if(pageNo>=1){
    let ourRang=Math.ceil(postCount/Constants.POSTSLIMITSHOWNFOREACHPAGE);
 if(pageNo>ourRang){
   pageNo=ourRang;
 }
  skip=Constants.POSTSLIMITSHOWNFOREACHPAGE*(pageNo-1);
}
  else{
    skip=0;
    pageNo=1;
  }
}


if(req.isAuthenticated()){
   currentUsername = req.user.username;

  await UserInfo.findOne({ _id: req.user._id }, (err, useri) => {
    if (!err && useri) {
      userImageUrl = useri.imageUrl;
    }
  }).clone();

   postsArray =await PostFunctions.getPosts(searchQuryArray,{createdAt: 'desc'},skip,Constants.POSTSLIMITSHOWNFOREACHPAGE, true,Constants.COMMENTLIMITFORPROFILESHOW, req.user._id);
   //if user is unauthinicated
   isAuth=true;

}
else{
   postsArray =await PostFunctions.getPosts(searchQuryArray,{createdAt: 'desc'},skip,Constants.POSTSLIMITSHOWNFOREACHPAGE, false,Constants.COMMENTLIMITFORPROFILESHOW, "");

}
//first param is posts qury ,second is sort object,third for postskip,fourth for post limit ,fivth is boolean to show comment or not ,
// ,six limit comments show number seven is current user signed

 return res.render("mainPage", {
    pageTitle: "IT.SOLVE | Main",
    userImageUrl: userImageUrl,
    currentUsername,
    postsArray,
    postCount,
    showMoreInfo:true,
    isProfile:false,
    isSearch:false,
    searchParams:"",
    pageNo,
    isAuth
  });

});
//******************************************for register route ********************************************************** */

app
  .route("/register")
  .get((req, res) => {
     if (!req.isAuthenticated()) {
    let { errorMessge, nextRedirect } = req.query;
    //console.log(errorMessge);
    res.render("registerPage", {
      pageTitle: "IT.SOLVE | Register",
      errorMessge,
      nextRedirect,
    });
     } else {
     res.redirect("/");
     }
  })
  .post(async (req, res) => {
    let {nextRedirect } = req.query;
    if(!nextRedirect){nextRedirect="/";}

    if(!req.isAuthenticated()){
    UserAuthC.registerNewUser(req, res, UserAuth, passport,nextRedirect);
    }
    else{
      res.redirect("/");
    }
  });

//******************************************for login route ********************************************************** */
app
  .route("/login")
  .get((req, res) => {
     if (!req.isAuthenticated()) {
    let { errorMessge, nextRedirect } = req.query;
    //console.log(errorMessge);
    if (!nextRedirect) {
      nextRedirect = "/";
    }
    res.render("loginPage", {
      pageTitle: "IT.SOLVE | Login",
      errorMessge,
      nextRedirect,
    });
     } else {
    res.redirect("/");
     }
  })
  .post((req, res) => {
    const { nextRedirect } = req.query;
    //this method is async
    UserAuthC.loginUser(req, res, UserAuth, passport, nextRedirect);
  });
//******************************************for logout methods********************************************************** */

app.route("/logout").get(PassportAuthMiddle, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log("App Now Listen To Port :" + PORT);
});


//******************************************my metods********************************************************** */

/*for Departmenty Validtion*/

const isDepartmentValid=(departmentName)=>{
  if(departmentName=="software"){
    return true;
  }
  if(departmentName=="security"){
    return true;
  }
  if(departmentName=="network"){
    return true;
  }

  return false;

};


const getTonextRedirectString = (nextRedirect) => {
  return "" + "?nextRedirect=" + nextRedirect;
};

function getUniqueListBy(arr, key) {
  return [...new Map(arr.map(item => [item[key], item])).values()]
}

//******************************************input validation method********************************************************* */
//new post validation
function validateNewPost(newPost) {
  const newPostValidateSchema = Joi.object({
    postTitle: Joi.string().min(4).max(150).required(),
    postMessage: Joi.string().min(4).max(300).required(),
    department: Joi.string().min(4).max(30).required(),
  });

  

  return newPostValidateSchema.validate(newPost);
}