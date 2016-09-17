"use strict";

const fs = require("fs");
const DocxGen = require("docxtemplater");
const expect = require("chai").expect;
const path = require("path");

const fileNames = [
	"imageAfterLoop.docx",
	"imageExample.docx",
	"imageHeaderFooterExample.docx",
	"imageInlineExample.docx",
	"imageLoopExample.docx",
	"noImage.docx",
	"qrExample.docx",
	"qrExample2.docx",
	"qrHeader.docx",
	"qrHeaderNoImage.docx",
	"expectedNoImage.docx",
];

const shouldBeSame = function (zip1, zip2) {
	if (typeof zip1 === "string") {
		zip1 = new DocxGen(docX[zip1].loadedContent).getZip();
	}
	if (typeof zip2 === "string") {
		zip2 = new DocxGen(docX[zip2].loadedContent).getZip();
	}

	return (() => {
		const result = [];
		Object.keys(zip1.files).map(function (filePath) {
			expect(zip1.files[filePath].options.date).not.to.be.equal(zip2.files[filePath].options.date, "Date differs");
			expect(zip1.files[filePath].name).to.be.equal(zip2.files[filePath].name, "Name differs");
			expect(zip1.files[filePath].options.dir).to.be.equal(zip2.files[filePath].options.dir, "IsDir differs");
			expect(zip1.files[filePath].asText().length).to.be.equal(zip2.files[filePath].asText().length, "Content differs");
			result.push(expect(zip1.files[filePath].asText()).to.be.equal(zip2.files[filePath].asText(), "Content differs"));
		});
		return result;
	})();
};

let opts = null;
beforeEach(function () {
	opts = {};
	opts.getImage = function (tagValue) {
		return fs.readFileSync(tagValue, "binary");
	};
	opts.getSize = function () {
		return [150, 150];
	};
	opts.centered = false;
});

const ImageModule = require("./index.js");

const docX = {};

const stripNonNormalCharacters = (string) => {
	return string.replace(/\n|\r|\t/g, "");
};

const expectNormalCharacters = (string1, string2) => {
	return expect(stripNonNormalCharacters(string1)).to.be.equal(stripNonNormalCharacters(string2));
};

const loadFile = function (name) {
	if ((fs.readFileSync != null)) { return fs.readFileSync(path.resolve(__dirname, "..", "examples", name), "binary"); }
	const xhrDoc = new XMLHttpRequest();
	xhrDoc.open("GET", "../examples/" + name, false);
	if (xhrDoc.overrideMimeType) {
		xhrDoc.overrideMimeType("text/plain; charset=x-user-defined");
	}
	xhrDoc.send();
	return xhrDoc.response;
};

const loadAndRender = function (d, name, data) {
	return d.load(docX[name].loadedContent).setData(data).render();
};

for (let i = 0, name; i < fileNames.length; i++) {
	name = fileNames[i];
	const content = loadFile(name);
	docX[name] = new DocxGen();
	docX[name].loadedContent = content;
}

