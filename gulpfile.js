var gulp = require("gulp");
var tsc = require("gulp-typescript");
var jade = require("gulp-jade");
var sass = require("gulp-sass");
var exec = require("child_process");
var plumber = require("gulp-plumber");
var fonts = require("node-font-awesome");
var packager = require("electron-packager");
var runsync = require("run-sequence");
var del = require("del");
var gulp_destdir = 'dest';
var build_workdir = '.work';
var build_destdir = 'build';
var src_typescript = 'src/**/*.ts';
var src_jade = 'src/**/*.jade';
var src_scss = 'src/**/*.scss';
gulp.task('typescript', function () {
    var tsconfig = require('./tsconfig.json');
    return gulp.src(src_typescript)
        .pipe(plumber())
        .pipe(tsc(tsconfig.compilerOptions))
        .pipe(gulp.dest(gulp_destdir));
});
gulp.task('watch-typescript', function () {
    return gulp.watch(src_typescript, ['typescript']);
});
gulp.task('jade', function () {
    return gulp.src(src_jade)
        .pipe(plumber())
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest(gulp_destdir));
});
gulp.task('watch-jade', function () {
    return gulp.watch(src_jade, ['jade']);
});
gulp.task('scss', function () {
    return gulp.src(src_scss)
        .pipe(plumber())
        .pipe(sass())
        .pipe(gulp.dest(gulp_destdir));
});
gulp.task('watch-scss', function () {
    return gulp.watch(src_scss, ['scss']);
});
gulp.task('fonts', function () {
    return gulp.src([fonts.fonts, fonts.css])
        .pipe(gulp.dest(gulp_destdir + '/fonts'));
});
gulp.task('gulp-config', function () {
    var tsconfig = require('./tsconfig.json');
    return gulp.src('gulpfile.ts')
        .pipe(tsc(tsconfig.compilerOptions))
        .pipe(gulp.dest('.'));
});
gulp.task('run', function () {
    exec.exec('electron .');
});
gulp.task('build-clean-workdir', del.bind(null, build_workdir));
gulp.task('build-clean-destdir', del.bind(null, build_destdir));
gulp.task('build-copy-dest', function () {
    return gulp.src(gulp_destdir + '/**', { base: gulp_destdir })
        .pipe(gulp.dest(build_workdir + '/' + gulp_destdir));
});
gulp.task('build-copy-json', function () {
    return gulp.src('package.json').pipe(gulp.dest(build_workdir));
});
gulp.task('build-npm-install', function (callback) {
    exec.exec('npm install --production', { cwd: './' + build_workdir }, callback);
});
gulp.task('build-package', function (callback) {
    var config = require('./package.json');
    packager({
        dir: build_workdir,
        name: config.name,
        platform: 'win32',
        arch: 'x64',
        version: '0.36.1',
        asar: true,
        out: build_destdir,
        overwrite: true
    }, function (err, path) {
        if (err) {
            console.log(err);
        }
        callback();
    });
});
gulp.task('build', function (callback) {
    runsync('default', 'build-clean-workdir', 'build-clean-destdir', 'build-copy-dest', 'build-copy-json', 'build-npm-install', 'build-package', 'build-clean-workdir', callback);
});
gulp.task('default', ['typescript', 'jade', 'scss', 'fonts']);
gulp.task('watch', ['watch-typescript', 'watch-jade', 'watch-scss']);
