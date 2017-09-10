"use strict";

var	image = new Image();
var program, gl;
var coinsObjectArray = [];
var then = 0;

var numberOfCoins = 60;
var fountainHeight = 520;
var fountainWidthX = 120;

main();


function main() {
	image.src = "images/coins.png"; 
	image.onload = function() {
		var canvas = document.getElementById("canvas");
		gl = canvas.getContext("webgl");
		if (!gl) {
			return;
		}
		//transparent PNG background setup
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		
		
		program = createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
		gl.useProgram(program);
		
		var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
		var texcoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				0.0,  0.0,
				1.0,  0.0,
				0.0,  1.0,
				0.0,  1.0,
				1.0,  0.0,
				1.0,  1.0,
		]), gl.STATIC_DRAW);

		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		
		gl.enableVertexAttribArray(texcoordLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	
		var size = 2;          
		var type = gl.FLOAT;   
		var normalize = false;
		var stride = 0;        
		var offset = 0;        
		gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);
		
		var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
		
		requestAnimationFrame( animate );
	}

}
function animate(now) {
	const deltaTime = now - then;
	then = now;
	
	render();
	update(deltaTime);

	requestAnimationFrame( animate );
}

function update(delta){
	if (coinsObjectArray.length < numberOfCoins){
		generateCoin();
	}
	
	for (var i=0; i < coinsObjectArray.length; i++){
		coinsObjectArray[i].update(delta);
	}
}

function render(){
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
}

function generateCoin(){
	var randomRotationDuration = (5+(Math.random()*20)).toFixed(1);
	var randomYVelocity = (fountainHeight+(Math.random()*0.5*fountainHeight)).toFixed(1);
	var randomXVelocity = (-fountainWidthX+(Math.random()*2*fountainWidthX)).toFixed(1);
	
	var coin = new coinObject(10, 5, 50, randomRotationDuration, (gl.canvas.width-100)/2, 500, randomXVelocity, randomYVelocity); //#tilesHoriz, #tilesVert, #numTiles, tileDisplayDuration, coordX, coordY, velocityX, velocityY
	coinsObjectArray.push(coin);
}

function drawCoin(x, y, textureOffsetX, textureOffsetY){
	
	var positionLocation = gl.getAttribLocation(program, "a_position");
	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	setRectangle(gl, x, y, 50, 50);

	gl.useProgram(program);
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	var size = 2;          
	var type = gl.FLOAT;   
	var normalize = false; 
	var stride = 0;        
	var offset = 0;      
	gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

	var scaleLocation = gl.getUniformLocation(program, "u_scale");
	gl.uniform2f(scaleLocation, 0.1, 0.2);

	var offsetLocation = gl.getUniformLocation(program, "u_offset");
	gl.uniform2f(offsetLocation, textureOffsetX, textureOffsetY);

	// Draw the rectangle.
	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	var count = 6;
	gl.drawArrays(primitiveType, offset, count);
	
	function setRectangle(gl, x, y, width, height) {
		var x1 = x;
		var x2 = x + width;
		var y1 = y;
		var y2 = y + height;

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			 x1, y1,
			 x2, y1,
			 x1, y2,
			 x1, y2,
			 x2, y1,
			 x2, y2,
		]), gl.DYNAMIC_DRAW);
	}
}

function coinObject(tilesHoriz, tilesVert, numTiles, tileDisplayDuration, coordX, coordY, vX, vY){
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	this.numberOfTiles = numTiles;
	this.tileDisplayDuration = tileDisplayDuration;
	this.coordX = coordX;
	this.coordY = coordY;
	this.vX = vX;
	this.vY = vY;
	
	this.currentDisplayTime = 0;
	this.currentTile = 0;
	this.textureOffsetX = 0;
	this.textureOffsetY = 0;

	this.update = function(delta){
		this.currentDisplayTime += delta;
		var textureOffsetX
		var textureOffsetY
		while (this.currentDisplayTime > this.tileDisplayDuration){
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
			
			this.textureOffsetX = currentColumn/10;
			this.textureOffsetY = currentRow/5;
		}
		var acceleration = -0.6;
		if (this.vY >= -500){
			this.vY += acceleration*delta;
			this.vY = parseFloat(this.vY);
			this.vY.toFixed(3);
		}
		this.coordX = this.coordX+this.vX*delta*0.001;
		this.coordY = this.coordY-(this.vY*delta*0.001);

	drawCoin(this.coordX, this.coordY, this.textureOffsetX, this.textureOffsetY);
	}
}

//--------------------------------------------

function createProgramFromScripts(
	gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
	var shaders = [];
	for (var ii = 0; ii < shaderScriptIds.length; ++ii) {
		shaders.push(createShaderFromScript(
				gl, shaderScriptIds[ii], gl[defaultShaderType[ii]], opt_errorCallback));
	}
	return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}
function createShaderFromScript(
	gl, scriptId, opt_shaderType, opt_errorCallback) {
	var shaderSource = "";
	var shaderType;
	var shaderScript = document.getElementById(scriptId);
	if (!shaderScript) {
		throw ("*** Error: unknown script element" + scriptId);
	}
	shaderSource = shaderScript.text;

	if (!opt_shaderType) {
		if (shaderScript.type === "x-shader/x-vertex") {
			shaderType = gl.VERTEX_SHADER;
		} else if (shaderScript.type === "x-shader/x-fragment") {
			shaderType = gl.FRAGMENT_SHADER;
		} else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
			throw ("*** Error: unknown shader type");
		}
	}

	return loadShader(
			gl, shaderSource, opt_shaderType ? opt_shaderType : shaderType,
			opt_errorCallback);
}

var defaultShaderType = [
	"VERTEX_SHADER",
	"FRAGMENT_SHADER",
];

function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
	// Create the shader object
	var shader = gl.createShader(shaderType);

	// Load the shader source
	gl.shaderSource(shader, shaderSource);

	// Compile the shader
	gl.compileShader(shader);

	// Check the compile status
	var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!compiled) {
		// Something went wrong during compilation; get the error
		var lastError = gl.getShaderInfoLog(shader);
		errFn("*** Error compiling shader '" + shader + "':" + lastError);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}
function createProgram(
	gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
	var program = gl.createProgram();
	shaders.forEach(function(shader) {
		gl.attachShader(program, shader);
	});
	if (opt_attribs) {
		opt_attribs.forEach(function(attrib, ndx) {
			gl.bindAttribLocation(
					program,
					opt_locations ? opt_locations[ndx] : ndx,
					attrib);
		});
	}
	gl.linkProgram(program);

	// Check the link status
	var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!linked) {
			// something went wrong with the link
			var lastError = gl.getProgramInfoLog(program);
			errFn("Error in program linking:" + lastError);

			gl.deleteProgram(program);
			return null;
	}
	return program;
}