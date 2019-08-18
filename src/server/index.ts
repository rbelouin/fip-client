import _ from "lodash";
import qs from "querystring";
import path from "path";
import express from "express";
import expressWs from "express-ws";
import Bacon from "baconjs";

import config from "../../prod/js/config.json";
import { fetchRadios } from "../fip/radio-metadata";

const app = express();
expressWs(app);

const apiPrefix = "/api";
const publicFolder = process.env.PUBLIC_FOLDER || "";
const httpsOnly = process.env.HTTPS_ONLY === "1";

app.use(function(req, res, next) {
  const protocol =
    req.headers["x-forwarded-proto"] === "https" ? "https" : "http";

  if (httpsOnly && protocol !== "https") {
    res.redirect("https://" + req.headers["host"] + req.originalUrl);
  } else {
    next();
  }
});

_.each(config.routes, function(route, name) {
  app.get(route, function(req, res) {
    res.sendFile(path.resolve(publicFolder, "index.html"));
  });
});

app.use(express.static(publicFolder));

app.listen(config.port);
console.log("Server listening on port " + config.port + "…");

const p_radios = fetchRadios(2000, config.radios);
p_radios.onError(console.log);

(app as any).ws("/api/ws", function(ws: any, req: any) {
  const unsubscribe = p_radios.onValue(radios =>
    ws.send(JSON.stringify(radios))
  );

  ws.on("close", unsubscribe);
});
