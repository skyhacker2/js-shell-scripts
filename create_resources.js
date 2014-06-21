#!/usr/bin/env node
/*
* Generate the Resources.h file for cocos2d-x
* 
* Created by Eleven.Chen (NovemberEleven)
*
*/

var fs = require('fs');

function usage() {
	console.log("usage: create_resource.js directory [output file].");
}
if (process.argv.length < 3 || process.argv.length > 3) {
	usage();
	process.exit(1);
}

var rootDir = process.argv[2];
if (rootDir == '-h' || rootDir == '--help') {
	usage();
	process.exit(0);
}
if (!fs.existsSync(rootDir)) {
	console.log("The argument is not exists");
	process.exit(1);
}

var stats= fs.lstatSync(rootDir);
if (!stats.isDirectory()) {
	console.log("The argument is not a directory");
	process.exit(1);
}

var dirs = [];
var files = [];
var ext = {
	png: "png",
	plist: "plist",
	json: "json",
	ttf: "ttf"
};
var prefix = {
	png: "si_",
	plist: "sp_",
	json: "sjs_",
	ttf: "st_"
};

// BFS
function walk(root, filter) {
	var lists = fs.readdirSync(root);
	//console.log(lists);
	var tmpDirs = [];
	lists.forEach(function(path) {
		var stats = fs.lstatSync(root + "/" +path);
		if (stats.isFile()) {
			filter(path);
		} else if(stats.isDirectory()) {
			dirs.push(path);
			tmpDirs.push(path);
		}
	});

	tmpDirs.forEach(function(path) {
		walk(root + "/" + path, filter);
	});
}

function filter(path) {
	var extendName = path.substring(path.lastIndexOf('.')+1, path.length);
	extendName = extendName.toLowerCase();
	if (ext[extendName]) {
		files.push(path);
	}
}

walk(rootDir, filter);

var date = new Date();
var yy  = date.getFullYear();
var MM = date.getMonth() + 1;
var dd = date.getDate();
var data = ["//",
	"// Resources.h",
	"//",
	"// Created by create_resource.js on " + yy  + "-" + MM + "-" + dd,
	"//",
	"//",
	"//",
	"",
	"#ifndef Auto_Resources_h",
	"#define Auto_Resources_h",
];

// dirs
var searchPaths = 'static const std::vector<std::string> searchPaths = {\n';
dirs.forEach(function(d) {
	searchPaths += '\t"' + d + '",\n';
});
searchPaths += '};';
data.push(searchPaths);

// files
files.forEach(function(file) {
	var name = file.split('.')[0];
	var extName  = file.split('.')[1];
	var varName = prefix[extName] + name.replace(" ", "");
	data.push('static const char ' + varName + '[] = ' + '"' + file + '";');
});

data.push("");
data.push("#endif");
//console.log(data.join('\n'));
var out = "Resources.h";
if (fs.existsSync('../Classes/')) {
	out = "../Classes/" + out;
}
if (process.argv.length == 4) {
	out = process.argv[3];
}
fs.writeFileSync(out, data.join('\n'));

