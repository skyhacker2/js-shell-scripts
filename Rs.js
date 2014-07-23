#!/usr/bin/env node
/*
* Generate the Resources.h file for cocos2d-x
* 
* Created by Eleven.Chen (NovemberEleven)
*
*/

var fs = require('fs');

function usage() {
	console.log("usage: Rs.js directory [output file].");
}
if (process.argv.length < 3 || process.argv.length > 4) {
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

var hdDirName = 'hd';
var normalDirName = 'normal';
var dirs = [];	// 全部文件夹
var hdDirs = []; // hd文件夹
var normalDirs = [];
var files = [];
var ext = {
	png: "png",
	plist: "plist",
	json: "json",
	ttf: "ttf",
	mp3: "mp3",
	wav: "wav",
	jpg: "jpg",
	jpeg: "jpeg"
};
var prefix = {
	png: "image_",
	jpg: "image_",
	jpeg: "image_",
	plist: "plist_",
	json: "json_",
	ttf: "ttf_",
	wav: "music_",
	mp3: "music_"
};
// 完整路径映射
var pathMap = {};

if (rootDir[rootDir.length-1] != '/') {
	rootDir += '/';
}

/** format("test {1}, {2}", "one", "two")
* @return "test one two"
*/
var format = function(str) {
	var arr = arguments;
	return str.replace(/\{([1-9])\}/g, function(_, index) {
		return arr[index];
	})

}
/** 根据路径判断是高清文件夹还是普通文件夹*/
function pushDirName(dirPath) {
	dirs.push(dirPath);
	if (dirPath.indexOf(normalDirName) < 0) {
		hdDirs.push(dirPath);
	}
	if (dirPath.indexOf(hdDirName) < 0) {
		normalDirs.push(dirPath);
	}
}

// BFS
function walk(root, filter, fullpath) {
	var lists = fs.readdirSync(root);
	var tmpDirs = [];
	lists.forEach(function(path) {
		var stats = fs.lstatSync(root + path);
		if (stats.isFile()) {
			filter(path);
			pathMap[path] = fullpath + path;
		} else if(stats.isDirectory()) {
			//dirs.push(fullpath + path);
			pushDirName(fullpath + path);
			tmpDirs.push(path);
		}
	});

	tmpDirs.forEach(function(path) {
		walk(root + path + "/" , filter, fullpath + path + "/");
	});
}

function filter(path) {
	var extendName = path.substring(path.lastIndexOf('.')+1, path.length);
	extendName = extendName.toLowerCase();
	if (ext[extendName]) {
		files.push(path);
	}
}

function getFrames(plist) {
	var reg = /<key>(.*?\.(png|jpg|jpeg))<\/key>/g;
	var arr = plist.match(reg);
	var retArr = [];
	for (var i = 0; i < arr.length; i++) {
		retArr.push(arr[i].replace(/<key>(.*?)<\/key>/, "$1"));
	}
	return retArr;

}

walk(rootDir, filter, "");

var date = new Date();
var yy  = date.getFullYear();
var MM = date.getMonth() + 1;
var dd = date.getDate();
var data = ["//",
	"// Resources.h",
	"//",
	"// Created by Rs.js on " + yy  + "-" + MM + "-" + dd,
	"//",
	"// You should not change this file if no necessary.",
	"//",
	"",
	"#ifndef Auto_Resources_h",
	"#define Auto_Resources_h",
];

// dirs
data.push("");
data.push("/** Search directory */");
var searchPaths = 'static const std::vector<std::string> searchPaths = {\n';
dirs.forEach(function(d) {
	searchPaths += '\t"' + d + '",\n';
});
searchPaths += '};';
data.push(searchPaths);

// hd Dirs
if (hdDirs.length > 0) {
	data.push("/** High definition directory)*/");
	var hdSearchPaths = 'static const std::vector<std::string> hdSearchPaths = {\n';
	hdDirs.forEach(function(d) {
		hdSearchPaths += '\t"' + d + '",\n';
	});
	hdSearchPaths += '};';
	data.push(hdSearchPaths);
}
// normal Dirs
if (normalDirs.length > 0) {
	data.push("/** Normal definition directory)*/");
	var normalSearchPaths = 'static const std::vector<std::string> normalSearchPaths = {\n';
	normalDirs.forEach(function(d) {
		normalSearchPaths += '\t"' + d + '",\n';
	});
	normalSearchPaths += '};';
	data.push(normalSearchPaths);
}

// files
data.push("");
data.push("/* Files */");
files.forEach(function(file) {
	var name = file.split('.')[0];
	var extName  = file.split('.')[1];
	var varName = prefix[extName] + name.replace(/\s/ig, "");
	varName = varName.replace(/-/ig, "_").toLowerCase();
	data.push('/** ' + pathMap[file] +' */');
	data.push('static const char ' + varName + '[] = ' + '"' + file + '";');
});

// plist frames
data.push("");
data.push('/* Frames from plist */');
files.forEach(function(file) {
	if(/.*?\.plist/.test(file)) {
		var varName = file.split('.')[0].replace(/\s/ig, "").replace(/-/ig, "_").toLowerCase();
		data.push(format("/** {1} frames*/", file));
		var plist = fs.readFileSync(pathMap[file], 'utf-8');
		var frames = getFrames(plist);
		frames.sort(function($1, $2) {
			return $1 >= $2;
		});
		var vector = [format('static const std::vector<std::string> plist_{1}_frames = {', varName)];
		frames.forEach(function(frame) {
			frame = frame.replace(/\//g,"_").toLowerCase();
			data.push(format('static const char plist_{1}_{2}[] = "{3}";', varName, frame.split('.')[0], frame));
			vector.push(format('\t"{1}",', frame));
		});
		vector.push('};');
		data.push(vector.join('\n'));
		
	}
});


data.push("");
data.push("#endif");
//console.log(data.join('\n'));
var out = "HNResources.h";
if (fs.existsSync('../Classes/')) {
	out = "../Classes/" + out;
}
if (process.argv.length == 4) {
	out = process.argv[3];
}
fs.writeFileSync(out, data.join('\n'));
console.log('Finished!');
