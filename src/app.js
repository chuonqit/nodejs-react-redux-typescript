import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";
import yaml from "yamljs";
import SocketIO from "socket.io";
import Notification from "./models/Notification";

import authRoute from "./routes/authRoute";
import userRoute from "./routes/userRoute";
import productRoute from "./routes/productRoute";
import categoryRoute from "./routes/categoryRoute";
import brandRoute from "./routes/brandRoute";
import configurationRoute from "./routes/configurationRoute";
import productVariantRoute from "./routes/productVariantRoute";
import orderRoute from "./routes/orderRoute";
import sliderRoute from "./routes/sliderRoute";

const app = express();

// middlewares
app.use(morgan("tiny"));
app.use(express.json({ limit: "50mb" }));
dotenv.config({ path: __dirname + "/configs/settings.env" });
const swaggerJSDocs = yaml.load(__dirname + "/configs/api.yaml");

app.use(function (request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// app.use(express.urlencoded({ limit: "50mb" }));
app.use(cors());

// cloudinary config
cloudinary.config({
    cloud_name: "lavana",
    api_key: "742189537939194",
    api_secret: "-s8kHVYptjhA-F3I7KyNFKZVswE",
});
// mongodb connect
mongoose
    .connect(process.env.MONGODB_ONLINE)
    .then(() => console.log("MONGODB connected successfully"))
    .catch((error) => console.log(error));

// router
app.use("/api/swagger", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));
app.use("/api", authRoute);
app.use("/api", userRoute);
app.use("/api", productRoute);
app.use("/api", categoryRoute);
app.use("/api", brandRoute);
app.use("/api", configurationRoute);
app.use("/api", productVariantRoute);
app.use("/api", orderRoute);
app.use("/api", sliderRoute);

app.get("/api/notifications", async (req, res) => {
    const notifications = await Notification.find({}).limit(10).sort({ createdAt: -1 }).exec();
    res.status(200).json(notifications);
});

const insertNotification = async (message) => {
    const notification = await new Notification({
        message: message,
    }).save();
    return notification;
};

// server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT);
});

io = SocketIO.listen(server);

const io = SocketIO(server, {
    cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
    },
});

io.on("connection", (socket) => {
    socket.on("add-notification-client", async function (message) {
        const result = await insertNotification(message);
        io.emit("add-notification-server", result);
    });
    socket.on("disconnect", () => {});
});
