#!/usr/bin/env node

/* require module */
var pdftext = require(__dirname+"/../pdftxt.js");

pdftext(__dirname+"/lorem.pdf", function(err, pages) {
	if (err) return console.error(err);	
	pages.forEach(function(page){
		console.log("[new page]");
		console.log("NUM:", page.num);
		console.log("DIM:", page.width, "x", page.height);
		page.blocks.forEach(function(block){
			console.log("\t", "[new block]");
			console.log("\t\t", block.bbox);
			block.lines.forEach(function(line){
				console.log("\t\t", line);
			});
		});
	});
	
});
