# pdftxt

pdftxt extracts text from PDF documents, hence the name. this software was built to extract coherent indexable text and tries it's best to assemble lines and paragraphs, dehyphenate divised text and polish the bonnet.

# Requirements

pdftxt requires an unixoid operating system with [pdf2json](https://code.google.com/p/pdf2json/) installed.

# Install

````
npm install git://github.com/yetzt/node-pdftxt.git
````

# Usage

```` javascript

var pdftxt = require("pdftxt");

pdftext("file.pdf", function(err, data) {

	if (err) return console.error(err);
	
	console.log(data);
	
});
````

# Data

__Warning:__ This has changed since the last version.

The data object is quite simple. It's an array with one item per page. 

Every page item has it's `number`, `width` and `height` as properties. The proprty `blocks` contains an array of text block objects.

Every block object contains a `bbox` bounding box array with its `left`, `top`, `right` and `bottom` positions on the page, and an array of `lines` within that block.

All `lines` are trimmed and made of pure unicode with decoded entities.

```` javascript
	[
		{
		"page": num,
		"width": width,
		"height": height,
		"blocks": [{
			"bbox": [left, top, right, bottom],
			"lines": [
				"text",
				"text"
			]
		},{
			// ...
		}]
		}
	]
````

# License

[Public Domain](http://unlicense.org/UNLICENSE)

