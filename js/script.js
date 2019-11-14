var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var points = [];
var counter = 0;
var level = 1;
var errors = 0;
var userLevel = 0;
var startTime = 0;

canvas.width = innerWidth;
canvas.height = innerHeight;

// Отслеживание изменения размера окна
addEventListener('resize', function () {
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	for (let i = 0; i < points.length; i++) {
		if (points[i].x > canvas.width) {
			points[i].x = randomIntFromRange(points[i].radius, canvas.width - points[i].radius);
		}
		if (points[i].y > canvas.height) {
			points[i].y = randomIntFromRange(points[i].radius, canvas.height - points[i].radius);
		}
	}
});

// Отслеживание клика
addEventListener('click', function (e) {
	let mx = e.clientX;
	let my = e.clientY;
	for (let i = 0; i < points.length; i++) {
		if (getDistance(mx, my, points[i].x, points[i].y) - points[i].radius < 0) {
			if (counter == points[i].id) {
				points[i].show();
				counter++;
				if (counter == points.length) {
					counter = 0;
					points.push(new Point(points.length, 0, 0));
					level++;
					if (errors == 0) {
						userLevel += 1 - getTimeSpent() / 10;
					}
					mix();
				}
			} else {
				points[i].error();
				errors++;
			}
			break;
		}
	}
});

function getTimeSpent() {
	if (startTime == 0) {
		startTime = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds();
		return 0;
	}
	else {
		return new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds() - startTime - level * 0.8;
	}
}

function drawLine(x1, y1, x2, y2) {
	this.ctx.beginPath();
	this.ctx.save();
	this.ctx.moveTo(x1, y1);
	this.ctx.lineTo(x2, y2);
	this.ctx.lineWidth = 2;
	this.ctx.strokeStyle = '#f5f5f5';
	this.ctx.stroke();
	this.ctx.restore();
	this.ctx.closePath();
}

function drawText(text, x, y, size, color) {
	ctx.beginPath();
	ctx.save();
	ctx.font = size + 'pt Jura';
	ctx.fillStyle = color;
	ctx.fillText(text, x, y);
	ctx.restore();
	ctx.closePath();
}

function mix() {
	for (let i = 0; i < points.length; i++) {
		let x = randomIntFromRange(points[i].radius, canvas.width - points[i].radius);
		let y = randomIntFromRange(points[i].radius, canvas.height - points[i].radius);

		for (let j = 0; j < i; j++) {
			if (getDistance(x, y, points[j].x, points[j].y) - points[i].radius * 2 < 0) {
				x = randomIntFromRange(points[i].radius, canvas.width - points[i].radius);
				y = randomIntFromRange(points[i].radius, canvas.height - points[i].radius);

				j = -1;
			}
		}

		points[i].x = x;
		points[i].y = y;
		points[i].notError();
	}
	setTimeout(hideAll, 1000);
}

// Инициализация
function init() {
	let radius = 60;
	let x = randomIntFromRange(radius, canvas.width - radius);
	let y = randomIntFromRange(radius, canvas.height - radius);

	points.push(new Point(0, x, y));
}

init();

// Повторно запускающаяся функция для анимации
function animate() {
	requestAnimationFrame(animate);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	points.forEach(point => {
		point.update(points);
	});


	drawText('Уровень вашей памяти: ' + userLevel.toFixed(1), 30, 40, 20, '#666666');
	drawText('Кол-во ошибок: ' + errors, 30, 80, 20, '#666666');
	drawText('Уровень: ' + level, 30, 120, 20, '#666666');
}

animate();

function hideAll() {
	points.forEach(point => {
		point.hide(points);
	});
	startTime = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds();
}

setTimeout(hideAll, 1000);

function randomIntFromRange(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

function getDistance(x1, y1, x2, y2) {
	let xDistance = x2 - x1;
	let yDistance = y2 - y1;

	return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}