describe("image adding with {% image} syntax", function () {
	it("should work with one image", function () {
		const name = "imageExample.docx";
		const imageModule = new ImageModule(opts);
		const doc = new DocxGen(docX[name].loadedContent);
		doc.attachModule(imageModule);
		const out = loadAndRender(doc, name, {image: "examples/image.png"});

		const zip = out.getZip();
		fs.writeFile("test7.docx", zip.generate({type: "nodebuffer"}));

		const imageFile = zip.files["word/media/image_generated_1.png"];
		expect((typeof imageFile !== "undefined" && imageFile !== null), "No image file found").to.equal(true);
		expect(imageFile.asText().length).to.be.within(17417, 17440);

		const relsFile = zip.files["word/_rels/document.xml.rels"];
		expect((typeof relsFile !== "undefined" && relsFile !== null), "No rels file found").to.equal(true);
		const relsFileContent = relsFile.asText();
		expectNormalCharacters(relsFileContent, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering\" Target=\"numbering.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings\" Target=\"settings.xml\"/><Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes\" Target=\"footnotes.xml\"/><Relationship Id=\"rId5\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes\" Target=\"endnotes.xml\"/><Relationship Id=\"hId0\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/header\" Target=\"header0.xml\"/><Relationship Id=\"rId6\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"media/image_generated_1.png\"/></Relationships>");

		const documentFile = zip.files["word/document.xml"];
		expect((typeof documentFile !== "undefined" && documentFile !== null), "No document file found").to.equal(true);
		documentFile.asText();
	});

	it("should work with image tag == null", function () {
		const name = "imageExample.docx";
		const imageModule = new ImageModule(opts);
		const doc = new DocxGen(docX[name].loadedContent);
		doc.attachModule(imageModule);
		const out = loadAndRender(doc, name, {});

		const zip = out.getZip();
		fs.writeFile("test8.docx", zip.generate({type: "nodebuffer"}));
		shouldBeSame(zip, "expectedNoImage.docx");
	});

	it("should work with centering", function () {
		const d = new DocxGen();
		const name = "imageExample.docx";
		opts.centered = true;
		const imageModule = new ImageModule(opts);
		d.attachModule(imageModule);
		const out = loadAndRender(d, name, {image: "examples/image.png"});

		const zip = out.getZip();
		fs.writeFile("test_center.docx", zip.generate({type: "nodebuffer"}));
		const imageFile = zip.files["word/media/image_generated_1.png"];
		expect((typeof imageFile !== "undefined" && imageFile !== null)).to.equal(true);
		expect(imageFile.asText().length).to.be.within(17417, 17440);

		const relsFile = zip.files["word/_rels/document.xml.rels"];
		expect((typeof relsFile !== "undefined" && relsFile !== null)).to.equal(true);
		const relsFileContent = relsFile.asText();
		expectNormalCharacters(relsFileContent, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering\" Target=\"numbering.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings\" Target=\"settings.xml\"/><Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes\" Target=\"footnotes.xml\"/><Relationship Id=\"rId5\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes\" Target=\"endnotes.xml\"/><Relationship Id=\"hId0\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/header\" Target=\"header0.xml\"/><Relationship Id=\"rId6\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"media/image_generated_1.png\"/></Relationships>");

		const documentFile = zip.files["word/document.xml"];
		expect((typeof documentFile !== "undefined" && documentFile !== null)).to.equal(true);
		documentFile.asText();
	});

	it("should work with loops", function () {
		const name = "imageLoopExample.docx";

		opts.centered = true;
		const imageModule = new ImageModule(opts);
		docX[name].attachModule(imageModule);
		const out = loadAndRender(docX[name], name, {images: ["examples/image.png", "examples/image2.png"]});

		const zip = out.getZip();

		const imageFile = zip.files["word/media/image_generated_1.png"];
		expect((typeof imageFile !== "undefined" && imageFile !== null)).to.equal(true);
		expect(imageFile.asText().length).to.be.within(17417, 17440);

		const imageFile2 = zip.files["word/media/image_generated_2.png"];
		expect((typeof imageFile2 !== "undefined" && imageFile2 !== null)).to.equal(true);
		expect(imageFile2.asText().length).to.be.within(7177, 7181);

		const relsFile = zip.files["word/_rels/document.xml.rels"];
		expect((typeof relsFile !== "undefined" && relsFile !== null)).to.equal(true);
		const relsFileContent = relsFile.asText();
		expectNormalCharacters(relsFileContent, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering\" Target=\"numbering.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings\" Target=\"settings.xml\"/><Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes\" Target=\"footnotes.xml\"/><Relationship Id=\"rId5\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes\" Target=\"endnotes.xml\"/><Relationship Id=\"hId0\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/header\" Target=\"header0.xml\"/><Relationship Id=\"rId6\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"media/image_generated_1.png\"/><Relationship Id=\"rId7\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"media/image_generated_2.png\"/></Relationships>");

		const documentFile = zip.files["word/document.xml"];
		expect((typeof documentFile !== "undefined" && documentFile !== null)).to.equal(true);
		const buffer = zip.generate({type: "nodebuffer"});
		fs.writeFile("test_multi.docx", buffer);
	});

	it("should work with image in header/footer", function () {
		const name = "imageHeaderFooterExample.docx";
		const imageModule = new ImageModule(opts);
		docX[name].attachModule(imageModule);
		const out = loadAndRender(docX[name], name, {image: "examples/image.png"});

		const zip = out.getZip();

		const imageFile = zip.files["word/media/image_generated_1.png"];
		expect((typeof imageFile !== "undefined" && imageFile !== null)).to.equal(true);
		expect(imageFile.asText().length).to.be.within(17417, 17440);

		const imageFile2 = zip.files["word/media/image_generated_2.png"];
		expect((typeof imageFile2 !== "undefined" && imageFile2 !== null)).to.equal(true);
		expect(imageFile2.asText().length).to.be.within(17417, 17440);

		const relsFile = zip.files["word/_rels/document.xml.rels"];
		expect((typeof relsFile !== "undefined" && relsFile !== null)).to.equal(true);
		const relsFileContent = relsFile.asText();
		expectNormalCharacters(relsFileContent, "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/header\" Target=\"header1.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer\" Target=\"footer1.xml\"/><Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable\" Target=\"fontTable.xml\"/><Relationship Id=\"rId5\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings\" Target=\"settings.xml\"/></Relationships>");

		const headerRelsFile = zip.files["word/_rels/header1.xml.rels"];
		expect((typeof headerRelsFile !== "undefined" && headerRelsFile !== null)).to.equal(true);
		const headerRelsFileContent = headerRelsFile.asText();
		expectNormalCharacters(headerRelsFileContent, `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image_generated_2.png"/>
</Relationships>`);

		const footerRelsFile = zip.files["word/_rels/footer1.xml.rels"];
		expect((typeof footerRelsFile !== "undefined" && footerRelsFile !== null)).to.equal(true);
		const footerRelsFileContent = footerRelsFile.asText();
		expectNormalCharacters(footerRelsFileContent, "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/header\" Target=\"header1.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer\" Target=\"footer1.xml\"/><Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable\" Target=\"fontTable.xml\"/><Relationship Id=\"rId5\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings\" Target=\"settings.xml\"/><Relationship Id=\"rId6\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"media/image_generated_1.png\"/></Relationships>");

		const documentFile = zip.files["word/document.xml"];
		expect((typeof documentFile !== "undefined" && documentFile !== null)).to.equal(true);
		const documentContent = documentFile.asText();
		expectNormalCharacters(documentContent, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><w:document xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:v=\"urn:schemas-microsoft-com:vml\" xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" xmlns:w10=\"urn:schemas-microsoft-com:office:word\" xmlns:wp=\"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing\"><w:body><w:p><w:pPr><w:pStyle w:val=\"Normal\"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr></w:r></w:p><w:sectPr><w:headerReference w:type=\"default\" r:id=\"rId2\"/><w:footerReference w:type=\"default\" r:id=\"rId3\"/><w:type w:val=\"nextPage\"/><w:pgSz w:w=\"12240\" w:h=\"15840\"/><w:pgMar w:left=\"1800\" w:right=\"1800\" w:header=\"720\" w:top=\"2810\" w:footer=\"1440\" w:bottom=\"2003\" w:gutter=\"0\"/><w:pgNumType w:fmt=\"decimal\"/><w:formProt w:val=\"false\"/><w:textDirection w:val=\"lrTb\"/><w:docGrid w:type=\"default\" w:linePitch=\"249\" w:charSpace=\"2047\"/></w:sectPr></w:body></w:document>");
		fs.writeFile("test_header_footer.docx", zip.generate({type: "nodebuffer"}));
	});
});

