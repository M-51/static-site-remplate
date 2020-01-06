const gulp = require('gulp');
const rollup = require('rollup');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const postCSS = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const terser = require('gulp-terser');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const brotli = require('gulp-brotli');
const gzip = require('gulp-gzip');

function sassDev() {
    return gulp.src('./src/scss/index.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postCSS([autoprefixer()]))
        .pipe(rename('style.min.css'))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest('./static/css/'));
}

async function rollupDev() {
    const bund = await rollup.rollup({
        input: './src/js/index.js',
    });

    await bund.write({
        file: './static/js/scripts.min.js',
        format: 'iife',
        sourcemap: true,
    });
}

gulp.task('watch', () => {
    gulp.watch('./src/scss/**/*.scss', sassDev);
    gulp.watch('./src/js/**/*.js', rollupDev);
});

function clearBuild() {
    return del([
        './build/',
    ]);
}

function copyHtml() {
    return gulp.src('./html/**/*')
        .pipe(gulp.dest('./build/html/'));
}

function copyStatic() {
    return gulp.src(['./static/**/*', '!./static/css/**/*', '!./static/js/**/*'])
        .pipe(gulp.dest('./build/static/'));
}

function copyDocker() {
    return gulp.src('./docker/production/**/*')
        .pipe(gulp.dest('./build/docker/'));
}

function sassProduction() {
    return gulp.src('./src/scss/index.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postCSS([
            autoprefixer(),
        ]))
        .pipe(postCSS([
            cssnano(),
        ]))
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('./build/static/css/'));
}

async function rollupProduction() {
    const bund = await rollup.rollup({
        input: './src/js/index.js',
    });

    await bund.write({
        file: './build/temp/scripts.js',
        format: 'iife',
    });
}

function minifyJsProduction() {
    return gulp.src('./build/temp/scripts.js')
        .pipe(terser())
        .pipe(rename('scripts.min.js'))
        .pipe(gulp.dest('./build/static/js/'));
}

function revProduction() {
    return gulp.src(['./build/static/css/*.css', './build/static/js/*.js'], { base: './build/static' })
        .pipe(rev())
        .pipe(gulp.dest('./build/static/'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./build/temp/'));
}

function rewriteProduction() {
    const manifest = gulp.src('./build/temp/rev-manifest.json');

    return gulp.src('./build/html/**/*.html')
        .pipe(revRewrite({ manifest }))
        .pipe(gulp.dest('./build/html/'));
}

function cleanLeftovers() {
    return del([
        './build/static/css/style.min.css',
        './build/static/js/scripts.min.js',
        './build/temp',
    ]);
}

function brotliProduction() {
    return gulp.src('./build/**/*.{js,css,svg,html}')
        .pipe(brotli.compress({
            quality: 11,
        }))
        .pipe(gulp.dest('./build/'));
}
function gzipProduction() {
    return gulp.src('./build/**/*.{js,css,svg,html}')
        .pipe(gzip({ gzipOptions: { level: 9 } }))
        .pipe(gulp.dest('./build/'));
}


gulp.task('build', gulp.series(
    clearBuild,
    gulp.parallel(copyHtml, copyStatic, copyDocker),
    gulp.parallel(sassProduction, gulp.series(rollupProduction, minifyJsProduction)),
    revProduction,
    rewriteProduction,
    cleanLeftovers,
    gulp.parallel(brotliProduction, gzipProduction),
));
