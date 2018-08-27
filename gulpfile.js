const gulp = require('gulp');
const gutil = require('gulp-util');
const webpack = require('webpack');
const hash = require('gulp-hash');
const minifyCSS = require('gulp-csso');
const del = require('del');
const zip = require('gulp-zip');
const add = require('gulp-add');
const os = require('os');
const machineName = os.hostname().toUpperCase();
const path = require('path');
const runSequence = require('run-sequence');
const htmlreplace = require('gulp-html-replace');
const rename = require('gulp-rename');

let hashedJS;
let hashedCSS;

gulp.task('resolve-html', function () {
    return gulp.src('dist/*.html')
        .pipe(htmlreplace({
            'css': '/' + hashedCSS,
            'js': '/' + hashedJS
        }))
        .pipe(gulp.dest('dist/'));
});


gulp.task('minifyCSS', function () {
    return gulp.src('dist/*.css')
        .pipe(hash())
        .pipe(rename(function (path) {
            path.basename += "-min";
            hashedCSS = path.basename + '.css';
            console.log("hashedCSS = " + hashedCSS);
        }))
        .pipe(gutil.env.type === 'production' ? minifyCSS() : gutil.noop())
        .pipe(gulp.dest('dist/'));
});

gulp.task('uglifyJS', function () {
    return gulp.src('dist/*.js')
        .pipe(hash())
        .pipe(rename(function (path) {
            path.basename += "-min";
            hashedJS = path.basename + '.js';
            console.log("hashedJS = " + hashedJS);
        }))
        .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
        .pipe(gulp.dest('dist/'));
});

gulp.task('build', function (callback) {
    var config = require('./webpack.production.config');
    webpack(config, function (err, stats) {
        if (err) {
            gutil.log(gutil.colors.red(err));
        }
        gutil.log("[webpack]", stats.toString(config.stats));
        callback();
    });
});

gulp.task('clean', function () {
    return del([
        'dist/**/*'
    ]);
});

gulp.task('default', ['build-package'], function() {
    const publishDir = path.resolve(__dirname, 'dist');

    console.log('Start publish: ' + publishDir);
    console.log('Machine name: ' + machineName);
    console.log(path.join(publishDir, '/**/*'));

    return gulp.src([path.join(publishDir, '/**/*')])
        .pipe(add('./version.txt', new Date().toString()))
        .pipe(zip('package.zip'))
        .pipe(gulp.dest(publishDir));
});

gulp.task('build-package', function(done) {
    runSequence('clean', 'build', 'uglifyJS', 'minifyCSS', 'resolve-html', done);
});

