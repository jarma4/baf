var gulp = require('gulp'),
   nodemon = require('gulp-nodemon'),
   uglify = require('gulp-uglify'),
   sass = require('gulp-sass'),
   cssnano = require('gulp-cssnano'),
   // rename = require('gulp-rename'),
   concat = require('gulp-concat'),
   plumber = require('gulp-plumber');

gulp.task('scripts', function(){
   gulp.src('./frontend/*.js')
      .pipe(plumber())
      .pipe(concat('bundle.js'))
//      .pipe(uglify())
      .pipe(gulp.dest('./public/js'));
});

gulp.task('styles', function(){
   gulp.src('./frontend/*.scss')
      .pipe(plumber())
      .pipe(sass())
      .pipe(cssnano())
      .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', function(){
   gulp.watch('./frontend/*.js', ['scripts']);
   gulp.watch('./frontend/*.scss', ['styles']);
});

gulp.task('start', function () {
   nodemon({
      script: 'app.js',
      ext: 'js',
      ignore: ['frontend/*', 'public/*'],
      env: { 'NODE_ENV': 'development' }
   });
});

gulp.task('default', ['start', 'watch']);
