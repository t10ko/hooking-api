'use strict';
 
var gulp = require( 'gulp' ), 
	gzip = require( 'gulp-gzip' ), 
	uglify = require( 'gulp-uglify' ), 
	rename = require( 'gulp-rename' ), 
	concat = require( 'gulp-concat' ), 
	moment = require( 'moment' ), 
	header = require( 'gulp-header' ), 
	bower = require( 'main-bower-files' ), 

	pkg = require('./package.json'),
	fs = require('fs'),

	src_folder = 'src/', 
	dist_folder = 'dist/', 

	file = 'for-web', 
	compiled_file = 'compiled', 

	filename = file + '.js', 
	filepath = src_folder + filename, 
	min_filename = file + '.min.js', 
	min_filepath = dist_folder + min_filename, 

	compiled_filename = compiled_file + '.js', 
	compiled_filepath = dist_folder + compiled_filename, 
	min_compiled_filename = compiled_file + '.min.js', 
	min_compiled_filepath = dist_folder + min_compiled_filename, 

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
	gulp.src( [filepath, compiled_filepath] )
		.pipe( uglify( uglify_settings ) )
		.pipe( rename( { extname: '.min.js' } ) )
		.pipe( gulp.dest( dist_folder ) );
} );
gulp.task( 'gzipify', function () {
	gulp.src( [min_filepath, min_compiled_filepath] )
		.pipe( gzip() )
		.pipe( gulp.dest( dist_folder ) );
} );
gulp.task( 'addheader', function () {
	var file = fs.readFileSync( min_filepath ).toString();
	file = file.replace(/^\/\*(.|\n)+\*\//, '');
	fs.writeFileSync( min_filepath, file );

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

	gulp.src( min_filepath )
		.pipe( 
			header( [
				'/*! ${title} - v${version} - ${date}\n',
				' * ${homepage}\n',
				' * Copyright (c) ' + ( this_year ? year : '2016-${year}' ) + ' ${author}; License: ${license} */\n'
			].join( '' ), 
			header_options 
		) )
		.pipe( gulp.dest( dist_folder ) );
} );
gulp.task( 'bowerize', function () {
	gulp.src( bower( { includeSelf: true } ) )
		.pipe( concat( 'compiled.js' ) )
		.pipe( gulp.dest( 'dist/' ) );
} );

gulp.task( 'default', [], function () {
	gulp.watch( [ filepath ], [ 'bowerize', 'minify', 'gzipify', 'addheader' ] );
	gulp.start( [ 'bowerize', 'minify', 'gzipify', 'addheader' ] );
} );