import React from "react";
import { render } from "react-dom";
import { IntlProvider } from "react-intl";

import Promise from "promise";
window.Promise = Promise as any;

import Bacon from "baconjs";

// Sadly, bacon-routes does mutate the Bacon object
window.Bacon = Bacon;
require("bacon-routes"); // eslint-disable-line no-undef

import {
  DispatchContext,
  Dispatcher,
  Events,
  SyncEvent,
  FavEvent,
  PlayEvent
} from "../events";
import Intl from "./models/intl.js";

import getHttp from "./models/http.js";
import getWebSocket from "./models/websocket.js";
import getStorage from "./models/storage.js";
import getSpotify from "./models/spotify.js";
import getFip from "./models/fip.js";
import getTokenController from "./controllers/token.js";
import getSongController from "./controllers/song.js";
import getPlayController from "./controllers/play.js";
import getRouteController from "./controllers/route.js";
import getStateController from "./controllers/state.js";
import * as SpotifyClient from "../spotify/client";

import App from "../components/app";

export function start(conf) {
  const syncBus = new Bacon.Bus<any, SyncEvent>();
  const favBus = new Bacon.Bus<any, FavEvent>();
  const playBus = new Bacon.Bus<any, PlayEvent>();

  const intl = Intl.getIntlData(conf.DefaultLanguage);

  /* Bind the unsafe dependencies to the models */
  const Http = getHttp(fetch);
  const WS = getWebSocket(WebSocket, location);
  const Storage = getStorage(localStorage);
  const Spotify = getSpotify(Http, location);
  const Fip = getFip(WS);

  /* Bind the models to the controllers */
  const TokenController = getTokenController(Storage, Spotify, location);
  const SongController = getSongController(
    Storage,
    Spotify,
    Fip,
    conf.api.ws_path,
    conf.radios.map(r => r.id)
  );
  const PlayController = getPlayController(conf.radios);
  const RouteController = getRouteController(Bacon, conf.routes);

  /* Use all the controllers to build a state we will forward to the App component */
  const StateController = getStateController(
    TokenController,
    SongController,
    RouteController,
    PlayController
  );

  const state = StateController.getState(
    Bacon.history,
    favBus,
    syncBus,
    playBus
  );

  state.route.onValue(function() {
    ga("set", "page", window.location.pathname);
    ga("send", "pageview");
  });

  const dispatch: Dispatcher = (name, data) => {
    switch (name) {
      case "play":
        return playBus.push(data as Events["play"]);
      case "fav":
        return favBus.push(data as Events["fav"]);
      case "sync":
        return syncBus.push(data as Events["sync"]);
    }
  };

  render(
    <IntlProvider locale={intl.locales} messages={intl.messages}>
      <DispatchContext.Provider value={dispatch}>
        <App
          email={conf.email}
          github={conf.github}
          radios={conf.radios}
          stateStreams={state}
        />
      </DispatchContext.Provider>
    </IntlProvider>,
    document.querySelector("#app")
  );

  RouteController.browseTo(window.location.pathname + window.location.search);
  SpotifyClient.initializePlayer();
}
