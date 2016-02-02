/// <reference path="src/typings/tsd.d.ts" />
import * as gulp     from "gulp";
import * as tsc      from "gulp-typescript";
import * as jade     from "gulp-jade";
import * as sass     from "gulp-sass";
import * as exec     from "child_process";
import * as plumber  from "gulp-plumber";
import * as fonts    from "node-font-awesome";
import * as packager from "electron-packager";
import * as runsync  from "run-sequence";
import * as del      from "del";

let gulp_destdir  = 'dest';
let build_workdir = '.work';
let build_destdir = 'build';

let src_typescript = 'src/**/*.ts';
let src_jade       = 'src/**/*.jade';
let src_scss       = 'src/**/*.scss';

gulp.task('typescript', () => {
    let tsconfig = require('./tsconfig.json');
    return gulp.src(src_typescript)
               .pipe(plumber())
               .pipe(tsc(tsconfig.compilerOptions))
               .pipe(gulp.dest(gulp_destdir));
});
gulp.task('watch-typescript', () => {
    return gulp.watch(src_typescript, ['typescript']);
});

gulp.task('jade', () => {
    return gulp.src(src_jade)
               .pipe(plumber())
               .pipe(jade({pretty: true}))
               .pipe(gulp.dest(gulp_destdir));
});
gulp.task('watch-jade', () => {
    return gulp.watch(src_jade, ['jade']);
});

gulp.task('scss', () => {
    return gulp.src(src_scss)
               .pipe(plumber())
               .pipe(sass())
               .pipe(gulp.dest(gulp_destdir));
});
gulp.task('watch-scss', () => {
    return gulp.watch(src_scss, ['scss']);
});

gulp.task('fonts', () => {
   return gulp.src([fonts.fonts, fonts.css])
              .pipe(gulp.dest(gulp_destdir + '/fonts'));
});

gulp.task('gulp-config', () => {
    let tsconfig = require('./tsconfig.json');
    return gulp.src('gulpfile.ts')
               .pipe(tsc(tsconfig.compilerOptions))
               .pipe(gulp.dest('.'));
});

gulp.task('run', () => {
    exec.exec('electron .');
});

gulp.task('build-clean-workdir', del.bind(null, build_workdir));
gulp.task('build-clean-destdir', del.bind(null, build_destdir));
gulp.task('build-copy-dest', () => {
    return gulp.src(gulp_destdir + '/**', {base: gulp_destdir})
               .pipe(gulp.dest(build_workdir + '/' + gulp_destdir));
});
gulp.task('build-copy-json', () => {
    return gulp.src('package.json').pipe(gulp.dest(build_workdir));
});
gulp.task('build-npm-install', (callback) => {
    exec.exec('npm install --production', {cwd: './' + build_workdir}, callback);
});
gulp.task('build-package', (callback) => {
    let config = require('./package.json');
    packager({
        dir:       build_workdir,
        name:      config.name,
        platform:  'win32',
        arch:      'x64',
        version:   '0.36.1',
        asar:      true,
        out:       build_destdir,
        overwrite: true
    }, (err, path) => {
        if (err) {
            console.log(err);
        }
        callback();
    });
});

gulp.task('build', (callback) => {
    runsync(
        'default',
        'build-clean-workdir',
        'build-clean-destdir',
        'build-copy-dest',
        'build-copy-json',
        'build-npm-install',
        'build-package',
        'build-clean-workdir',
        callback
    );
});

gulp.task('default', ['typescript', 'jade', 'scss', 'fonts']);
gulp.task('watch', ['watch-typescript', 'watch-jade', 'watch-scss']);
