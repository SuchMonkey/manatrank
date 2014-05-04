$(document).ready(function() {
	var aElement = $("#eAudio")[0];
	// http://78.46.73.237:8000/schizoid
	// http://88.198.48.36:8000/prog
	var aSrc = "http://78.46.73.237:8000/schizoid";
	var aFftSize = 2048;
	var aSmoothingTimeConstant = "0.8";
	var aContext;
	var aAnalyser;
	
	var aFreqDomain;
	var aTimeDomain;
	
	aElement.src = aSrc;
	
	var cElement = $("#eCanvas")[0];
	var	cWidth;
	var cHeight;
	var cContext;

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
	aAnalyser.smoothingTimeConstant = aSmoothingTimeConstant;
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
	
	var resizeCanvas = function() {
		cWidth = window.innerWidth;
		cHeight = window.innerHeight;
		cElement.width = cWidth;
		cElement.height = cHeight;
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

	var huemod = 0;
	var startAnimation2 = function() { 
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
	
	var animationFrame;
	var animationCount = 0;
	
	var animationSettings = function() {
		// AA hack
		cContext.translate(0.5, 0.5);
		// composting
		cContext.globalCompositeOperation = "lighter";
	};
	
	var animation = function(hrt) {
	
		// Update aAnalyser Data
		aAnalyser.getByteTimeDomainData(aTimeDomain);
		aAnalyser.getByteFrequencyData(aFreqDomain);
		
		// +1 animationCount mod 360 - would deliver valid deg value
		animationCount = (animationCount + 1) % 360;
		
		// Prepare Canvas for next Frame
		cContext.clearRect(0,0,cWidth, cHeight);
		
		// for each aAnalyser Data
		cContext.save();
			cContext.beginPath();
			for(var i = 0; i < aAnalyser.frequencyBinCount; i++) {
				
				drawWaveForm(i);
				
			}
			cContext.lineJoin = "round";
			
			cContext.lineWidth = 1;
			cContext.strokeStyle = 'black';
			cContext.stroke();
		cContext.restore();
		
		// other Animation stuff
		
				
		animationFrame = requestAnimationFrame(animation);
	};
	
	var drawWaveForm = function(i) {
		var x = ( cWidth / ( aAnalyser.frequencyBinCount - 1 ) ) * ( i );
		var y = ( aTimeDomain[i] * 100 / 255 ) * ( cHeight / 100);

		cContext.lineTo(x, y);
		cContext.arc(x, y, 5, 0, 2 * Math.PI, false);
	};
	
	
	
	var playerStatus = false;
	
	var start = function() {
		if(!playerStatus) {
			aElement.play();
			animationSettings();
			animationFrame = requestAnimationFrame(animation);
			playerStatus = true;
			console.log("started " + playerStatus);
		}
	};
	
	var stop = function() {
		if(playerStatus) {
			aElement.pause();
			cancelAnimationFrame(animationFrame);
			playerStatus = false;
			console.log("stopped " + playerStatus);
		}
	};
	
	//Hook up Buttons
	$("#btnPlay").click(start);
	
	$("#btnStop").click(stop);
	
	resizeCanvas();
	start();
});