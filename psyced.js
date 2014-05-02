$(document).ready(function() {
	var aElement = $("#eAudio")[0];
	// http://78.46.73.237:8000/schizoid
	// http://88.198.48.36:8000/prog
	var aSrc = "http://78.46.73.237:8000/schizoid";
	var aFftSize = 2048;
	var aContext;
	var aAnalyser;
	var aFreqDomain;
	var aTimeDomain;
	
	aElement.src = aSrc;
	
	var cElement = $("#eCanvas")[0];
	var	cWidth;
	var cHeight;
	var cContext;
	
	//var cTelement = document.createElement('canvas');
	

	//Init Audio
	if (typeof AudioContext !== "undefined") {
		aContext = new AudioContext();
	} else if (typeof webkitAudioContext !== "undefined") {
		aContext = new webkitAudioContext();
	} else {
		alert("Audio API is not supported by your browser!");
		return;
	}
	
	aAnalyser = aContext.createAnalyser();
	aAnalyser.fftSize = aFftSize;
	aFreqDomain = new Uint8Array(aAnalyser.frequencyBinCount);
	aTimeDomain = new Uint8Array(aAnalyser.frequencyBinCount);
	
	// Hook up the audio routing...
	// player -> analyser -> speakers
	// (Do this after the player is ready to play - https://code.google.com/p/chromium/issues/detail?id=112368#c4)
	$(aElement).bind('canplay', function() {
		var source = aContext.createMediaElementSource(this);
		source.connect(aAnalyser);
		aAnalyser.connect(aContext.destination);
	});
	
	//Init Canvas
	cContext = cElement.getContext("2d");
	//cTcontext = cTelement.getContext("2d");
	
	var resizeCanvas = function() {
		cWidth = window.innerWidth;
		cHeight = window.innerHeight;
		cElement.width = cWidth;
		cElement.height = cHeight;
		//cTelement.width = cWidth;
		//cTelement.height = cHeight;
	}
	$(window).resize(resizeCanvas);
	
	
	//Init requestAnimationFrame
	// requestAnimationFrame polyfill by Erik Möller
	// fixes from Paul Irish and Tino Zijdel
	// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
		|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function (callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function () {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
	}

//#################################################################################################
	var afterGlow = function(alphaFadingRatio, offset, direction) {
		
		direction = ((direction % 360) / 180) * Math.PI;
		var left = Math.sin(direction);
		left = left * offset;
		var top = Math.cos(direction);
		top = top * offset;
		
		var cImageData = cContext.getImageData(left, top, cWidth, cHeight);

		alphaFadingRatio = 2.55 * alphaFadingRatio;
		
		for(var i = 0; i < cImageData.data.length; i += 4) {
			var alpha = cImageData.data[i + 3];
			if(alpha > alphaFadingRatio) {
				cImageData.data[i + 3] = Math.round(alpha - alphaFadingRatio);
			}
			else{
				cImageData.data[i + 3] = 0;
			}
		}
		//cContext.clearRect(0, 0, cWidth, cHeight)
		cContext.putImageData(cImageData, 0, 0);
	};
	
	var afterGlow2 = function(alphaFadingRatio, offset, direction) {
		
		
		direction = ((direction % 360) / 180) * Math.PI;
		var left = Math.sin(direction) * offset;
		var top = Math.cos(direction) * offset;
		
		
		
		cTcontext.canvas = cContext.canvas;
		
		cContext.clearRect(0, 0, cWidth, cHeight);
		cContext.save();
		cContext.globalAlpha = 0.5;
		cContext.drawImage(cTcontext.canvas, left, top);
		
		cContext.restore();
		
		
		
	};
	var huemod = 0;
	var startAnimation = function() { 
		requestAnimationFrame(startAnimation);
		huemod = 0;
		for(var i = 0; i < aFreqDomain.length; i++) {
			huemod = huemod + aFreqDomain[i] + aTimeDomain[i];
		}
		huemod = huemod / aFreqDomain.length;
		huemod = huemod % 360;

		
		aAnalyser.getByteTimeDomainData(aTimeDomain);
		aAnalyser.getByteFrequencyData(aFreqDomain);
		
		//afterGlow(33, 0, 0);
		cContext.clearRect(0,0,cWidth, cHeight);
			
		for(var i = 0; i < aFreqDomain.length; i++){
			cContext.save();
			cContext.translate(0.5, 0.5);
			cContext.beginPath();
			
			cContext.arc(i * cWidth / aFreqDomain.length - 1 , 80 + aTimeDomain[i] * 3, (((aFreqDomain[i] * 100) / 255) * (30 / 100))+4, 0, 2 * Math.PI, false);
			//cContext.fillStyle = 'green';
			//cContext.fill();
			var hue = (i + huemod) *  360 / aFreqDomain.length;
			var sat =  50 + ((((aFreqDomain[i] + aTimeDomain[i] / 2) * 100) / 255) * (50 / 100));
			cContext.globalCompositeOperation = "lighter";
			
			//cContext.lineWidth = (((aFreqDomain[i] * 100) / 255) * (2 / 100))+2;
			cContext.lineWidth = 1;
			cContext.strokeStyle = 'hsla(' + hue +  ', '+ sat + '%, 60%, 1)';
			/*
			cContext.shadowColor = 'hsla(' + hue +  ', '+ sat + '%, 70%, 1)';
			cContext.shadowOffsetX = 0;
			cContext.shadowOffsetY = 0;
			cContext.shadowBlur = 1;
			*/
						
			cContext.stroke();
			cContext.restore();
		}
		
		
		
	}; 
	aAnalyser.smoothingTimeConstant = "0.8";
	aElement.play();
	resizeCanvas();
	startAnimation();
});