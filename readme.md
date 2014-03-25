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

The data object is quite simple. It's an array with one item per page. This ist also an array with one item per text block. This is an object containing all lines and the blocks coordinates within the page. All lines are trimmed and made of pure unicode with decoded entities.

````
[
	[
		{
			"bbox": [left, top, right, bottom],
			"lines": [
				"text",
				"text"
			]
		}
	]
]
````

# License

[Public Domain](http://unlicense.org/UNLICENSE)

