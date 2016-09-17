"use strict";

const DocUtils = require("./docUtils");
const DocxQrCode = require("./docxQrCode");
const PNG = require("png-js");
const base64encode = require("./base64").encode;

module.exports = class ImgReplacer {
	constructor(xmlTemplater, imgManager) {
		this.xmlTemplater = xmlTemplater;
		this.imgManager = imgManager;
		this.imageSetter = this.imageSetter.bind(this);
		this.imgMatches = [];
		this.xmlTemplater.numQrCode = 0;
	}
	findImages() {
		this.imgMatches = DocUtils.pregMatchAll(/<w:drawing[^>]*>.*?<a:blip.r:embed.*?<\/w:drawing>/g, this.xmlTemplater.content);
		return this;
	}
	replaceImages() {
		this.qr = [];
		this.xmlTemplater.numQrCode += this.imgMatches.length;
		const iterable = this.imgMatches;
		for (let imgNum = 0, match; imgNum < iterable.length; imgNum++) {
			match = iterable[imgNum];
			this.replaceImage(match, imgNum);
		}
		return this;
	}
	imageSetter(docxqrCode) {
		if (docxqrCode.callbacked === true) { return; }
		docxqrCode.callbacked = true;
		docxqrCode.xmlTemplater.numQrCode--;
		this.imgManager.setImage(`word/media/${docxqrCode.imgName}`, docxqrCode.data, {binary: true});
		return this.popQrQueue(this.imgManager.fileName + "-" + docxqrCode.num, false);
	}
	getXmlImg(match) {
		const baseDocument = `<?xml version="1.0" ?>
		<w:document
		mc:Ignorable="w14 wp14"
		xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
			xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
			xmlns:o="urn:schemas-microsoft-com:office:office"
		xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
			xmlns:v="urn:schemas-microsoft-com:vml"
		xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
			xmlns:w10="urn:schemas-microsoft-com:office:word"
		xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
			xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
			xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
			xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
			xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
			xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
			xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
			xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">${match[0]}</w:document>
			`;
		const f = function (e) {
			if (e === "fatalError") {
				throw new Error("fatalError");
			}
		};
		return DocUtils.str2xml(baseDocument, f);
	}
	replaceImage(match, imgNum) {
		const num = parseInt(Math.random() * 10000, 10);
		let xmlImg;
		try {
			xmlImg = this.getXmlImg(match);
		}
		catch (e) {
			return;
		}
		const tagrId = xmlImg.getElementsByTagName("a:blip")[0];
		if (tagrId === undefined) { throw new Error("tagRiD undefined !"); }
		const rId = tagrId.getAttribute("r:embed");
		const tag = xmlImg.getElementsByTagName("wp:docPr")[0];
		if (tag === undefined) { throw new Error("tag undefined"); }
		// if image is already a replacement then do nothing
		if (tag.getAttribute("name").substr(0, 6) === "Copie_") { return; }
		const imgName = this.imgManager.getImageName();
		this.pushQrQueue(this.imgManager.fileName + "-" + num, true);
		const newId = this.imgManager.addImageRels(imgName, "");
		this.xmlTemplater.imageId++;
		const oldFile = this.imgManager.getImageByRid(rId);
		this.imgManager.setImage(this.imgManager.getFullPath(imgName), oldFile.data, {binary: true});
		tag.setAttribute("name", `${imgName}`);
		tagrId.setAttribute("r:embed", `rId${newId}`);
		const imageTag = xmlImg.getElementsByTagName("w:drawing")[0];
		if (imageTag === undefined) { throw new Error("imageTag undefined"); }
		const replacement = DocUtils.xml2Str(imageTag);
		this.xmlTemplater.content = this.xmlTemplater.content.replace(match[0], replacement);

		return this.decodeImage(oldFile, imgName, num, imgNum);
	}
	decodeImage(oldFile, imgName, num, imgNum) {
		const mockedQrCode = {xmlTemplater: this.xmlTemplater, imgName: imgName, data: oldFile.asBinary(), num: num};
		if (!/\.png$/.test(oldFile.name)) {
			return this.imageSetter(mockedQrCode);
		}
		return ((imgName) => {
			const base64 = base64encode(oldFile.asBinary());
			const binaryData = new Buffer(base64, "base64");
			const png = new PNG(binaryData);
			const finished = (a) => {
				png.decoded = a;
				try {
					this.qr[imgNum] = new DocxQrCode(png, this.xmlTemplater, imgName, num, this.getDataFromString);
					return this.qr[imgNum].decode(this.imageSetter);
				}
				catch (e) {
					return this.imageSetter(mockedQrCode);
				}
			};
			return png.decode(finished);
		})(imgName);
	}
};
