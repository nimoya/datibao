"use strict";

const SubContent = require("docxtemplater").SubContent;
const ImgManager = require("./imgManager");
const ImgReplacer = require("./imgReplacer");

class ImageModule {
	constructor(options) {
		this.options = options || {};
		if (!(this.options.centered != null)) { this.options.centered = false; }
		if (!(this.options.getImage != null)) { throw new Error("You should pass getImage"); }
		if (!(this.options.getSize != null)) { throw new Error("You should pass getSize"); }
		this.qrQueue = [];
		this.imageNumber = 1;
	}
	handleEvent(event, eventData) {
		if (event === "rendering-file") {
			this.renderingFileName = eventData;
			const gen = this.manager.getInstance("gen");
			this.imgManager = new ImgManager(gen.zip, this.renderingFileName);
			this.imgManager.loadImageRels();
		}
		if (event === "rendered") {
			if (this.qrQueue.length === 0) { return this.finished(); }
		}
	}
	get(data) {
		if (data === "loopType") {
			const templaterState = this.manager.getInstance("templaterState");
			if (templaterState.textInsideTag[0] === "%") {
				return "image";
			}
		}
		return null;
	}
	getNextImageName() {
		const name = `image_generated_${this.imageNumber}.png`;
		this.imageNumber++;
		return name;
	}
	replaceBy(text, outsideElement) {
		const xmlTemplater = this.manager.getInstance("xmlTemplater");
		const templaterState = this.manager.getInstance("templaterState");
		let subContent = new SubContent(xmlTemplater.content);
		subContent = subContent.getInnerTag(templaterState);
		subContent = subContent.getOuterXml(outsideElement);
		return xmlTemplater.replaceXml(subContent, text);
	}
	convertPixelsToEmus(pixel) {
		return Math.round(pixel * 9525);
	}
	replaceTag() {
		const scopeManager = this.manager.getInstance("scopeManager");
		const templaterState = this.manager.getInstance("templaterState");
		const xmlTemplater = this.manager.getInstance("xmlTemplater");
		const tagXml = xmlTemplater.fileTypeConfig.tagsXmlArray[0];
		const tagXmlParagraph = tagXml.substr(0, 1) + ":p";

		const tag = templaterState.textInsideTag.substr(1);
		const tagValue = scopeManager.getValue(tag);
		const startEnd = `<${tagXml}></${tagXml}>`;
		const outsideElement = this.options.centered ? tagXmlParagraph : tagXml;

		if (tagValue == null) {
			return this.replaceBy(startEnd, tagXml);
		}

		let imgBuffer;
		try {
			imgBuffer = this.options.getImage(tagValue, tag);
		}
		catch (e) {
			return this.replaceBy(startEnd, tagXml);
		}
		const imageRels = this.imgManager.loadImageRels();
		if (!imageRels) {
			return;
		}
		const rId = imageRels.addImageRels(this.getNextImageName(), imgBuffer);
		const sizePixel = this.options.getSize(imgBuffer, tagValue, tag);
		const size = [this.convertPixelsToEmus(sizePixel[0]), this.convertPixelsToEmus(sizePixel[1])];
		const newText = this.options.centered ? this.getImageXmlCentered(rId, size) : this.getImageXml(rId, size);
		return this.replaceBy(newText, outsideElement);
	}
	replaceQr() {
		const xmlTemplater = this.manager.getInstance("xmlTemplater");
		const imR = new ImgReplacer(xmlTemplater, this.imgManager);
		imR.getDataFromString = (result, cb) => {
			if ((this.options.getImageAsync != null)) {
				return this.options.getImageAsync(result, cb);
			}
			return cb(null, this.options.getImage(result));
		};
		imR.pushQrQueue = (num) => {
			return this.qrQueue.push(num);
		};
		imR.popQrQueue = (num) => {
			const found = this.qrQueue.indexOf(num);
			if (found !== -1) {
				this.qrQueue.splice(found, 1);
			}
			else {
				this.on("error", new Error(`qrqueue ${num} is not in qrqueue`));
			}
			if (this.qrQueue.length === 0) { return this.finished(); }
		};
		const num = parseInt(Math.random() * 10000, 10);
		imR.pushQrQueue("rendered-" + num);
		try {
			imR.findImages().replaceImages();
		}
		catch (e) {
			this.on("error", e);
		}
		const f = () => imR.popQrQueue("rendered-" + num);
		return setTimeout(f, 1);
	}
	finished() {}
	on(event, data) {
		if (event === "error") {
			throw data;
		}
	}
	handle(type, data) {
		if (type === "replaceTag" && data === "image") {
			this.replaceTag();
		}
		if (type === "xmlRendered" && this.options.qrCode) {
			this.replaceQr();
		}
		return null;
	}
	getImageXml(rId, size) {
		return `<w:drawing>
  <wp:inline distT="0" distB="0" distL="0" distR="0">
    <wp:extent cx="${size[0]}" cy="${size[1]}"/>
    <wp:effectExtent l="0" t="0" r="0" b="0"/>
    <wp:docPr id="2" name="Image 2" descr="image"/>
    <wp:cNvGraphicFramePr>
      <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
    </wp:cNvGraphicFramePr>
    <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:nvPicPr>
            <pic:cNvPr id="0" name="Picture 1" descr="image"/>
            <pic:cNvPicPr>
              <a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
            </pic:cNvPicPr>
          </pic:nvPicPr>
          <pic:blipFill>
            <a:blip r:embed="rId${rId}">
              <a:extLst>
                <a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}">
                  <a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/>
                </a:ext>
              </a:extLst>
            </a:blip>
            <a:srcRect/>
            <a:stretch>
              <a:fillRect/>
            </a:stretch>
          </pic:blipFill>
          <pic:spPr bwMode="auto">
            <a:xfrm>
              <a:off x="0" y="0"/>
              <a:ext cx="${size[0]}" cy="${size[1]}"/>
            </a:xfrm>
            <a:prstGeom prst="rect">
              <a:avLst/>
            </a:prstGeom>
            <a:noFill/>
            <a:ln>
              <a:noFill/>
            </a:ln>
          </pic:spPr>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:inline>
</w:drawing>
		`;
	}
	getImageXmlCentered(rId, size) {
		return `		<w:p>
		  <w:pPr>
			<w:jc w:val="center"/>
		  </w:pPr>
		  <w:r>
			<w:rPr/>
			<w:drawing>
			  <wp:inline distT="0" distB="0" distL="0" distR="0">
				<wp:extent cx="${size[0]}" cy="${size[1]}"/>
				<wp:docPr id="0" name="Picture" descr=""/>
				<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
				  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
					<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
					  <pic:nvPicPr>
						<pic:cNvPr id="0" name="Picture" descr=""/>
						<pic:cNvPicPr>
						  <a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
						</pic:cNvPicPr>
					  </pic:nvPicPr>
					  <pic:blipFill>
						<a:blip r:embed="rId${rId}"/>
						<a:stretch>
						  <a:fillRect/>
						</a:stretch>
					  </pic:blipFill>
					  <pic:spPr bwMode="auto">
						<a:xfrm>
						  <a:off x="0" y="0"/>
						  <a:ext cx="${size[0]}" cy="${size[1]}"/>
						</a:xfrm>
						<a:prstGeom prst="rect">
						  <a:avLst/>
						</a:prstGeom>
						<a:noFill/>
						<a:ln w="9525">
						  <a:noFill/>
						  <a:miter lim="800000"/>
						  <a:headEnd/>
						  <a:tailEnd/>
						</a:ln>
					  </pic:spPr>
					</pic:pic>
				  </a:graphicData>
				</a:graphic>
			  </wp:inline>
			</w:drawing>
		  </w:r>
		</w:p>
		`;
	}
}

module.exports = ImageModule;
