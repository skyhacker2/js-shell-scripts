#!/usr/bin/env node
var path = require('path'),
	fs = require('fs');

// usage: whereis.js APPNAME
if (process.argv.length < 3 || process.argv.length >3) {
	console.log('usage: whereis.js APPNAME');
	process.exit(1);
}

var paths = process.env.PATH.split(':');
var app = process.argv[2];
var finished = 0;

for(var i = 0; i < paths.length; i++) {
	var fullPath = path.join(paths[i], app);
	(function(path) {
		fs.exists(fullPath, function(exists) {
			if (exists) {
				console.log('app path: %s', path);
				process.exit(0);
			}
			finishOne();
		});
	})(fullPath);
}

function finishOne() {
	finished++;
	if (finished == paths.length) {
		console.log('No such app');
	}
}

