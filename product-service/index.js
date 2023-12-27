const express = require("express");
const { default: mongoose, mquery } = require("mongoose");
// const Product = require("./product");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenticated");
const Product = require("./Product");



var channel, connection


const app = express();
const PORT = process.env.PORT_ONE || 7072;

app.use(express.json());

const connectToMongoDB = async () => {

	await mongoose.connect("mongodb://localhost/product-service", {
		useNewUrlParser : true, 
		useUnifiedTopology : true, 
	});

	console.log("Product-Service DB connection Successfull.");
}

connectToMongoDB();



// here is the function to connect with the rabbit mq 
// for this to work we have to make sure that we are running rabbitmq using docker and concepts of containers 
const connectAmqpServer = async () => {
	const amqpServer = "amqp://localhost:5672";
	// amqp.connect() 
	connection = await amqp.connect(amqpServer);
	channel = await connection.createChannel();
	await channel.assertQueue("PRODUCT");

}


connectAmqpServer();



// creating the routes for the following actions for this purpose 
// create a new product 
app.post("/product/create", isAuthenticated, (req, res) => {
	const {name, description, price} = req.body;

	const newProduct = new Product ({
		name, 
		description, 
		price, 
	});

	newProduct.save();
	return res.json(newProduct);
})



app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });

	// sending this to  ORDER queue 
    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
            })
        )
    );
		
		
	let order;

    channel.consume("PRODUCT", (data) => {
		console.log("CONSUMING THE PRODUCTS QUEUE\n", data.content);
        order = JSON.parse(data.content);
		console.log("the value of order is ", order);
		channel.ack(data);
		return res.json(order);
    });
	// console.log("the value of order outside is \n", order);
});


// here we  will be listening the server on this purpose 
app.listen(PORT, () => {
	console.log(`Auth-service started at ${PORT}`);
});
