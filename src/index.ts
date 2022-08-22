import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import webpush from "web-push";
import { setAlerts, toggleAlertsActive } from "./controllers/alerts";
import { subscribe } from "./controllers/subscribe";
import { getUser, login } from "./controllers/user";
import * as database from "./database";
import monitorLiveEvents from "./services/monitorLiveEvents";

const app = express();

dotenv.config();

app.use(cors());
app.use(bodyParser.json());

database.connect();

webpush.setVapidDetails(
  process.env.WEB_PUSH_CONTACT!,
  process.env.PUBLIC_VAPID_KEY!,
  process.env.PRIVATE_VAPID_KEY!
);

app.get("/user/:username", getUser);
app.post("/login", login);
app.post("/notifications/subscribe", subscribe);
app.post("/set-alerts", setAlerts);
app.post("/toggle-alerts-active", toggleAlertsActive);

app.listen(9000, () => {
  console.log("Server listening in port 9000 ...");
  setInterval(monitorLiveEvents, 30 * 1000);
});
