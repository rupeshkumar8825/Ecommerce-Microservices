const express = require("express");
const { default: mongoose } = require("mongoose");
const User = require("./user");
const jwt = require("jsonwebtoken");


const app = express();
const PORT = process.env.PORT_ONE || 7071;


const connectToMongoDB = async () => {

	await mongoose.connect("mongodb://localhost/auth-service", {
		useNewUrlParser : true, 
		useUnifiedTopology : true, 
	});

	console.log("Auth-service DB connection Successfull.");
}

connectToMongoDB();

//using the middleware here for this purpose 
//using the first middleware just to read the request body in the json format for this purpose
app.use(express.json());



// route for register 
app.post("/auth/register", async (request, response) => {
	const {email, password, name} = request.body;

	const userExists = await User.findOne({email : email});

	if(userExists)
	{
		response.json({message : "User Already Exists."});
		return;
	}
	else 
	{
		const newUser = new User({
			name, 
			email, 
			password, 
		});

		newUser.save();
		return response.json(newUser);
	}


});


// route for login 
app.post("/auth/login", async (request, response) => {
	const {email, password } = request.body;

	const user = await User.findOne({email : email});

	if(!user)
	{
		return response.json({message : "User does not exist."});
	}

	// otherwise we have to check whether the user has enetered correct password or not 
	if(password !== user.password)
	{
		return response.json({message : "Password Incorrect."});
	}

	// otherwise make the payload to be sent to the client for this purpose 
	const payload = {
		email,
		name : user.name
	};

	const options = {
		expiresIn : "1h"
	};

	// signing a new token 
	// const token = jwt.sign(payload, "secret", options);
	const token = jwt.sign(payload, "some secret key", {
		expiresIn: 6000,

	});
	// this.tokens = await this.tokens.concat({token : token});

	console.log("the token value is as follows \n", token);
	return response.json({token : token});
});


// here we  will be listening the server on this purpose 
app.listen(PORT, () => {
	console.log(`Auth-service started at ${PORT}`);
});
