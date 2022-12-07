
canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
engine = Matter.Engine.create();
engine.world.gravity.y = 0;

assets = {}

debugDraw = true;
debug1 = true;

globalAlpha = ctx.globalAlpha;

elemStrokeStyle = "rgb(0,0,0)";
elemFillStyle = "rgb(255,255,255)";

CAMERA_PANIC = 100;

function debugGrid()
{
	ctx.strokeStyle = 'blue';

	for(i = 0; i < 32; i++) {
		ctx.beginPath();
		ctx.moveTo(0, i*64);
		ctx.lineTo(canvas.width, i*64);
		ctx.stroke();
	}

	for(i = 0; i < 18; i++) {
		ctx.beginPath();
		ctx.moveTo(i*64, 0);
		ctx.lineTo(i*64, canvas.height);
		ctx.stroke();
	}
}

function cameraDebugBounds()
{
	ctx.strokeStyle = 'red';
	ctx.strokeRect(CAMERA_PANIC,
				   CAMERA_PANIC,
				   canvas.width-2*CAMERA_PANIC,
				   canvas.height-2*CAMERA_PANIC);
}

level = null;
keyMap = {};
lerper = [];


firstCallFadeIn = true;
firstCallFadeOut = true;
firstShift1 = true;
firstShift0 = true;
transitionDone = true;

function shift1()
{
	if(firstShift1)
	{
		for (obj of level.gameObjects)
		{
			if(obj.shift == 0)
			{
				obj.disappear();
			}
			else if(obj.shift == 1)
			{
				obj.reappear();
			}
		}
		firstShift1 = false;
		transitionDone = false;
	}
	if(level.shift >= 1)
	{
		level.shift = 1;
		firstShift1 = true;
		transitionDone = true;
		return false;
	}
	col = Math.floor(255*level.shift);
	notcol = 255-col;
	strokeCol = `rgb(${col},${col},${col})`;
	fillCol = `rgb(${notcol},${notcol},${notcol})`;
	elemStrokeStyle = strokeCol;
	elemFillStyle = fillCol;
	document.body.style.backgroundColor =  fillCol;
	level.shift += 0.075;

	return true;
}

function shift0()
{
	if(firstShift0)
	{
		for (obj of level.gameObjects)
		{
			if(obj.shift == 1)
			{
				obj.disappear();
			}
			else if(obj.shift == 0)
			{
				obj.reappear();
			}
		}
		firstShift0 = false;
		transitionDone = false;
	}
	if(level.shift <= 0)
	{
		level.shift = 0;
		firstShift0 = true;
		transitionDone = true;
		return false;
	}
	col = Math.floor(255*level.shift);
	notcol = 255-col;
	strokeCol = `rgb(${col},${col},${col})`;
	fillCol = `rgb(${notcol},${notcol},${notcol})`;
	elemStrokeStyle = strokeCol;
	elemFillStyle = fillCol;
	document.body.style.backgroundColor =  fillCol;
	level.shift -= 0.075;

	return true;
}

function fadeIn(callBack)
{
	if(firstCallFadeIn)
	{
		globalAlpha = 0;
		firstCallFadeIn = false;
	}
	globalAlpha += 0.05;

	if(globalAlpha >= 1)
	{
		globalAlpha = 1;
		callBack();
		firstCallFadeIn = true;
		return false;
	}

	return true;
}


function fadeOut(callBack)
{
	if(firstCallFadeOut)
	{
		globalAlpha = 1;
		firstCallFadeOut = false;
	}
	globalAlpha -= 0.05;
	console.log('called!');
	if(globalAlpha <= 0)
	{
		globalAlpha = 0;
		callBack();
		firstCallFadeOut = true;
		return false;
	}

	return true;
}


class GameObject {
	constructor(name) {
		this.name = name;
		this.shift = 2;
		this.physics = null;
	}
	draw() {}
	disappear() {console.log('called??')}
	reappear() {}

}

class WallObject extends GameObject{
	constructor(name, x, y, width, height) {
		super(name);
		this.name = name;
		this._x = x;
		this._y = y;
		this.width = width;
		this.height = height;
		this.draw_side = "wall";
		this.active = true;

		this.physics = {
			collision : Matter.Bodies.rectangle(x+width/2, y+height/2, width, height)
		}
		Matter.Body.setStatic(this.physics.collision, true);

		Matter.World.add(engine.world, this.physics.collision);
	}

