var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var points, counter, level, errors, userLevel, startTime, animationId;

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

addEventListener('keydown', function (event) {
	switch (event.code) {
		case 'Enter':
			init();
			setTimeout(hideAll, 1000);
			animate();
			break;
		case 'Space':
			animate();
			break;
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
					reduce();
					mix();
				}
			} else {
				points[i].error();
				if (errors == 0) {
					cancelAnimationFrame(animationId);
					ctx.beginPath();
					ctx.save();
					ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.restore();
					ctx.closePath();

					ctx.beginPath();
					ctx.save();
					ctx.shadowBlur = 10;
					ctx.shadowColor = '#F50338';
					ctx.font = "bold 40pt Courier New";
					ctx.fillStyle = '#F50338';
					let text = 'Уровень вашей ';
					ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 - 200);
					text = 'фотографической памяти';
					ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 - 100);
					if (userLevel < 2)
						text = userLevel.toFixed(2) + ' - фу таким быть!';
					else if (userLevel < 4)
						text = userLevel.toFixed(2) + ' - очень плохо!';
					else if (userLevel < 6)
						text = userLevel.toFixed(2) + ' - не плохо!';
					else if (userLevel < 7)
						text = userLevel.toFixed(2) + ' - хорошо!';
					else if (userLevel < 8)
						text = userLevel.toFixed(2) + ' - отлично!';
					else if (userLevel < 10)
						text = userLevel.toFixed(2) + ' - это просто не вероятно!';
					else
						text = userLevel.toFixed(2) + ' - я вам завидую!';
					ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2);
					ctx.font = "bold 20pt Courier New";
					text = 'Пробел - продолжить, Enter - начать с начала';
					ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 + 100);
					ctx.font = "bold 20pt Courier New";
					text = '[Создатель: Ким Максим]';
					ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 + 200);
					ctx.restore();
					ctx.closePath();
				}
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

function reduce() {
	points[0].reduce();

	for (let i = 1; i < points.length; i++) {
		points[i].radius = points[0].radius;
		points[i].textSize = points[0].textSize;
	}
}

// Инициализация
function init() {
	points = [];
	counter = 0;
	level = 1;
	errors = 0;
	userLevel = 0;
	startTime = 0;
	let radius = 120;
	let x = randomIntFromRange(radius, canvas.width - radius);
	let y = randomIntFromRange(radius, canvas.height - radius);

	points.push(new Point(0, x, y));
}

init();

// Повторно запускающаяся функция для анимации
function animate() {
	animationId = requestAnimationFrame(animate);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	points.forEach(point => {
		point.update(points);
	});


	drawText('Уровень вашей памяти: ' + userLevel.toFixed(2), 30, 40, 20, '#666666');
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
