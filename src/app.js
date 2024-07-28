import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import configViewEngine from "./configs/viewEngine.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import authController from "./controllers/authController.js";
import index from "./routes/web/index.js";
import api from "./routes/api/api.js";
import staticFile from "./configs/staticFile.js";
import { WebSocketServer } from "ws";
import Order from "./models/orderModel.js";
import Notification from "./models/notificationModel.js";
import formatDateTime from "./services/formatDateTime.js";

const app = express();
dotenv.config();

configViewEngine(app);
staticFile(app);
app.locals.formatDateTime = formatDateTime;

const connect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connect to MongoDB successful");
  } catch (error) {
    console.error("Connect to MongoDB fail: ", error.message);
  }
};
connect();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/v1", api);

app.get("/login", authController.getLoginPage);
app.post("/login", authController.postLogin);
app.get("/logout", authController.getLogout);
app.use("/", authMiddleware.requireAuthentication, index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const wss = new WebSocketServer({ port: 3001 });
const clients = new Map();
const users = new Map();

wss.on("listening", () => {
  console.log("WebSocket server started and listening on port 3001");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", function incoming(message) {
    const msgString =
      typeof message === "string" ? message : message.toString();

    if (msgString.startsWith("REGISTER:")) {
      const idCustomer = msgString.substring("REGISTER:".length);
      clients.set(idCustomer, ws);
      console.log(`Client registered with Customer ID: ${idCustomer}`);
    }

    if (msgString.startsWith("USER:")) {
      const idUser = msgString.substring("USER:".length);
      users.set(idUser, ws);
      console.log(`USER registered with Member ID: ${idUser}`);
    }
  });

  ws.on("close", () => {
    for (const [key, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(key);
      }
    }
    for (const [key, user] of users.entries()) {
      if (user === ws) {
        users.delete(key);
      }
    }
    console.log("Client disconnected");
  });
});

Order.watch().on("change", async (change) => {
  let changedOrder;
  if (change.operationType === "insert") {
    changedOrder = change.fullDocument;
  } else {
    changedOrder = await Order.findById(change.documentKey._id).lean();
  }
  const idCustomer = changedOrder.idCustomer;
  const orderData = JSON.stringify({ type: 'order', data: changedOrder });

  if (clients.has(idCustomer)) {
    const client = clients.get(idCustomer);
    if (client.readyState === WebSocket.OPEN) {
      client.send(orderData);
    }
  }

  for (const client of users.values()) {
    if (client.readyState === WebSocket.OPEN) {
      const changeNotification = 1;
      client.send(changeNotification);
    }
  }
});

Notification.watch().on("change", async(change) => {
  let idCustomer;
  if (change.operationType === "insert") {
    idCustomer = change.fullDocument.idCustomer;
  }

  const notificationData = JSON.stringify({ type: 'notification', data: change.fullDocument });

  if(clients.has(idCustomer)){
    const client = clients.get(idCustomer);
    if(client.readyState === WebSocket.OPEN){
      client.send(notificationData);
    }
  }
});

export default app;
