//JavaScript HTML Sanitizer, (c) Alexander Yumashev, Jitbit Software.

//homepage https://github.com/jitbit/HtmlSanitizer

//License: MIT https://github.com/jitbit/HtmlSanitizer/blob/master/LICENSE

console.log('loading');

var HtmlSanitizer = new (function () {

	var tagWhitelist_ = {
		'A': false, 'ABBR': false, 'B': false, 'BLOCKQUOTE': false, 'BODY': false, 'BR': false, 'CENTER': false, 'CODE': false, 'DIV': false, 'EM': false, 'FONT': false,
		'H1': false, 'H2': false, 'H3': false, 'H4': false, 'H5': false, 'H6': false, 'HR': false, 'I': false, 'IMG': false, 'LABEL': false, 'LI': false, 'OL': false, 'P': false, 'PRE': false,
		'SMALL': false, 'SOURCE': false, 'SPAN': false, 'STRONG': false, 'TABLE': false, 'TBODY': false, 'TR': false, 'TD': false, 'TH': false, 'THEAD': false, 'UL': false, 'U': false, 'VIDEO': false
	};

	var contentTagWhiteList_ = { 'FORM': true }; //tags that will be converted to DIVs

	var attributeWhitelist_ = { 'align': false, 'color': false, 'controls': false, 'height': false, 'href': false, 'src': false, 'style': false, 'target': false, 'title': false, 'type': false, 'width': false };

	var cssWhitelist_ = { 'color': false, 'background-color': false, 'font-size': false, 'text-align': false, 'text-decoration': false, 'font-weight': false };

	var schemaWhiteList_ = []; //which "protocols" are allowed in "href", "src" etc

	var uriAttributes_ = { 'href': false, 'action': false };

	this.SanitizeHtml = function(input) {
		input = input.trim();
		if (input == "") return ""; //to save performance and not create iframe

		//firefox "bogus node" workaround
		if (input == "<br>") return "";

		var iframe = document.createElement('iframe');
		if (iframe['sandbox'] === undefined) {
			alert('Your browser does not support sandboxed iframes. Please upgrade to a modern browser.');
			return '';
		}
		iframe['sandbox'] = 'allow-same-origin';
		iframe.style.display = 'none';
		document.body.appendChild(iframe); // necessary so the iframe contains a document
		var iframedoc = iframe.contentDocument || iframe.contentWindow.document;
		if (iframedoc.body == null) iframedoc.write("<body></body>"); // null in IE
		iframedoc.body.innerHTML = input;

		function makeSanitizedCopy(node) {
			if (node.nodeType == Node.TEXT_NODE) {
				var newNode = node.cloneNode(true);
			} else if (node.nodeType == Node.ELEMENT_NODE && (tagWhitelist_[node.tagName] || contentTagWhiteList_[node.tagName])) {

				//remove useless empty spans (lots of those when pasting from MS Outlook)
				if ((node.tagName == "SPAN" || node.tagName == "B" || node.tagName == "I" || node.tagName == "U")
					&& node.innerHTML.trim() == "") {
					return document.createDocumentFragment();
				}

				if (contentTagWhiteList_[node.tagName])
					newNode = iframedoc.createElement('DIV'); //convert to DIV
				else
					newNode = iframedoc.createElement(node.tagName);

				for (var i = 0; i < node.attributes.length; i++) {
					var attr = node.attributes[i];
					if (attributeWhitelist_[attr.name]) {
						if (attr.name == "style") {
							for (s = 0; s < node.style.length; s++) {
								var styleName = node.style[s];
								if (cssWhitelist_[styleName])
									newNode.style.setProperty(styleName, node.style.getPropertyValue(styleName));
							}
						}
						else {
							if (uriAttributes_[attr.name]) { //if this is a "uri" attribute, that can have "javascript:" or something
								if (attr.value.indexOf(":") > -1 && !startsWithAny(attr.value, schemaWhiteList_))
									continue;
							}
							newNode.setAttribute(attr.name, attr.value);
						}
					}
				}
				for (i = 0; i < node.childNodes.length; i++) {
					var subCopy = makeSanitizedCopy(node.childNodes[i]);
					newNode.appendChild(subCopy, false);
				}
			} else {
				newNode = document.createDocumentFragment();
			}
			return newNode;
		};

		var resultElement = makeSanitizedCopy(iframedoc.body);
		document.body.removeChild(iframe);
		return resultElement.innerHTML
			.replace(/<br[^>]*>(\S)/g, "<br>\n$1")
			.replace(/div><div/g, "div>\n<div"); //replace is just for cleaner code
	}

	function startsWithAny(str, substrings) {
		for (var i = 0; i < substrings.length; i++) {
			if (str.indexOf(substrings[i]) == 0) {
				return true;
			}
		}
		return false;
	}

	this.AllowedTags = tagWhitelist_;
	this.AllowedAttributes = attributeWhitelist_;
	this.AllowedCssStyles = cssWhitelist_;
	this.AllowedSchemas = schemaWhiteList_;
});
