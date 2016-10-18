var gulp   = require('gulp');
var gutil  = require('gulp-util');

gulp.task('default', function(callback) {
  gutil.log(gutil.colors.green('Hi from Gulp.'));
});
