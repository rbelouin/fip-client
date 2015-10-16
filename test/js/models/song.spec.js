var test = require("tape");
var _ = require("lodash");
var Bacon = require("baconjs");
var SongModel = require("../../../src/js/models/song.js");

var SONG_DURATION = 1000;

var songs = require("../data.js").songs;
var favorites = require("../data.js").favorites;

var withMock = function(test) {
  return function(t) {
    var fetchCurrent = SongModel.fetchCurrent;
    var isFavorite = SongModel.isFavorite;

    var p_song = Bacon.sequentially(SONG_DURATION, songs).toProperty();
    p_song.onValue();

    SongModel.fetchCurrent = function(url) {
      return p_song.take(1);
    };

    SongModel.isFavorite = function(song) {
      return _.contains(favorites, song.id);
    };

    test(t);
  };
};

test("SongModel.fetch fetches songs correctly", withMock(function(t) {
  var p_songs = SongModel.fetch("url", SONG_DURATION / 10)
    .takeUntil(Bacon.later((songs.length + 1) * SONG_DURATION))
    .last();

  p_songs.onValue(function(ss) {
    t.deepEqual(ss.reverse(), _.map(songs, function(song) {
      return _.extend({}, song, {
        favorite: SongModel.isFavorite(song)
      });
    }));
    t.end();
  });
}));
