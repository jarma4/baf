var gulp = require('gulp'),
   uglify = require('gulp-uglify');

gulp.task('scripts', function(){
   gulp.src('./models/baf.js').pipe(uglify()).pipe(gulp.dest('./public/js'));
});

gulp.task('watch', function(){
   gulp.watch('./models/baf.js', ['scripts']);
});

gulp.task('default', ['watch']);
