module.exports = async(req,res,next)=>{
    if(req.isAuthenticated()){
      next();
    }
    else{
        return res.redirect("/login?nextRedirect="+req.url);
    }
};