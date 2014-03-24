#!/usr/bin/env node

/* require module */
var pdftext = require(__dirname+"/../pdftxt.js");

pdftext(__dirname+"/lorem.pdf", function(err, pages) {
	if (err) return console.error(err);	
	pages.forEach(function(page){
		console.log("[new page]");
		page.forEach(function(block){
			console.log("\t", "[new block]");
			block.lines.forEach(function(line){
				console.log("\t\t", line);
			});
		});
	});
	
});
