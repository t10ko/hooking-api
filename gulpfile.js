'use strict';
 
var gulp = require( 'gulp' ), 
	gzip = require( 'gulp-gzip' ), 
	uglify = require( 'gulp-uglify' ), 
	rename = require( 'gulp-rename' ),
	fs = require('fs'),
	moment = require('moment'),
	pkg = require('./package.json'),
	header = require('gulp-header'),

	folder = 'src/', 
	file = folder + 'for-web', 
	filename = file + '.js', 
	min_filename = file + '.min.js', 

	uglify_settings = {
		fromString: true, 
		mangle: {
			sort:     true, 
			toplevel: true, 
			eval:     true
		},
		compress: {
			screw_ie8:    true, 
			properties:   true, 
			unsafe:       true, 
			sequences:    true, 
			dead_code:    true, 
			conditionals: true, 
			booleans:     true, 
			unused:       true, 
			if_return:    true, 
			join_vars:    true, 
			drop_console: true, 
			comparisons:  true, 
			loops:        true, 
			cascade:      true, 
			warnings:     true, 
			negate_iife:  true, 
			pure_getters: true
		}
	};

gulp.task( 'minify', function () {
	gulp.src( filename )
		.pipe( uglify( uglify_settings ) )
		.pipe( rename( min_filename ) )
		.pipe( gulp.dest( './' ) )
} );
gulp.task( 'gzipify', function () {
	gulp.src( min_filename )
		.pipe( gzip() )
		.pipe( gulp.dest( folder ) )
} );
gulp.task('addheaders', function() {
	var file = fs.readFileSync( min_filename ).toString();
	file = file.replace(/^\/\*(.|\n)+\*\//, '');
	fs.writeFileSync( min_filename, file );

	var year = moment().format('YYYY'), 
		header_options = {
			title:		pkg.title || pkg.name,
			version:	pkg.version,
			date:		moment().format('YYYY-MM-DD'),
			homepage:	pkg.homepage,
			author:		pkg.author.name,
			license:	pkg.license
		}, 
		this_year = year == '2016';

	if( !this_year )
		header_options.year = year;

	gulp.src( min_filename )
		.pipe( 
			header( [
				'/*! ${title} - v${version} - ${date}\n',
				' * ${homepage}\n',
				' * Copyright (c) ' + ( this_year ? year : '2016-${year}' ) + ' ${author}; License: ${license} */\n'
			].join( '' ), 
			header_options 
		) )
		.pipe( gulp.dest( folder ) );
} );

gulp.task( 'default', [], function () {
	gulp.watch( [ filename ], [ 'minify', 'gzipify', 'addheaders' ] );
	gulp.start( [ 'minify', 'gzipify', 'addheaders' ] );
} );