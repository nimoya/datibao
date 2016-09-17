"use strict";

const XmlTemplater = require("docxtemplater").XmlTemplater;
const QrCode = require("qrcode-reader");

module.exports = class DocxQrCode {
	constructor(imageData, xmlTemplater, imgName, num, getDataFromString) {
		this.xmlTemplater = xmlTemplater;
		this.imgName = imgName || "";
		this.num = num;
		this.getDataFromString = getDataFromString;
		this.callbacked = false;
		this.data = imageData;
		if (this.data === undefined) { throw new Error("data of qrcode can't be undefined"); }
		this.ready = false;
		this.result = null;
	}
	decode(callback) {
		this.callback = callback;
		const self = this;
		this.qr = new QrCode();
		this.qr.callback = function () {
			self.ready = true;
			self.result = this.result;
			const testdoc = new XmlTemplater(this.result,
				{fileTypeConfig: self.xmlTemplater.fileTypeConfig,
				tags: self.xmlTemplater.tags,
				Tags: self.xmlTemplater.Tags,
				parser: self.xmlTemplater.parser,
			});
			testdoc.render();
			self.result = testdoc.content;
			return self.searchImage();
		};
		return this.qr.decode({width: this.data.width, height: this.data.height}, this.data.decoded);
	}
	searchImage() {
		const cb = (_err, data) => {
			this.data = data || this.data.data;
			return this.callback(this, this.imgName, this.num);
		};
		if (!(this.result != null)) { return cb(); }
		return this.getDataFromString(this.result, cb);
	}
};
