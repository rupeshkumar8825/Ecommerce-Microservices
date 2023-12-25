// this is the user model 
const mongoose = require("mongoose");
let Schema = mongoose.Schema;

// defining the schema for the user here for this purpose
let userSchema = new Schema ({
    name : String, 
    email : String, 
    password : String, 
    created_at : {
        type : Date, 
        default : Date.now()
    }    
});


let User = mongoose.model("users", userSchema);


module.exports = User;