	disappear() {
		//var substitute = Matter.Bodies.rectangle(this.x+this.width/2, this.y+this.height/2, this.width, this.height, {isStatic: true});
		if(this.active)
		{
			Matter.World.remove(engine.world,this.physics.collision);
			this.active = false;
		}

	}

	reappear() {
		if(!this.active)
		{
			Matter.World.add(engine.world,this.physics.collision);
			this.active = true;
		}

	}

	get x() {
		return this.physics.collision.position.x-this.width/2;
	}

	get y() {
		return this.physics.collision.position.y-this.height/2;
	}

	draw() {
		if(!this.active)
			return;

		ctx.strokeStyle = elemStrokeStyle;

		if(this.draw_side == "wall_left") {
			ctx.beginPath();
			ctx.moveTo(this.x+this.width, this.y);
			ctx.lineTo(this.x+this.width, this.y+this.height);
			ctx.stroke();
		}
		else if(this.draw_side == "wall_right") {
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x, this.y+this.height);
			ctx.stroke();
		}
		else if(this.draw_side == "wall_top") {
			ctx.beginPath();
			ctx.moveTo(this.x, this.y+this.height);
			ctx.lineTo(this.x+this.width, this.y+this.height);
			ctx.stroke();
		}
		else if(this.draw_side == "wall_bottom") {
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x+this.width, this.y);
			ctx.stroke();
		}
		else {
			ctx.strokeRect(this.x, this.y, this.width, this.height);
		}
	}

}

class PlayerObject extends GameObject{
	//its a circle ok :(

	constructor(name, x, y) {
		super(name);
		this.direction = {x:0, y:0};
		this.radius = 25;
		this.physics =  {
			collision : Matter.Bodies.circle(x, y, this.radius)
		}
		Matter.Body.setInertia(this.physics.collision, Infinity);
		Matter.World.add(engine.world, this.physics.collision);
		this.physics.collision.frictionAir = 0.13;
	}

	get x() {
		return this.physics.collision.position.x;
	}

	get y() {
	return this.physics.collision.position.y;
	}

	move() {
		Matter.Body.applyForce(this.physics.collision,
			this.physics.collision.position, this.direction);
	}

	draw() {

		ctx.strokeStyle = elemStrokeStyle;
		ctx.fillStyle = elemFillStyle;

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius,0, 2*Math.PI);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius,0, 2*Math.PI);
		ctx.stroke();
	}

}

class SensorObject extends GameObject {

	constructor(name, x, y, width=50, height=50) {
		super(name);
		this.width = width;
		this.height = height;
		this.active = true;
		this.physics = {
			sensor : Matter.Bodies.rectangle(x+this.width/2, y+this.height/2, this.width, this.height, {
				isStatic: true,
				isSensor: true })
		};
		//
		this.physics.sensor.parentGameObject = this;
		Matter.World.add(engine.world, this.physics.sensor);
	}

	disappear() {
		//var substitute = Matter.Bodies.rectangle(this.x+this.width/2, this.y+this.height/2, this.width, this.height, {isStatic: true});
		if(this.active)
		{
			Matter.World.remove(engine.world,this.physics.sensor);
			this.active = false;
		}

	}

	reappear() {
		if(!this.active)
		{
			Matter.World.add(engine.world,this.physics.sensor);
			this.active = true;
		}

	}

	get x() {
		return this.physics.sensor.position.x-this.width/2;
	}

	get y() {
		return this.physics.sensor.position.y-this.height/2;
	}

	collisionStart(event) {
		if(debug1) console.log("sensor name: "+this.name+" collisionStart");
	}

	collisionEnd(event) {
		if(debug1) console.log("sensor name: "+this.name+" collisionEnd");
	}


	draw() {

			if(!this.active) return;

			ctx.strokeStyle = elemStrokeStyle;
			ctx.strokeRect(this.x,this.y,this.width,this.height);
			//shape
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x+this.width, this.y+this.height);
			ctx.moveTo(this.x+this.width, this.y);
			ctx.lineTo(this.x, this.y+this.height);
			ctx.stroke();

	}

}

class PlayerFinishObject extends SensorObject
{
	constructor(name, x, y)
	{
		super(name, x, y, 50, 50);
	}

	collisionStart(event) {

		if(level.nextLevel != null)
		{
		lerper.push(function (){return fadeOut(function (){level.isComplete = true;})});
		lerper.push(shift0);
		}
		//level.isComplete = true;
	}

