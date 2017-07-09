import _ from "lodash";
import Bacon from "baconjs";

export function getPrint(SongController, p_token) {
  return p_token.flatMapLatest(token => {
    return !token ? Bacon.once(null) :
      SongController.getSpotifyPrint(token);
  }).toProperty();
}

export function getSyncs(SongController, p_print) {
  return p_print
    .flatMapLatest(print => SongController.getSyncs(print))
    .toProperty();
}

export function getFavSongs(SongController, p_syncs, favBus) {
  return p_syncs
    .flatMapLatest(syncs => {
      const stream = SongController.getFavSongsStream(syncs, favBus);
      return stream.toEventStream();
    })
    .toProperty();
}

export function getRadioState(SongController, p_favSongs, p_radioSongs) {
  const p_songs = Bacon.combineWith(
    SongController.mergeFavsAndSongs,
    p_radioSongs,
    p_favSongs
  );

  const p_pastSongs = p_songs.map(_.tail);

  const p_nowPlaying = p_songs
    .map(songs => _.isEmpty(songs) ? {type: "loading"} : _.head(songs))
    .flatMapError(data => {
      const code = data && data.error && data.error.code;

      return Bacon.once(code === 100 ? {
        type: "unknown"
      } : new Bacon.Error(data.error));
    })
    .toProperty();

  return {
    nowPlaying: p_nowPlaying,
    pastSongs: p_pastSongs
  };
}

export function getSongBeingPlayed(PlayController, p_radios, p_radio, playBus) {
  const p_cmds = p_radio
    .toEventStream()
    .first()
    .map(radio => ({type: "radio", radio: radio}))
    .merge(playBus)
    .toProperty();

  return PlayController.getSongBeingPlayed(p_radios, p_cmds);
}

export function saveFavoriteSongs(SongController, p_syncs, p_favSongs) {
  p_syncs.flatMapLatest(syncs => {
    return p_favSongs.flatMapLatest(songs => {
      return SongController.setFavoriteSongs(syncs, songs);
    });
  }).onValue();
}

export function saveAutoplayRadio(AutoplayController, autoplayBus) {
  autoplayBus.onValue(radio => AutoplayController.setAutoplayRadio(radio));
}

export function getState(TokenController, SongController, RouteController, PlayController, EventController, UIController, AutoplayController, history, eventUrl, favBus, syncBus, playBus, autoplayBus) {
  const p_token = TokenController.getTokenProperty(history, syncBus);
  const p_print = getPrint(SongController, p_token);
  const p_user = p_print.map(print => print && print.user);
  const p_syncs = getSyncs(SongController, p_print);
  const p_favSongs = getFavSongs(SongController, p_syncs, favBus);

  const songLists = SongController.getFipSongLists(p_token);
  const radioStates = _.mapValues(songLists, p_radioSongs => {
    return getRadioState(SongController, p_favSongs, p_radioSongs);
  });

  const p_radios = Bacon.combineTemplate(radioStates).skipDuplicates(_.isEqual);

  const routes = RouteController.getRoutes();
  const p_route = RouteController.getCurrentRoute(routes);

  const p_radio = PlayController.getCurrentRadio(routes.radio);

  // Song being broadcasted by the radio having the focus
  const p_bsong = PlayController.getBroadcastedSong(routes.radio, p_radios);

  // Song being played
  const p_psong = getSongBeingPlayed(PlayController, p_radios, p_radio, playBus);

  // Song history of the radio having the focus
  const p_history = PlayController.getSongHistory(routes.radio, p_radios);

  const p_src = PlayController.getCurrentSource(playBus);

  const p_loaded = UIController.getLoadProperty();
  const p_paneIsOpen = UIController.getPaneStatus(p_loaded);
  const p_playerOnBottom = UIController.getPlayerPosition();

  const p_autoplayRadio = autoplayBus.toProperty(AutoplayController.getAutoplayRadio());

  // Check for the load event immediately
  p_loaded.onValue();

  saveFavoriteSongs(SongController, p_syncs, p_favSongs);
  saveAutoplayRadio(AutoplayController, autoplayBus);

  RouteController.redirectRoute(routes, "home", "/radios/fip-radio");
  RouteController.redirectRoute(routes, "errors", "/");

  EventController.watchBrowseEvents(p_route).onValue(ev => {
    EventController.sendEvent(eventUrl, ev);
  });

  return {
    user: p_user,
    favSongs: p_favSongs,
    route: p_route,
    radio: p_radio,
    bsong: p_bsong,
    psong: p_psong,
    src: p_src,
    history: p_history,
    paneIsOpen: p_paneIsOpen,
    playerOnBottom: p_playerOnBottom,
    autoplayRadio: p_autoplayRadio
  };
}

export default (TokenController, SongController, RouteController, PlayController, EventController, UIController, AutoplayController) => ({
  getState: _.partial(getState, TokenController, SongController, RouteController, PlayController, EventController, UIController, AutoplayController)
});
