// require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const token = req.header("auth-token");
  //httponly cookie
  if (!token) {
    return res.redirect("/login?errorMessage=Login Again no token");
  }

  try {
      const verfied=jwt.verify(token,process.env.TOKEN_SECRET);
      req.user=verfied;
      console.log("user authnticated req is"+req.user);
      next();
      
  } catch (error) {
      //invaled token
    return res.redirect("/login?errorMessage=Login Again invalid token");

  }
};
