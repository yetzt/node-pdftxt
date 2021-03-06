#!/usr/bin/env node

/* get node modules */
var fs = require("fs");
var path = require("path");
var he = require("he");

/* get npm modules */
var comandante = require("comandante");

var _bin = null;

var init = function(callback){

	if (_bin !== null) return callback(null, _bin)

	/* check for stdout blockdev */
	/*
	if (!fs.existsSync("/dev/stdout")) {
		return callback(new Error("there is no /dev/stdout. this lib requires unix or better."));
	};
	*/

	/* find pdf2json binary in path */
	if (!'PATH' in process.env) return callback(new Error("can't find the $PATH"));
	var _path = process.env.PATH.split(/:/g);
	var _tmp_bin = null;
	for (var i = 0; i < _path.length; i++) {
		_tmp_bin = path.resolve(_path[i], 'pdf3json');
		if (fs.existsSync(_tmp_bin)) {
			_bin = _tmp_bin;
			break;
		}
	};
	if (!_bin) return callback(new Error('`pdf3json` binary not found'));

	/* check if the binary we found is the one we are looking for, since there is an executable node module of the same name */
	var _proc = comandante(_bin, ['-v']);
	var _buf = [];

	_proc.stderr.on('data', function(d){
		_buf.push(d);
	});

	_proc.stderr.on('end', function(){

		/* check if the output matches the desired binary */
		if (Buffer.concat(_buf).toString().match(/pdf3json version [0-9\.]+, based on pdf2json [0-9\.]+ and Xpdf version [0-9\.]+/)){
			callback(null, _bin);
		} else {
			callback(new Error('wrong `pdf3json` binary. please use this one: https://github.com/yetzt/pdf3json/'));
		}
	});

	_proc.on('error', function(e){}); // ignore errors, since the pdf3json binary exits 1 on -v

};

var extract = function(data, callback) {

	var _pages = [];
	data.forEach(function(page){

		/* concatenate fragments by line */
		var _lines = [];
		var _llw = 0;
		var _last = page.text.shift();
		page.text.forEach(function(_current){

			if (_current.top === _last.top) {
				var _space = Math.abs((_last.left+_last.width) - _current.left);
				/* same line */
				if (_space <= 10 || (_current.left+(_current.width/3)*2) < _llw) {
					/* concat */
					_last.width = ((_current.left+_current.width)-_last.left);
					_last.data += _current.data;
				} else {
					/* same line, but spaced */
					_lines.push(_last);
					_last = _current;
				}
			} else {
				/* different line */
				_llw = (_last.height === _current.height && _last.left === _current.left) ? _last.width+_last.left : 0;
				_lines.push(_last);
				_last = _current;
			}

		});
		_lines.push(_last);

		/* split into blocks */
		var _blocks = [];
		var _block = [];
		var _last = _lines.shift();
		_lines.forEach(function(_current){
			var _newblock = (_last.left !== _current.left || _current.data.match(/^\s*$/) || (_last.height !== _current.height) || (Math.abs(_last.top-_current.top) >= (_current.height*3))) ? true : false;
			if (!_last.data.match(/^\s*$/)) _block.push(_last);
			if (_newblock && _block.length > 0) _blocks.push(_block);
			if (_newblock) _block = [];
			_last = _current;
		});
		if (_last && _last.hasOwnProperty("data") && !_last.data.match(/^\s*$/)) _block.push(_last)
		if (_block.length > 0) _blocks.push(_block);

		/* trim, decode entities and and dehyphenate */
		_blocks.forEach(function(_block, _blkidx){
			_block.forEach(function(_text, _idx){
				_text.data = he.decode(_text.data.replace(/^\s+|\s+$/,'').replace(/\s\s+/g,' '));
				if (_idx > 0 && _block[_idx-1] && _block[_idx-1].data.match(/[a-z\u00df-\u00f6\u00f8-\u00ff]-$/) && _text.data.match(/^[a-z\u00df-\u00f6\u00f8-\u00ff]/)) { // fixme: make unicode lowercase regex
					var _split = _text.data.match(/^([a-z\u00df-\u00f6\u00f8-\u00ff]+[^\s]*)\s(.*)$/);
					if (_split) {
						_block[_idx-1].data = _block[_idx-1].data.replace(/\-$/, _split[1]);
						_text.data = _split[2];
					} else {
						/* check for special case: hyphenation before line end */
						var _split_end = _text.data.match(/^([a-z\u00df-\u00f6\u00f8-\u00ff]+[^\s]*)$/);
						if (_split_end) {
							_block[_idx-1].data = _block[_idx-1].data.replace(/\-$/, _split_end[1]);
							delete _block[_idx];
						}
					}
				}
			});
		});

		/* flatten blocks */
		var _data = [];
		_blocks.forEach(function(_block){

			var _bboxes = [];

			var _set = {
				"bbox": [null,null,null,null],
				"lines": []
			};

			_block.forEach(function(_line){

				_set.lines.push(_line.data);

				// convert to absolute measures starting at the bottom
				_bboxes.push([
					_line.left, // start left
					(page.height-_line.top),  // start bottom
					(_line.left+_line.width),// end left
					((page.height-_line.top)+_line.height) // end bottom
				]);
								
			});
			
			// find biggest bbox expansion
			_bboxes.forEach(function(_bbox){
				if (_set.bbox[0] === null || _bbox[0] < _set.bbox[0]) _set.bbox[0] = _bbox[0];
				if (_set.bbox[1] === null || _bbox[1] < _set.bbox[1]) _set.bbox[1] = _bbox[1];
				if (_set.bbox[2] === null || _bbox[2] > _set.bbox[2]) _set.bbox[2] = _bbox[2];
				if (_set.bbox[3] === null || _bbox[3] > _set.bbox[3]) _set.bbox[3] = _bbox[3];
			});
			// convert back to width/height
			_set.bbox[2] = (_set.bbox[2]-_set.bbox[0]);
			_set.bbox[3] = (_set.bbox[3]-_set.bbox[1]);	
			
			_data.push(_set);
		});

		_pages.push({
			num: page.number,
			width: page.width,
			height: page.height,
			blocks: _data
		});

	});

	callback(null, _pages);

}

module.exports = function(file, callback) {

	init(function(err, bin){

		if (err) return callback(err);

		/* check if file exists, to save some embarrassment. */
		if (!fs.existsSync(file)) {
			return callback(new Error("file not found"));
		};

		/* spawn pdf2json */
		var _buf = [];
		var _proc = comandante(bin, ["-q", "-e", "UTF-8", file]);

		var _error = false;

		_proc.on('error', function(e){
			_error = true;
			callback(e);
		});

		_proc.stdout.on('data', function(d){
			_buf.push(d);
		});

		_proc.stdout.on('end', function(){

			if (_error) return;

			try {
				var _data = JSON.parse(Buffer.concat(_buf).toString());
			} catch(e) {
				return callback(e);
			}

			extract(_data, function(err, data){

				if (err) return callback(err);

				callback(null, data);

			});

		});

	});

}

