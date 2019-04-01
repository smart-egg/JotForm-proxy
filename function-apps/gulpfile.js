const gulp = require('gulp');
const clean = require('gulp-clean');
const zip = require('gulp-zip');

let functionApp = 'jf-question-id'

gulp.task('clean', () => {
    return gulp.src([
        `./${functionApp}/node_modules`,
        `./${functionApp}/.vscode`], { read: false })
        .pipe(clean());
});

gulp.task('copy', () => {
    return gulp.src('./package.json')
        .pipe(gulp.dest(`./${functionApp}/`));
});

gulp.task('pack', ['copy', 'clean'], () => {
    return gulp.src([`./${functionApp}/**/*`], { dot: true })
        .pipe(zip(`${functionApp}.zip`))
        .pipe(gulp.dest('./dist'));
});