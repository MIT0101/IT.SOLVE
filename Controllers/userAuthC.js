/*for register new user */
const Joi = require("joi");
const UserInfo=require("../Models/UserInfo");

exports.registerNewUser = async (req, res, UserAuth, passport,nextRedirect) => {
  let currntuser = {
    fullName: req.body.fullName,
    email: req.body.email,
    username: req.body.username,
    password: "" + req.body.password.toString(),
    department: req.body.department,
  };

  
  let jioError = validateUser(currntuser);

  if (jioError.error) {
    return res.redirect(
      "/register?errorMessge=" + jioError.error.details[0].message
    );
    //console.log("error in Jio");
  } else {
    await UserAuth.register(
      {
        fullName: currntuser.fullName,
        email: currntuser.email,
        username: currntuser.username,
        department: currntuser.department,
      },
      currntuser.password,
      async (err, user) => {
        //console.log("i am in resgster call back fun");
        if (!err) {
          //console.log("i am in resgster no error user is "+user);
          

          await passport.authenticate("local")(req, res,async () => {
            //console.log("user Authinicated Seccessfull");
            //res.send("user Authinicated Seccessfull");
            // req.session.cookie.expires=new Date(Date.now+(1*60*1000));

            //new 
            //here to add user info to user info cluster

            
            let myImageUrl="profile_img.png";

            let userinfo1=new UserInfo({
             _id:user._id,
             imageUrl:myImageUrl
             });
               await userinfo1.save();

               console.log("user info regster sucsess");

               res.redirect("/upload/image/profile?nextRedirect="+nextRedirect);
          });
        } else {
          let string = encodeURIComponent(err.message);
          //work good
          res.redirect("/register?errorMessge=" + string+"&nextRedirect="+nextRedirect);
        }
      }
    );

    //res.redirect("/login");
  }
};

/*for log in user */

exports.loginUser = async (req, res, UserAuth, passport,nextRedirect) => {
  // let username = "" + req.body.username.toLowerCase();


  let username = "" + req.body.username;
  let password = req.body.password;

  let currntuser = {
    username: username,
    password: password,
  };

  let jioError = validateUserLogin(currntuser);

  if (jioError.error) {
    return res.redirect(
      "/login?errorMessge=" + jioError.error.details[0].message
    );
    //console.log("error in Jio");
  } else {
    const userAuth = new UserAuth({ username: username, password: password.toString() });
    await req.login(userAuth, (err) => {
      if (!err) {
        passport.authenticate("local", {
          failureRedirect: "/login?errorMessge=UserName or password is wrong&nextRedirect="+nextRedirect,
          //  successRedirect: nextRedirect,
        })(req, res, () => {
          // res.send("login successfull :" + userAuth);
          //console.log("user is authounticate "+userAuth);
          // req.session.cookie.expires=new Date(Date.now+(1*60*1000));

          // //cooke start
          // //init library 
          // const cookieParser = require('cookie-parser');  
          // app.use(cookieParser());  
          // //set new cooke
          // res.cookie("secureCookie3", "i am cooke3 ", {
          //   secure: "IT SOLVE project",
          //   // httpOnly: true,
          //   expires: new Date(Date.now+(1*1000)),
          // });

          // //to see cooke
          //  res.send(req.cookies);
          //  //to sestroy cooke
          //  res.clearCookie("secureCookie3");
          // console.log("cooke added suscees");

          // //cooke end


           res.redirect(nextRedirect);
        });
      } else {
        res.send("error in login :" + err);
      }
    });
   }
};




function validateUserLogin(userAuth) {
  const userValidSchema = Joi.object({
    username: Joi.string().min(4).max(150).required(),
    password: Joi.string().min(8).max(150).required(),
  });

  return userValidSchema.validate(userAuth);
}

function validateUser(userAuth) {
  const userValidSchema = Joi.object({
    fullName: Joi.string().min(5).required(),
    username: Joi.string().min(4).max(150).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(150).required(),
    department: Joi.string(),
  });

  return userValidSchema.validate(userAuth);
}

/*down ther auth with jwt me */

exports.loginUserJwtMe=async (req,res)=>{

  let username = "" + req.body.username.toLowerCase();
    let password = ""+req.body.password;
  
    let currntuser = {
      username: username,
      password: password,
    };
  
    let jioError = validateUserLogin(currntuser);
  
    if (jioError.error) {
      return res.redirect(
        "/login?errorMessge=" + jioError.error.details[0].message
      );
      //console.log("error in Jio");
    }


    const user=await UserAuth.findOne({username:currntuser.username});

    if(!user){
      return res.redirect("/login?errorMessge=" +"inavlid username")
    }

   console.log(currntuser.password);

    const validPass=await bcrypt.compare(currntuser.password,user.password);


    if(!validPass){ return res.redirect("/login?errorMessge=" +"inavlid password") }
    
    console.log(validPass);

    const token =jwt.sign({_id:user._id,username:user.username},process.env.TOKEN_SECRET);
    res.header("auth-token",token);
    res.redirect("/");
}

/*now for register  */

exports.registerNewUserJwtMe=async (req,res)=>{
  let currntuser = {
    fullName: req.body.fullName,
    email: req.body.email,
    username: req.body.username,
    password: ""+req.body.password,
    department: req.body.department,
  };
  let jioError = validateUser(currntuser);

  if (jioError.error) {
    return res.redirect(
      "/register?errorMessge=" + jioError.error.details[0].message
    );
    //console.log("error in Jio");
  } else {

    //check if user name is used
    const exsistUsername=await UserAuth.findOne({username:currntuser.username});

    if(exsistUsername){return res.redirect( "/register?errorMessge=" + "Username Alrady Used"
    )}

   

     //hash password
     let saltRound=10;
    const salt=await bcrypt.genSaltSync(saltRound);
    const hashedPassword=await bcrypt.hashSync(currntuser.password,salt);

   
    const user=new UserAuth({
      fullName: currntuser.fullName,
      email: currntuser.email,
      password:hashedPassword,
      username: currntuser.username,
      department: currntuser.department,
    });

    try {
      //user created sucsessfully
      const savedUser=await user.save();
     //console.log("new user added"+savedUser);

     const token =jwt.sign({_id:user._id,username:user.username},process.env.TOKEN_SECRET);

      //  "mainPage", { pageTitle: "IT.SOLVE | Main" }
      //  "loginPage", {
      //   pageTitle: "IT.SOLVE | Login",
      //   errorMessge: "",
      // }

      res.header("auth-token",token);
        
      return res.redirect("/");

      //return res.redirect("/login");
    } catch (error) {
     return res.redirect("/register?errorMessge=" + "there is some error in saving user");
    }
  }
}
