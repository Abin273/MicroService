const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const axios = require('axios')
const amqplib = require("amqplib");

const { APP_SECRET, MESSAGE_BROKER_URL, EXCHANGE_NAME } = require("../config");

//Utility functions
module.exports.GenerateSalt = async () => {
	return await bcrypt.genSalt();
};

module.exports.GeneratePassword = async (password, salt) => {
	return await bcrypt.hash(password, salt);
};

module.exports.ValidatePassword = async (
	enteredPassword,
	savedPassword,
	salt
) => {
	return (
		(await this.GeneratePassword(enteredPassword, salt)) === savedPassword
	);
};

module.exports.GenerateSignature = async (payload) => {
	try {
		return await jwt.sign(payload, APP_SECRET, { expiresIn: "30d" });
	} catch (error) {
		console.log(error);
		return error;
	}
};

module.exports.ValidateSignature = async (req) => {
	try {
		const signature = req.get("Authorization");
		console.log(signature);
		const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
		req.user = payload;
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};

module.exports.FormateData = (data) => {
	if (data) {
		return { data };
	} else {
		throw new Error("Data Not found!");
	}
};

// module.exports.PublishCustomerEvent= async(payload)=>{
//   await axios.post('http://localhost:8000/customer/app-events',{
//     payload
//   })
// }

// module.exports.PublishShoppingEvent= async(payload)=>{
//   await axios.post('http://localhost:8000/shopping/app-events',{
//     payload
//   })
// }

// ======== rabbitmq Message broker instead of eventbus ========

// create a channel
module.exports.CreateChannel = async () => {
	try {
		const connection = await amqplib.connect(MESSAGE_BROKER_URL);
		const channel = await connection.createChannel();
		// After successfully connecting, it creates an exchange named EXCHANGE_NAME with the type "direct."
		// This exchange will be used to route messages.
		await channel.assertExchange(EXCHANGE_NAME, "direct", false);
		// The channel object is returned, which can be used to publish and subscribe to messages
		return channel;
	} catch (error) {
		throw error;
	}
};

// publist message
// PublishMessage is an asynchronous function for publishing messages to the RabbitMQ exchange.
module.exports.PublishMessage = async (channel, bindingKey, message) => {
	try {
		// The function uses 'channel.publish' to send the message to the specified exchange with the given binding key
		await channel.publish(EXCHANGE_NAME, bindingKey, Buffer.from(message));
		console.log(`message send: ${message}`);
	} catch (error) {
		throw error;
	}
};

// subscribe message
module.exports.SubscribeMessage = async (channel, service, bindingKey) => {
	try {
		// It first uses channel.assertQueue to create or assert the existence of a queue named QUEUE_NAME.
		const appQueue = await channel.assertQueue(QUEUE_NAME);
		// Then, it binds the queue to the specified EXCHANGE_NAME using the provided bindingKey
		channel.bindQueue(appQueue.queue, EXCHANGE_NAME, bindingKey);
		// When a message arrives,it logs the received message content along with the service name and acknowledges the message using channel.ack.
		channel.consume(appQueue.queue, (msg) => {
			console.log(
				`Received in product service: ${msg.content.toString()}`
			);
			channel.ack(msg);
		});
	} catch (error) {
		throw error;
	}
};
