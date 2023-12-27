const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 9090;
const mongoose = require("mongoose");
const Order = require("./Order");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenticated");

var channel, connection;

const connectToMongoDB = async () => {

	await mongoose.connect("mongodb://localhost/order-service", {
		useNewUrlParser : true, 
		useUnifiedTopology : true, 
	});

	console.log("Order-Service DB connection Successfull.");
}

connectToMongoDB();

app.use(express.json());

function createOrder(products, userEmail) {
    let total = 0;
    for (let t = 0; t < products.length; ++t) {
        total += products[t].price;
    }

    // here now creating the new order after finding the total price for this purpose
    const newOrder = new Order({
        products,
        user: userEmail,
        total_price: total,
    });

    // saving the order 
    newOrder.save();
    return newOrder;
}


// here we are connecting to the amqpServer using the connect method 
// and then we are creating the ORDER queue also if it already does not exists. 
async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");
}



// on connection we have to look for the queue whether there is something on the queue or not for this purpose 
connect().then(() => {
    channel.consume("ORDER", (data) => {
        console.log("Consuming ORDER service");
        const { products, userEmail } = JSON.parse(data.content);
        const newOrder = createOrder(products, userEmail);
        console.log("teh vallue of new order is \n", newOrder);
        channel.ack(data);
        channel.sendToQueue(
            "PRODUCT",
            Buffer.from(JSON.stringify(newOrder))
        );
    });


});

app.listen(PORT, () => {
    console.log(`Order-Service at ${PORT}`);
});