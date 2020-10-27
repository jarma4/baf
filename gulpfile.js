var gulp = require('gulp'),
   nodemon = require('gulp-nodemon'),
	terser = require('gulp-terser'),
   sass = require('gulp-sass'),
   cssnano = require('gulp-cssnano'),
   // rename = require('gulp-rename'),
   concat = require('gulp-concat'),
   plumber = require('gulp-plumber');

function jsTask(){
   return gulp.src('frontend/*.js')
      .pipe(plumber())
      .pipe(concat('bundle.js'))
		.pipe(terser())
      .pipe(gulp.dest('public/js'));
}

function sassTask(){
   return gulp.src('frontend/*.scss')
      .pipe(plumber())
      .pipe(sass())
      .pipe(cssnano())
      .pipe(gulp.dest('public/css'));
};

function watch1Task(){
   gulp.watch('frontend/*.js',jsTask);
}

function watch2Task(){
   gulp.watch('frontend/*.scss', sassTask);
}

function startTask() {
   return nodemon({
      script: 'app.js',
      ext: 'js',
      ignore: ['frontend/*', 'public/*', 'json/*'],
      env: { 'NODE_ENV': 'development' }
   });
}

exports.default = gulp.parallel(startTask, watch1Task, watch2Task);