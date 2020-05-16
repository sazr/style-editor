/*!
 * Visual Designer JQuery Plugin
 * Author: Sam Zielke-Ryner
 * Licensed under ...
 */
 
;(function ( $, window, document, undefined ) {

	$.widget( "vd.styleEditor", {

		options: {
			mediaRules: {
				'tablet': {
					regex: new RegExp('\\(max-width\\s*:\\s*768px\\s*\\)', 'gmi'),
					text: '@media (max-width: 768px)',
					emulationPrefix: 'body.vd-rtablet',
				},
				'mobile': {
					regex: new RegExp('\\(max-width\\s*:\\s*414px\\s*\\)', 'gmi'),
					text: '@media (max-width: 414px)',
					emulationPrefix: 'body.vd-rmobile',
				},
				// 'desktop-only': {
				// 	regex: new RegExp('\\(min-width\\s*:\\s*769px\\s*\\)', 'gmi'),
				// 	text: '@media (min-width: 769px)',
				// },
			}
		},

		_create: function () {
			if (!this.options.style || !this.options.style.length)
				if (this.element.prop("tagName").trim().toLowerCase() == 'style')
					this.options.style = this.element;
				else throw 'styleEditor must have a style option pointing to a <style> element';

			this.options.style = $(this.options.style);

			// Add media rules if not already present
			var mainSheet = this.getMainSheet();
			for (var mediaRule in this.options.mediaRules) {
				var sheet = this.getMediaSheet(this.options.mediaRules[mediaRule].regex);
				if (!sheet) {
					this.registerElementStyle(mainSheet, this.options.mediaRules[mediaRule].text);
					sheet = this.getMediaSheet(this.options.mediaRules[mediaRule].regex);
				}
				this.options.mediaRules[mediaRule].sheet = sheet;
			}
		},

		getMainSheet: function() {
			return this.options.style[0].sheet;
		},

		getMediaSheet: function(mediaRuleRegex) {
			var mainSheet = this.getMainSheet();
			return $(mainSheet.cssRules).filter(function(){ return mediaRuleRegex.test(this.conditionText); })[0];
		},

		getMediaSheetByName: function(name) {
			return this.options.mediaRules[name].sheet || this.getMediaSheet(this.options.mediaRules[name].regex);
		},

		getAllSheets: function() {
			var self = this;
			var sheets = [self.getMainSheet()];
			for (var mediaRule in self.options.mediaRules)
				sheets.push(self.getMediaSheetByName(mediaRule));
			return sheets;
		},

		registerElementStyle(sheet, selector, styles, index, skipDuplicateCheck) {
			if (!skipDuplicateCheck) {
				var existing = this.getElementStyle(sheet, selector);
				// console.log('existing', existing);
				if (existing.length)
					return existing;
			}

			var i = -1;
			index = index || sheet.cssRules.length;
			styles = styles || {};
			var styleTxt = '';
			for (var styleKey in styles)
				styleTxt += styleKey + ': ' + styles[styleKey] + '; ';

			if ("insertRule" in sheet)
				i = sheet.insertRule(selector + ' { ' + styleTxt + ' } ', index);
			else if ("addRule" in sheet)
				i = sheet.addRule(selector, styleTxt, index);

			return sheet.cssRules[i];
		},

		registerElementStyles(selector, styles, index) {
			var self = this;
			var mainSheet = self.getMainSheet();
			self.registerElementStyle(mainSheet, selector, styles, index);
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.getMediaSheetByName(mediaRule);
				self.registerElementStyle(sheet, selector, styles, index);

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					self.registerElementStyle(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selector, styles, index);
			}
		},

		getElementStyle: function(sheet, selector) {
			return $(sheet.cssRules).filter(function(){return this.selectorText==selector;});
		},

		getElementStyles: function(selector, media) {
			var self = this;
			var styles = [];
			var mediaRules;
			var mainSheet = self.getMainSheet();
			// var mediaRules = (media) ? {}[media]=0 : self.options.mediaRules;

			switch (media.trim().toLowerCase()) 
			{
				case 'all':
				{
					mediaRules = self.options.mediaRules;
					var aStyle = self.getElementStyle(mainSheet, selector);
					if (aStyle && aStyle.length)
						styles.push(aStyle);
				}
				break;
				case 'desktop':
				{
					mediaRules = {};
					var dStyle = self.getElementStyle(mainSheet, selector);
					if (dStyle && dStyle.length)
						styles.push(dStyle);
				}
				break;
				default:
				{
					mediaRules = {};
					mediaRules[media] = 0;
				}
				break;
			}
			
			for (var i in mediaRules) {
				var mediaRule = self.options.mediaRules[i];
				var sheet = self.getMediaSheetByName(i);
				var mSt = self.getElementStyle(sheet, selector);
				if (mSt && mSt.length)
					styles.push(mSt);

				if (mediaRule.emulationPrefix) {
					var st = self.getElementStyle(mainSheet, mediaRule.emulationPrefix + ' ' + selector);
					if (st && st.length)
						styles.push(st);
				}
			}

			return styles;
		},

		updateElementStyle(sheet, selector, styles) {
			var eleStyle = this.getElementStyle(sheet, selector);
			if (eleStyle && eleStyle.length)
				Object.assign(eleStyle[0].style, styles);
		},

		updateElementStyles(selector, styles, media) {
			var eleStyles = this.getElementStyles(selector, media);
			if (!eleStyles || !eleStyles.length)
				return;

			for (var i in eleStyles)
				Object.assign(eleStyles[i][0].style, styles);
		},

		removeElementStyle: function(sheet, selector) {
			$(sheet.cssRules).each(function(index) { 
      	if (this.selectorText==selector) {
      		sheet.deleteRule(index);
      		return false;
      	}
      });
		},

		removeElementStyles: function(selector) {
			var self = this;
			var styles = [];
			var mainSheet = self.getMainSheet();
			styles.push( self.removeElementStyle(mainSheet, selector) );
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.getMediaSheetByName(mediaRule);
				styles.push( self.removeElementStyle(sheet, selector) );

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					styles.push( self.removeElementStyle(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selector) );
			}

			return styles;
		},

		clearElementStyle: function(sheet, selector) {
			var eleStyle = this.getElementStyle(sheet, selector);
			if (eleStyle && eleStyle.length)
				eleStyle[0].style = [];
		},

		clearElementStyles: function(selector) {
			var self = this;
			var styles = [];
			var mainSheet = self.getMainSheet();
			styles.push( self.clearElementStyle(mainSheet, selector) );
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.getMediaSheetByName(mediaRule);
				styles.push( self.clearElementStyle(sheet, selector) );

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					styles.push( self.clearElementStyle(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selector) );
			}

			return styles;
		},

		copyElementStyleTo: function(sheet, selectorFrom, selectorTo) {
			var fromStyle = this.getElementStyle(sheet, selectorFrom);
			var toStyle = this.getElementStyle(sheet, selectorTo);

			if (!fromStyle || !fromStyle.length || !toStyle || !toStyle.length)
				return;

			$.each(fromStyle[0].style, function(index, prop) {
				toStyle[0].style[prop] = fromStyle[0].style[prop];
			});

			// var fHover = this.getElementStyle(sheet, selectorFrom+':hover');
			// if (!fHover || !fHover.length)
			// 	return true;

			// var fActive = this.getElementStyle(sheet, selectorFrom+':active');
			// var fVisited = this.getElementStyle(sheet, selectorFrom+':visited');
			// var tHover = this.getElementStyle(sheet, selectorTo+':hover');
			// var tActive = this.getElementStyle(sheet, selectorTo+':active');
			// var tVisited = this.getElementStyle(sheet, selectorTo+':visited');

			// $.each(fHover[0].style, function(index, prop) {
			// 	tHover[0].style[prop] = fHover[0].style[prop];
			// });
			// $.each(fActive[0].style, function(index, prop) {
			// 	tActive[0].style[prop] = fActive[0].style[prop];
			// });
			// $.each(fVisited[0].style, function(index, prop) {
			// 	tVisited[0].style[prop] = fVisited[0].style[prop];
			// });
		},

		copyElementStylesTo: function(selectorFrom, selectorTo) {
			var sheets = this.getAllSheets();
			for (var i in sheets)
				this.copyElementStyleTo(sheets[i], selectorFrom, selectorTo);

			var self = this;
			var styles = [];
			var mainSheet = self.getMainSheet();
			styles.push( self.copyElementStyleTo(mainSheet, selectorFrom, selectorTo) );
			for (var mediaRule in self.options.mediaRules) {
				var sheet = self.getMediaSheetByName(mediaRule);
				styles.push( self.copyElementStyleTo(sheet, selectorFrom, selectorTo) );

				if (self.options.mediaRules[mediaRule].emulationPrefix)
					styles.push( self.copyElementStyleTo(mainSheet, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selectorFrom, self.options.mediaRules[mediaRule].emulationPrefix + ' ' + selectorTo) );
			}

			return styles;
		},

		toString: function(elementWrapper, ignoreSelectorsRegex) {
			var lines = []; // string builder
			elementWrapper = elementWrapper || $('html');
			ignoreSelectorsRegex = ignoreSelectorsRegex || /body\.vd-resp.*/gmi;
			var removeRedundantStyles = function(sheet, cssRules) {
				for (var i=0; i<cssRules.length; i++) {
					// if media rule: go recursive and grab its css rules
					if (cssRules[i].cssRules) {
						lines.push('@media' + cssRules[i].conditionText + ' {');
						removeRedundantStyles(cssRules[i], cssRules[i].cssRules);
						lines.push('}');
					}
	        else {      
	        	// Check the html element exists (not in trash) and is not editor specific styling
	        	var id = cssRules[i].selectorText.match(/#[a-zA-Z0-9|\-|_|\.]+/gmi);
	        	var ignore = cssRules[i].selectorText.match(ignoreSelectorsRegex); 
						if ((ignore && ignore.length) || (id && id.length > 0 && $(id[0], elementWrapper).length <= 0))
	            continue;
						
						lines.push(cssRules[i].cssText);
	        }
		    }  
			};

			var clone = $.extend(true, { }, this.options.style);
			clone = clone[0].sheet;
			removeRedundantStyles(clone, clone.cssRules);
			return lines.join('');
		},

		toJSON: function() {
			// TODO
		},
	});

})( jQuery, window, document );