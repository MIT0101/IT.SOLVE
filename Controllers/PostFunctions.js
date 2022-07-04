const Post = require("../Models/Post");
const UserAuth = require("../Models/UserAuth");
const UserInfo = require("../Models/UserInfo");
const Comment = require("../Models/Comment");
//constants class


const Constants = require("../Controllers/Constants");

//fist param for post qury object like {_Id:postId}, second boolean if showcomment or not ,
// third for get max of comments to show  if -1 mean no limit,fourth for get current userid
exports.getPostInfo = async (postQuery, showComments,maxShowComment, currentUserId) => {
  //isCommentOwner
  let postInfo = {};
  let timeToShow;
  try {
    const foundPost = await Post.findOne(postQuery).clone();
    if (foundPost) {
      // let tempComments=foundPost.coments;
      let lastComments = [];
      timeToShow = foundPost.createdAt;
      postInfo.postId = foundPost._id;
      postInfo.postAutherId = foundPost.autherId;
      postInfo.postImageUrl = foundPost.imageUrl;
      postInfo.postTitle = foundPost.postTitle;
      postInfo.postMessage = foundPost.postMessage;
      //postInfo.postComments = [];
      postInfo.postCreatedTime = timeToShow;
      postInfo.postDepartment = foundPost.department;
      postInfo.isPostFound = true;

      //get auther id

      
      const userDeep = await UserAuth.findOne(
        { _id: postInfo.postAutherId },
        "fullName username"
      ).clone();
      //if auther is found
     // console.log(postInfo.postAutherId);
      if (userDeep) {
        postInfo.postAutherName = userDeep.fullName;
        postInfo.postAutherUsername = userDeep.username;


        const foundUser = await UserInfo.findOne({_id: postInfo.postAutherId},"imageUrl").clone();
        if (foundUser) {
          postInfo.postAutherImageUrl = foundUser.imageUrl;
        }
        else{
            postInfo.postAutherImageUrl = Constants.DELETEDACOUNTIMAGEURL;
        }
      
      }else {
          postInfo.postAutherName = Constants.DELETEDACOUNTFULLNAME;
          postInfo.postAutherUsername = Constants.DELETEDACOUNTUSERNAME;
          postInfo.postAutherImageUrl = Constants.DELETEDACOUNTIMAGEURL;

        }
        //to show comment or not

      if (showComments) {
        let i = 0;
        let isError = false;

        let commentsArrayLength=foundPost.coments.length;

        if(maxShowComment!=-1){
          if(commentsArrayLength>maxShowComment){
            commentsArrayLength=maxShowComment;
          }
        }
        foundPost.coments=foundPost.coments.reverse();

        while (i < commentsArrayLength&& !isError) {
          //here must get Comment From Comment Collections
          let comment1;
          try {
            comment1 = await Comment.findOne({
              _id: foundPost.coments[i]._id,
            }).clone();
              
            if(comment1){

            comment1.commentScore = comment1.upUsers.length;

            if (comment1.autherId == currentUserId) {
              comment1.isCommentOwner = true;
            } else {
              comment1.isCommentOwner = false;

              try {
                let commentFoundActive = await Comment.findOne({
                  _id: comment1._id,
                  "upUsers._userId": currentUserId,
                }).clone();
                if (!commentFoundActive) {
                  comment1.isUped = false;
                } else {
                  comment1.isUped = true;
                }
              } catch (error2) {
                comment1.isUped = false;
              }
            }

            const commentAutherFounded = await UserAuth.findOne({
              _id: comment1.autherId,
            }).clone();
            //console.log(commentAutherFounded);
            if (!commentAutherFounded) {
              lastComments.push({
                autherUsername: Constants.DELETEDACOUNTUSERNAME,
                autherFullName: Constants.DELETEDACOUNTFULLNAME,
                commentAutherImageUrl: Constants.DELETEDACOUNTIMAGEURL,
                commentMessage: comment1.message,
                commentCreatedAt: comment1.createdAt,
                commentId: comment1._id,
                isCommentOwner: comment1.isCommentOwner,
                commentScore: comment1.commentScore,
                isUped: comment1.isUped,
              });
              // isError=true;
            } else {
              //must deal if user is deleted but still hase an comment
              const commentAutherFoundedInfo = await UserInfo.findOne({
                _id: commentAutherFounded._id,
              }).clone();
              let imgUrl = "";
              if (!commentAutherFoundedInfo) {
                imgUrl = Constants.DELETEDACOUNTIMAGEURL;
              } else {
                imgUrl = commentAutherFoundedInfo.imageUrl;
                lastComments.push({
                  autherUsername: commentAutherFounded.username,
                  autherFullName: commentAutherFounded.fullName,
                  commentAutherImageUrl: imgUrl,
                  commentMessage: comment1.message,
                  commentCreatedAt: comment1.createdAt,
                  commentId: comment1._id,
                  isCommentOwner: comment1.isCommentOwner,
                  commentScore: comment1.commentScore,
                  isUped: comment1.isUped,
                });
              }
            }

            

           }



          } catch (error3) {
            // let comment1 = {};
            // isError = true;
            // break;
          }
          //i cant get autherId from comment1 object almost object has all info also autherId
         

          i++;
        }
      
      //if show comments is false will return empty array of comments

      postInfo.postComments = lastComments;

        return postInfo;
      
        
      } 
      //if show comments is false will return empty array of comments
      postInfo.postComments = lastComments;

        return postInfo;
    }
    else {
      //if ther no post found
      postInfo.isPostFound = false;
      // console.log(postInfo);
      return postInfo;
    }
  } catch (error) {
    //if ther some error in object passed
    postInfo.isPostFound = false;
    //  callback(true,postInfo)
    return postInfo;
  }
};
//first param is posts qury ,second is sort object,third for postskip,fourth for post limit ,fivth is boolean to show comment or not ,
// ,six limit comments show number seven is current user signed
exports.getPosts = async (postsQueryArray,sortQuery,postsSkip,postsLimit, showComments,maxShowComment, currentUserId) => {

  let postsArrayTemp=[];
  let postsArray=[];
  try {
    postsArrayTemp= await Post.find({$or:postsQueryArray},"_id").sort(sortQuery).skip(postsSkip).limit(postsLimit).clone();
    if(postsArrayTemp.length>0){
      for (let i = 0; i < postsArrayTemp.length; i++) {
        const singlePost = postsArrayTemp[i];
        postsArray.push(await module.exports.getPostInfo({_id:singlePost._id},showComments,maxShowComment,currentUserId));
      }
      }         
     }
     catch (error) {

      postsArray=[];

    }

    return postsArray;

}

