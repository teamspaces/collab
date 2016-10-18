var gulp   = require('gulp');
var spawn = require('child_process').spawn
var watch  = require('gulp-watch')

var node;

gulp.task('default', function(callback) {
  gulp.start('server');
  watch('./server.js', { usePolling: true, interval: 100 }, function() { gulp.start('server'); });
});

gulp.task('server', function(callback) {
  if (node) node.kill()
  node = spawn('node', ['server.js'], { stdio: 'inherit' })
  node.on('close', function (code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
});

process.on('exit', function() {
  if (node) node.kill()
})

// TODO: Move this into a file of it's own and include it?
// Ctrl + C won't work otherwise..
process.on('SIGINT', function() {
  setTimeout(function() {
    process.exit(1);
  }, 100);
});
