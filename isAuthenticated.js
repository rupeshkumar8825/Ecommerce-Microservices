// middleware to check the authentication of the token/user whether this is valid or not 
const jwt = require("jsonwebtoken");


module.exports = async function isAuthenticated (req, res, next){
    const token = req.headers["authorization"].split(" ")[1];
    jwt.verify(token, "some secret key", (err, user) => {
        if(err){
            return res.json({message : err});
        }else {
            req.user = user;
            next();
        }
    });

    // say everything went fine 
}