	draw() {
		if(!this.active) return;

		ctx.strokeStyle = elemStrokeStyle;
		ctx.strokeRect(this.x,this.y,this.width,this.height);
		//shape
		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x+this.width, this.y+this.height/2);
		ctx.lineTo(this.x,this.y+this.height);
		ctx.stroke();
	}
}

class ShiftAreaObject extends SensorObject
{
	constructor(name, x, y)
	{
		super(name, x, y, 40, 40);
		this.transitionDone = true;

	}

	collisionStart(event)
	{
		if(!this.transitionDone) return;
		if(level.shift == 0)
		{
			lerper.push(shift1);
		}
		else if(level.shift == 1)
		{
			lerper.push(shift0);
		}
	}
}

function buildLevel(levelXMLDocument)
{

	keyMap = {};
	Matter.World.clear(engine.world);
	Matter.Engine.clear(engine);
	engine.world.gravity.y = 0;

	level = {
		gameObjects : [],
		sensors: [],
		player : null,
		shift: 0,
		nextLevel : null,
		isComplete : false,
		cameraPosition : {x: 0, y: 0}
	};

	$xml = $(levelXMLDocument);

	$xml.find("object[type^='wall']").each(function () {
		var wall = new WallObject(
			this.getAttribute("name"),
			parseInt(this.getAttribute("x")),
			parseInt(this.getAttribute("y")),
			parseInt(this.getAttribute("width")),
			parseInt(this.getAttribute("height")));
		wall.draw_side = this.getAttribute("type");
		var shiftXML = $(this).find("property[name~=shift]")[0];
		console.log(shiftXML)
		if(shiftXML != undefined)
		{
			console.log('here');
			wall.shift = parseInt(shiftXML.getAttribute("value"));
		}
		level.gameObjects.push(wall);
	});

	$xml.find("object[type~='button']").each(function () {
		var button = new ShiftAreaObject(
			this.getAttribute("name"),
			parseInt(this.getAttribute("x")),
			parseInt(this.getAttribute("y")));

		var shiftXML = $(this).find("property[name~=shift]")[0];
		console.log(shiftXML)
		if(shiftXML != undefined)
		{
			console.log('here');
			button.shift = parseInt(shiftXML.getAttribute("value"));
		}

		level.gameObjects.push(button);
		level.sensors.push(button.physics.sensor);
	});

	$xml.find("object[type~=player_finish]").each(function () {
		var button = new PlayerFinishObject(
			this.getAttribute("name"),
			parseInt(this.getAttribute("x")),
			parseInt(this.getAttribute("y")));


		var shiftXML = $(this).find("property[name~=shift]")[0];
		console.log(shiftXML)
		if(shiftXML != undefined)
		{
			console.log('here');
			button.shift = parseInt(shiftXML.getAttribute("value"));
		}

		level.gameObjects.push(button);
		level.sensors.push(button.physics.sensor);


	});

	var playerXML = $xml.find("object[type~='player_start']")[0];
	var player = new PlayerObject(
		playerXML.getAttribute("name"),
		parseInt(playerXML.getAttribute("x")),
		parseInt(playerXML.getAttribute("y")),
		);

	level.gameObjects.push(player);
	level.player = player;

	var nextLevelXML = $xml.find("property[name~=next_level]")
	if(nextLevelXML.length > 0)
	{
		level.nextLevel = nextLevelXML[0].getAttribute("value");
	}

	Matter.Events.off(engine, "collisionStart");
	Matter.Events.off(engine, "collisionEnd");

	Matter.Events.on(engine, "collisionStart", function (event) {
		for(var i = 0; i < event.pairs.length; i++) {
			if(level.sensors.includes(event.pairs[i].bodyA))
			{
				event.pairs[i].bodyA.parentGameObject.collisionStart(event);
			}
			else if(level.sensors.includes(event.pairs[i].bodyB))
			{
				event.pairs[i].bodyB.parentGameObject.collisionStart(event);
			}
		}
	});

	Matter.Events.on(engine, "collisionEnd", function (event) {
		for(var i = 0; i < event.pairs.length; i++) {
			if(level.sensors.includes(event.pairs[i].bodyA))
			{
				event.pairs[i].bodyA.parentGameObject.collisionEnd(event);
			}
			else if(level.sensors.includes(event.pairs[i].bodyB))
			{
				event.pairs[i].bodyB.parentGameObject.collisionEnd(event);
			}
		}
	});

	$(document).off("keydown");
	$(document).off("keyup");
	$(document).on("keydown", function (keyEvent) {
		if(keyMap[keyEvent.key] != 1) {
			keyCustomDown(keyEvent);
			keyMap[keyEvent.key] = 1;
		}
	});
	$(document).on("keyup", function (keyEvent) {
		if(keyMap[keyEvent.key] == 1) {
			keyCustomUp(keyEvent);
			keyMap[keyEvent.key] = null;
		}
	})

	lerper.push(function (){return fadeIn(function (){});});

	for (obj of level.gameObjects)
	{
		if(obj.shift == 1)
		{
			obj.disappear();
		}
		else if(obj.shift == 0)
		{
			obj.reappear();
		}
	}


}