describe("qrcode replacing", function () {
	describe("shoud work without loops", function () {
		it("should work with simple", function (done) {
			const name = "qrExample.docx";
			opts.qrCode = true;
			const imageModule = new ImageModule(opts);

			imageModule.finished = function () {
				const zip = docX[name].getZip();
				const buffer = zip.generate({type: "nodebuffer"});
				fs.writeFileSync("test_qr.docx", buffer);
				const images = zip.file(/media\/.*.png/);
				expect(images.length).to.equal(2);
				expect(images[0].asText().length).to.equal(826);
				expect(images[1].asText().length).to.be.within(17417, 17440);
				done();
			};

			docX[name].attachModule(imageModule);
			loadAndRender(docX[name], name, {image: "examples/image"});
		});
	});

	describe("should work with two", function () {
		it("should work", function (done) {
			const name = "qrExample2.docx";

			opts.qrCode = true;
			const imageModule = new ImageModule(opts);

			imageModule.finished = function () {
				const zip = docX[name].getZip();
				const buffer = zip.generate({type: "nodebuffer"});
				fs.writeFileSync("test_qr3.docx", buffer);
				const images = zip.file(/media\/.*.png/);
				expect(images.length).to.equal(4);
				expect(images[0].asText().length).to.equal(859);
				expect(images[1].asText().length).to.equal(826);
				expect(images[2].asText().length).to.be.within(17417, 17440);
				expect(images[3].asText().length).to.be.within(7177, 7181);
				done();
			};

			docX[name].attachModule(imageModule);
			loadAndRender(docX[name], name, {image: "examples/image", image2: "examples/image2.png"});
		});
	});

	describe("should work qr in headers without extra images", function () {
		it("should work in a header too", function (done) {
			const name = "qrHeaderNoImage.docx";
			opts.qrCode = true;
			const imageModule = new ImageModule(opts);

			imageModule.finished = function () {
				const zip = docX[name].getZip();
				const buffer = zip.generate({type: "nodebuffer"});
				fs.writeFile("test_qr_header_no_image.docx", buffer);
				const images = zip.file(/media\/.*.png/);
				expect(images.length).to.equal(3);
				expect(images[0].asText().length).to.equal(826);
				expect(images[1].asText().length).to.be.within(12888, 12900);
				expect(images[2].asText().length).to.be.within(17417, 17440);
				done();
			};

			docX[name].attachModule(imageModule);
			loadAndRender(docX[name], name, {image: "examples/image", image2: "examples/image2.png"});
		});
	});

	describe("should work qr in headers with extra images", function () {
		it("should work in a header too", function (done) {
			const name = "qrHeader.docx";

			opts.qrCode = true;
			const imageModule = new ImageModule(opts);

			imageModule.finished = function () {
				const zip = docX[name].getZip();
				const buffer = zip.generate({type: "nodebuffer"});
				fs.writeFile("test_qr_header.docx", buffer);
				const images = zip.file(/media\/.*.png/);
				expect(images.length).to.equal(3);
				expect(images[0].asText().length).to.equal(826);
				expect(images[1].asText().length).to.be.within(12888, 12900);
				expect(images[2].asText().length).to.be.within(17417, 17440);
				done();
			};

			docX[name].attachModule(imageModule);
			loadAndRender(docX[name], name, {image: "examples/image", image2: "examples/image2.png"});
		});
	});

	describe("should work with image after loop", function () {
		it("should work with image after loop", function (done) {
			const name = "imageAfterLoop.docx";

			opts.qrCode = true;
			const imageModule = new ImageModule(opts);

			imageModule.finished = function () {
				const zip = docX[name].getZip();
				const buffer = zip.generate({type: "nodebuffer"});
				fs.writeFile("test_image_after_loop.docx", buffer);
				const images = zip.file(/media\/.*.png/);
				expect(images.length).to.equal(2);
				expect(images[0].asText().length).to.be.within(7177, 7181);
				expect(images[1].asText().length).to.be.within(7177, 7181);
				done();
			};

			docX[name].attachModule(imageModule);
			loadAndRender(docX[name], name, {image: "examples/image2.png", above: [{cell1: "foo", cell2: "bar"}], below: "foo"});
		});
	});
});
