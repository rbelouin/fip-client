var gulp = require("gulp");
var source = require("vinyl-source-stream");
var less = require("gulp-less");
var env = require("common-env")();

gulp.task("configuration", function() {
  var defaults = require("./package.json").common_env;
  var config = env.getOrElseAll(defaults);

  var src = source("config.json");
  src.end(JSON.stringify(config));

  return src.pipe(gulp.dest("./prod/js"));
});

gulp.task("copy", function() {
  gulp.src([
    "./node_modules/bootstrap/fonts/glyphicons-halflings-regular.*",
    "./node_modules/font-awesome/fonts/*",
    "./src/fonts/*"
  ])
    .pipe(gulp.dest("./prod/public/fonts"));

  gulp.src("./src/img/icon.png")
    .pipe(gulp.dest("./prod/public/img/"));

  gulp.src("./src/html/index.html")
    .pipe(gulp.dest("./prod/public"));
});

gulp.task("less", function() {
  return gulp.src("./src/less/all.less")
    .pipe(less({
      paths: [
        "./node_modules/bootstrap/less/",
        "./node_modules/font-awesome/less/"
      ]
    }))
    .pipe(gulp.dest("./prod/public/css"));
});

gulp.task("build", ["configuration", "copy", "less"]);
