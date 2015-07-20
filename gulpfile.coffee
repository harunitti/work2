gulp        = require "gulp"
sourcemaps  = require "gulp-sourcemaps"
uglify      = require "gulp-uglify"
concat      = require "gulp-concat"
minifyCSS   = require "gulp-minify-css"
del         = require "del"

gulp.task "default", ->
  del(["public/js/*"])

  gulp.src ["src/js/lib/jquery*.js",
            "src/js/lib/bootstrap.min.js",
            "src/js/lib/flat-ui.min.js",
            "src/js/map/tooltip.js"
            "src/js/map/map_config.js"
            "src/js/map/map.js"
    ]
    .pipe concat "app.js"
    .pipe uglify()
    .pipe gulp.dest "public/js"

  gulp.src ["src/js/lib/jquery*.js",
            "src/js/lib/bootstrap.min.js",
            "src/js/tool/tool_config.js"
            "src/js/tool/tool.js"
    ]
    .pipe concat "tool.js"
    .pipe uglify()
    .pipe gulp.dest "public/js"

  gulp.src ["src/css/*.css"]
    .pipe concat "app.css"
    .pipe minifyCSS()
    .pipe gulp.dest "public/css"


gulp.task "watch" , ->
  gulp.watch "src/**/*.js", ["default"]

