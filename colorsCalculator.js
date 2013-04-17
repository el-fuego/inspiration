

/* ********************************* */
//      Getting primary colors
//      [algorithm preview]
//
//
//      Author:	Pulyaev Y.A.
//
//      Email:	watt87@mail.ru
//      VK:		el_fuego_zaz
/* ********************************* */




// Colors calculator
var window.ColorsCalculator = function (settings){

	// Add settings and replace methods
	for (var i in settings)
		if (typeof settings[i] !== 'undefined'){
			if (typeof this.settings[i] !== 'undefined' )
				this.settings[i] = settings[i]
			else
				this[i] = settings[i]
		}
	
	// Automatic calculation
	if (settings.url)
		this.calculate (settings.url, settings.onsuccess)
}



window.ColorsCalculator.prototype = {

	settings: {
		colorStep: 50,
		
		maxColorGrousCount: 20,
		minColorsCountAtGroupPersent: 3,
		
		maxPimaryColorDifference: 50,
		
		blackLevelPersent: 0.5,
		grayLevelPersent: 10,
		
		etalonColors: [],
		levels: {
			hue: [],
			saturation: [],
			value: [],
			black: '',
			white: '',
			gray: ''
		}
	},



	_error: function (msg){
		
		if (typeof console === 'object' && typeof console.error === 'function')
			console.error (msg)

		return {error: msg}
	},



	_isInArray: function (val, array){
		
		for (var i = 0, n = array.length; i < n; i++)
			if (val === array[i])
				return true;
				
		return false;
	},



	// Load image, return all pixels
	loadImage: function (url, onsuccess){

		// Create loader
		var imageVar = new Image ()
		imageVar.src = url

		// Create canvas
		var canvas = document.createElement ('canvas');
		var context = canvas.getContext ("2d");

		// Save context
		var $$ = this;
		
		// Wait for image
		imageVar.onload = function () {
		
		
			// Get image source 
			canvas.width = imageVar.width;
			canvas.height = imageVar.height;
			context.drawImage (imageVar, 0, 0, imageVar.width, imageVar.height)
			
			try {
				var image = context.getImageData (0, 0, canvas.width, canvas.height)
			}
			catch (e){
				if (typeof onsuccess === 'function')
					onsuccess ($$.error ('Can`t read image data'))
				return;
			}
		
			if (typeof onsuccess === 'function')
				onsuccess ({
					pixels:		image.data,
					canvasEl:	canvas,
					width:		imageVar.width,
					height:		imageVar.height
				})
		}
	},



	// rgbxy
	_getColorGroupKey: function (data, pixelStart){
	
		// pixelStart = r, +1 = g, +2 = b, +3 = alpha
		return 'r' + Math.floor (data.pixels[pixelStart]/this.colorStep) + 
			'g' + Math.floor (data.pixels[pixelStart+1]/this.colorStep) + 
			'b' + Math.floor (data.pixels[pixelStart+2]/this.colorStep)/* +
			'x' + ( (pixelStart/4) % data.width) +
			'y' + Math.floor ( (pixelStart/4) / data.width)*/
	},



	// Puts all pixels to groups
	getColorGroups: function (data){
		
		var colorGroups = {};
		for (var i = 0, n = data.pixels.length; i < n; i += 4) {
		
			// i = red i+1=green i+2=blue i+3=alpha
			// Add color if opacity != 0
			if (data.pixels[i+3] != 0){
				
				// Color group key
				var key = this._getColorGroupKey (data, i);
			
				// Add color to group
				if (!colorGroups[key])
					colorGroups[key] = [];
				colorGroups[key].push ([pixels[i], data.pixels[i+1], data.pixels[i+2]]);
			}
		}
		
		return colorGroups;
	},



	// Sort items by child counts
	sortByLength: function (data){
		
		var res = [];
		for (var i in data) {
			
			// Add the first item as is
			if (!res.length)
				res.push (data[i]);
			else {
			
				// Add item between items with nearest lengths
				for (var j = 0, m = res.length; j < m; j++){
				
					if (data[i].length > res[j].length){
						res.splice (j, 0, data[i]);
						break;
						
					// Add to end of list if length is minimal
					} else if (j == m - 1){
						res.push (data[i]);
						break;
					}
				}
			}
		}
	},



	// Getting average color
	_getAvrColor: function (colorsArr){
	
		var colorsSumm = [0,0,0];
		
		// Calculate the summ for Red, Green, Blue components
		for (var i = 0, n = colorsArr.length; i < n; i++){
			colorsSumm[0] += colorsArr[i][0];
			colorsSumm[1] += colorsArr[i][1];
			colorsSumm[2] += colorsArr[i][2];
		}
		
		// Return color = summRed / colorsCount
		return [
			Math.floor (colorsSumm[0]/colorsArr.length), 
			Math.floor (colorsSumm[1]/colorsArr.length), 
			Math.floor (colorsSumm[2]/colorsArr.length)
		];
	},



	_invertColor: function (color){
		return [
			255 - color[0],
			255 - color[1],
			255 - color[2]
		]
	},



	_colorToString: function (color){
		return 'rgb ('+ 
			color[0]+', '+
			color[1]+', '+
			color[2]+')'
	},



	_maximizeColorSolution: function (color){
	
		// get max level from (r, g, b)
		var maxComponentVal = Math.max (color[0], color[1], color[2])
		
		// max	~ 255
		// x	~ ?
		var coef = 255 / maxComponentVal
		
		return [
			Math.floor (color[0]*coef), 
			Math.floor (color[1]*coef), 
			Math.floor (color[2]*coef)
		]
	},



	// Is color has similar components
	_isSimilarColors: function (color, similarColor, difference){
	
		// Similarity by Red, Green, Blue
		var r = Math.abs ( color[0] - similarColor[0] );
		var g = Math.abs ( color[1] - similarColor[1] );
		var b = Math.abs ( color[2] - similarColor[2] );
		
		// Is similar colors
		if ( r <= difference && g <= difference && b <= difference )
			return true;
	
		return false;
	},



	// Is color witch similar components included
	_isSimilarColorInArray: function (color, similarColorsArray, difference){
	
		if (typeof difference === 'undefined')
			var difference = 0
	
		for (var i = 0, n = similarColorsArray.length; i < n; i++)
			if ( this._isSimilarColors (color, similarColorsArray[i], difference) )
				return similarColorsArray[i]
		
	
		return false
	},



	_getMaxSimilarColor: function (color, similarColorsArray){
		
		var similarColor = false;
		
		for (var i = 10; i == 10 || similarColor == false; i += 5 )
			similarColor = this._isSimilarColorInArray (color, similarColorsArray, i);
			
		return similarColor;
	},



	_roundColor: function (color){
		
		return [
			Math.round (color[0]),
			Math.round (color[1]),
			Math.round (color[2])
			]
	},



	// Return [0..1, 0..1, 0..1]
	_getHsvCoef: function (color){
	
		var result = {};
	
		r = color[0] / 255;
		g = color[1] / 255;
		b = color[2] / 255;
 
		var minVal = Math.min (r, g, b);
		var maxVal = Math.max (r, g, b);
		var delta = maxVal - minVal;
		
		result.v = maxVal;

		if (delta == 0) {
			result.h = 0;
			result.s = 0;
		} else {
			result.s = delta / maxVal;
			var del_R = (((maxVal - r) / 6) + (delta / 2)) / delta;
			var del_G = (((maxVal - g) / 6) + (delta / 2)) / delta;
			var del_B = (((maxVal - b) / 6) + (delta / 2)) / delta;
 
			if (r == maxVal) { result.h = del_B - del_G; }
			else if (g == maxVal) { result.h = (1 / 3) + del_R - del_B; }
			else if (b == maxVal) { result.h = (2 / 3) + del_G - del_R; }
 
			if (result.h < 0) { result.h += 1; }
			if (result.h > 1) { result.h -= 1; }
		}
		
		return [
			Math.round (result.h * 1000 ) / 1000,
			Math.round (result.s * 1000 ) / 1000,
			Math.round (result.v * 1000 ) / 1000
		]
		
	},



	// Calculate color component level
	_getLeveledComponent: function (val, levelsCount, corrector){
	
		if (typeof corrector === 'undefined') 
			var corrector = 0;
			
		val = (val * (levelsCount-1)) + corrector;
		if (val < 0) return (levelsCount - 1) + val;
		if (val > (levelsCount - 1)) return val - (levelsCount - 1);
		
		return val;
	},



	_getLeveledHvs: function (hvsCoefColor){
		return [
			Math.round (this._getLeveledComponent (hvsCoefColor[0], this.settings.levels.hue.length, 0.5) * 1000 ) / 1000,
			Math.round (this._getLeveledComponent (hvsCoefColor[1], this.settings.levels.saturation.length) * 1000 ) / 1000,
			Math.round (this._getLeveledComponent (hvsCoefColor[2], this.settings.levels.value.length) * 1000 ) / 1000
		]
	},



	_getLevel: function (leveledHvsColor){
		
		// Test black
		if (leveledHvsColor[2] <= (this.settings.levels.value.length - 1) * this.settings.blackLevelPersent / 100)
			return [
				this.settings.levels.black, 
				'', 
				''
			];
			
		// Test white
		if (leveledHvsColor[2] >= (this.settings.levels.value.length - 1) * (1 - this.settings.blackLevelPersent / 100) )
			return [
				this.settings.levels.white, 
				'', 
				''
			];
			
		// Test gray
		if (leveledHvsColor[1] <= (this.settings.levels.saturation.length - 1) * this.settings.grayLevelPersent / 100)
			return [
				this.settings.levels.gray, 
				'',
				this.settings.levels.value [Math.round (leveledHvsColor[2])]
			];
		
		// Colored
		return [
			this.settings.levels.hue[Math.round (leveledHvsColor[0])], 
			this.settings.levels.saturation[Math.round (leveledHvsColor[1])],
			this.settings.levels.value[Math.round (leveledHvsColor[2])]
		];
	},



	_getEtalon: function (color){
	
		for (var j = 0; j < 1; j += 0.01 )
			for (var i in etalonColors)
				if ( this._isSimilarColors (color, etalonColors[i].color, j) )
					return etalonColors[i];
			
	
		return false
	},



	// ----------------------------------
	// Return different colors at groups
	getDifferentColorsFromGroups: function (colorGroups){
	
		var ret = [];
	
		// Calculate the min colors count to show
		var maxColorsColunt = colorGroups[0].length;
		var minCountToDisplay = maxColorsColunt * this.settings.minColorsCountAtGroupPersent / 100;
		
		for (var j = 0, m = colorGroups.length; 
			j < m && j < this.settings.maxColorGrousCount && colorGroups[j].length > minCountToDisplay; 
			j++){
			
			
			// Average color
			ret.push (this._getAvrColor (colorGroups[j]) )
		
		}
		
		return ret
	},



	// ----------------------------------
	// Find different colors. Return first of each similar
	getPrimaryColors: function (colors){
		var ret = [];
		for (var i = 0, n = colors.length; i < n; i++){
			
			// Exclude similar colors
			if (!this._isSimilarColorInArray (colors[i], ret, this.settings.maxPimaryColorDifference)){
			
				ret.push (colors[i]);
			}
		}
		
		return ret
	},



	// ----------------------------------
	// Find etalon colors
	getEtalons: function (colors){
		var ret = [];
		for (var i = 0, n = colors.length; i < n; i++){
			
			// Find etalon
			var etalonColorObj = this._getEtalon (colors[i]);
			
			if (!this._isInArray (etalonColorObj, ret)){
		
				ret.push (etalonColorObj);
		
			}
		}
	},



	// ----------------------------------
	// Show leveled colors
	getLevels: function (colors){
		var ret = [];
		for (var i = 0, n = colors.length; i < n; i++){
			
			// Find level
			var levelObj = this._getLevel (this._getLeveledHvs (this._getHsvCoef (colors[i])));
			
			if (!this._isInArray (levelObj, ret)){
		
				ret.push (levelObj);
		
			}
		}
	},

	
	
	calculate: function (url, onsuccess){
		var self = this;
		
		this.loadImage (url, function (imageData){
			
			var groups = self.sortByLength (self.getColorGroups (imageData));
			
			/* 
			onsuccess ({
				averageColors: 
				primaryColors: 
				etalons: 
				levels: 
			})*/
		})
	
	}
};