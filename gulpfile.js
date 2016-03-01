var gulp = require('gulp'),
   uglify = require('gulp-uglify'),
   sass = require('gulp-sass'),
   cssnano = require('gulp-cssnano'),
   // rename = require('gulp-rename'),
   // concat = require('gulp-concat'),
   plumber = require('gulp-plumber');

gulp.task('scripts', function(){
   gulp.src('./frontend/*.js')
      .pipe(plumber())
      // .pipe(uglify())
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
   gulp.watch('./frontend/*', ['scripts','styles']);
});

gulp.task('default', ['watch']);