function keyCustomDown(keyEvent) {
	if(keyEvent.key == "w")
	{
		level.player.direction.y -= 0.01;
	}
	if(keyEvent.key == "a")
	{
		level.player.direction.x -= 0.01;
	}
	if(keyEvent.key == "s")
	{
		level.player.direction.y += 0.01;
	}
	if(keyEvent.key == "d")
	{
		level.player.direction.x += 0.01;
	}
}

function keyCustomUp(keyEvent) {
	if(keyEvent.key == "w")
	{
		level.player.direction.y += 0.01;
	}
	if(keyEvent.key == "a")
	{
		level.player.direction.x += 0.01;
	}
	if(keyEvent.key == "s")
	{
		level.player.direction.y -= 0.01;
	}
	if(keyEvent.key == "d")
	{
		level.player.direction.x -= 0.01;
	}
}



//MAIN ENTRY POINT HERE!
//after assets are loaded and stuff are initialized main is called.

$.when(
   $.ajax("level0.xml"),
   $.ajax("level1.xml"),
	 $.ajax("level2.xml"),
	 $.ajax("level3.xml"),

   ).done(function (level0resp,
   					level1resp,level2resp,level3resp)
   {
   	assets["level0.xml"] = level0resp[0];
   	assets["level1.xml"] = level1resp[0];
		assets["level2.xml"] = level2resp[0];
		assets["level3.xml"] = level3resp[0];

   	buildLevel(assets["level0.xml"]);

	main(-1);
   })


tPrev = -1;
function main(tFrame)
{
	var tDelta = -1;

	requestAnimationFrame(main);

	//ctx.restore();
	ctx.clearRect(0,0,canvas.width, canvas.height)
	ctx.save();

	if(tFrame == -1)
	{
		tDelta = -1;
	}
	else if(tPrev == -1)
	{
		tPrev = tFrame;
		tDelta = -1;
	}
	else
	{
		tDelta = tFrame-tPrev;
		tPrev = tFrame;
	}

	if(tDelta != -1)
	{
		Matter.Engine.update(engine, tDelta);
	}

	//debugGrid();
	lerper = lerper.filter(function (elem){
		return elem();});

	ctx.globalAlpha = globalAlpha;

	level.player.move();
	if(level.player.x - level.cameraPosition.x < CAMERA_PANIC)
	{
		level.cameraPosition.x -= CAMERA_PANIC-(level.player.x - level.cameraPosition.x);
	}
	if(level.player.x - level.cameraPosition.x > canvas.width-CAMERA_PANIC)
	{
		level.cameraPosition.x += level.player.x-level.cameraPosition.x-(canvas.width-CAMERA_PANIC)
	}
	if(level.player.y - level.cameraPosition.y < CAMERA_PANIC)
	{
		level.cameraPosition.y -= CAMERA_PANIC-(level.player.y - level.cameraPosition.y);
	}
	if(level.player.y - level.cameraPosition.y > canvas.height-CAMERA_PANIC)
	{
		level.cameraPosition.y += level.player.y-level.cameraPosition.y-(canvas.height-CAMERA_PANIC)
	}
	//cameraDebugBounds();

	ctx.translate(-level.cameraPosition.x,-level.cameraPosition.y);
	level.gameObjects.forEach(function (elem) {
		elem.draw();
	});
	ctx.restore();
	//ctx.translate(500,0);

	if(level.isComplete && level.nextLevel != null && level.shift == 0)
	{
		buildLevel(assets[level.nextLevel])
	}

	;

}
