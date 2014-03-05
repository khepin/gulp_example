var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('default', function(){
    return gulp.src('*.txt')
        .pipe(concat('full_text.txt'))
        .pipe(gulp.dest('build'));
});