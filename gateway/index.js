const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy"); //it will redirect the request based on the end points

const app = express();

app.use(cors());
app.use(express.json());

app.use("/customer", proxy("http://localhost:8001/"));
app.use("/shopping", proxy("http://localhost:8003/"));
app.use("/", proxy("http://localhost:8002/"));  //products

app.listen(8000, () => {
	console.log("gateway is listening on port 8000");
});
