class MemoryTrainer {
	static INITIAL_RADIUS = 120;
	static INITIAL_POINT_COUNT = 1;
	static REVEAL_DELAY = 100;
	static GAME_OVER_DELAY = 800;
	static GAME_OVER_SCREEN_DELAY = 500;
	static HIDE_DELAY = 1000;
	static PARTICLE_COUNT = 12;
	static CLICK_SOUND_FREQ = 800;
	static CLICK_SOUND_DURATION = 0.1;
	static ERROR_SOUND_START_FREQ = 200;
	static ERROR_SOUND_END_FREQ = 100;
	static ERROR_SOUND_DURATION = 0.2;

	constructor() {
		this.canvas = document.getElementById('gameCanvas');
		this.ctx = this.canvas.getContext('2d');
		this.points = [];
		this.counter = 0;
		this.level = 1;
		this.record = this.loadRecord();
		this.animationId = null;
		this.isPaused = false;
		this.isGameOver = false;
		this.audioContext = null;

		this.initAudio();
		this.initCanvas();
		this.initEventListeners();
		this.init();
		this.animate();
	}

	initAudio() {
		try {
			this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
		} catch (e) {
			console.warn('Web Audio API not supported');
		}
	}

	playSound(frequency, duration, type = 'sine') {
		if (!this.audioContext) return;

		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.audioContext.destination);

		oscillator.frequency.value = frequency;
		oscillator.type = type;

		gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

		oscillator.start(this.audioContext.currentTime);
		oscillator.stop(this.audioContext.currentTime + duration);
	}

	playClickSound() {
		this.playSound(
			MemoryTrainer.CLICK_SOUND_FREQ,
			MemoryTrainer.CLICK_SOUND_DURATION,
			'sine'
		);
	}

	playErrorSound() {
		if (!this.audioContext) return;
		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.audioContext.destination);

		const { currentTime } = this.audioContext;
		const duration = MemoryTrainer.ERROR_SOUND_DURATION;

		oscillator.frequency.setValueAtTime(MemoryTrainer.ERROR_SOUND_START_FREQ, currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(
			MemoryTrainer.ERROR_SOUND_END_FREQ,
			currentTime + duration
		);
		oscillator.type = 'sawtooth';

		gainNode.gain.setValueAtTime(0.3, currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

		oscillator.start(currentTime);
		oscillator.stop(currentTime + duration);
	}

	initCanvas() {
		this.resizeCanvas();
		window.addEventListener('resize', () => this.handleResize());
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	handleResize() {
		this.resizeCanvas();
		this.points.forEach(point => {
			if (point.x > this.canvas.width) {
				point.x = this.randomInt(point.radius, this.canvas.width - point.radius);
			}
			if (point.y > this.canvas.height) {
				point.y = this.randomInt(point.radius, this.canvas.height - point.radius);
			}
		});
	}

	initEventListeners() {
		window.addEventListener('keydown', (e) => this.handleKeyDown(e));
		this.canvas.addEventListener('click', (e) => this.handleClick(e));
	}

	handleKeyDown(event) {
		if (event.code === 'Enter') {
			this.restart();
		}
	}

	handleClick(e) {
		if (this.isGameOver) {
			this.restart();
			return;
		}

		if (this.isPaused) return;

		const rect = this.canvas.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		const clickedPoint = this.findClickedPoint(mx, my);
		if (!clickedPoint) return;

		if (this.counter === clickedPoint.id) {
			this.handleCorrectClick(clickedPoint);
		} else {
			this.handleIncorrectClick(clickedPoint);
		}
	}

	findClickedPoint(x, y) {
		for (let i = this.points.length - 1; i >= 0; i--) {
			const point = this.points[i];
			const distance = this.getDistance(x, y, point.x, point.y);
			if (distance <= point.radius) {
				return point;
			}
		}
		return null;
	}

	handleCorrectClick(point) {
		point.show();
		this.playClickSound();
		this.counter++;

		if (this.counter === this.points.length) {
			this.completeLevel();
		}
	}

	handleIncorrectClick(point) {
		point.setError();
		this.playErrorSound();
		this.revealRemainingPoints();
		setTimeout(() => this.gameOver(), MemoryTrainer.GAME_OVER_DELAY);
	}

	revealRemainingPoints() {
		let delay = 0;
		this.points.forEach((point, index) => {
			if (point.isHidden && index >= this.counter) {
				setTimeout(() => point.showAsError(), delay);
				delay += MemoryTrainer.REVEAL_DELAY;
			}
		});
	}

	completeLevel() {
		this.counter = 0;
		this.level++;
		this.points.push(this.createNewPoint());
		this.reducePointSizes();
		this.mixPoints();
		this.updateRecord();
	}

	createNewPoint() {
		const id = this.points.length;
		const radius = this.points.length > 0
			? this.points[0].radius
			: MemoryTrainer.INITIAL_RADIUS;
		const x = this.randomInt(radius, this.canvas.width - radius);
		const y = this.randomInt(radius, this.canvas.height - radius);
		return new Point(id, x, y, this.ctx);
	}

	reducePointSizes() {
		if (this.points.length === 0) return;
		this.points[0].reduce();
		const newRadius = this.points[0].radius;
		const newTextSize = this.points[0].textSize;

		for (let i = 1; i < this.points.length; i++) {
			this.points[i].radius = newRadius;
			this.points[i].textSize = newTextSize;
		}
	}

	mixPoints() {
		const MAX_POSITION_ATTEMPTS = 100;

		this.points.forEach((point, i) => {
			let x, y;
			let attempts = 0;

			do {
				x = this.randomInt(point.radius, this.canvas.width - point.radius);
				y = this.randomInt(point.radius, this.canvas.height - point.radius);
				attempts++;
			} while (this.hasCollision(x, y, point.radius, i) && attempts < MAX_POSITION_ATTEMPTS);

			point.x = x;
			point.y = y;
			point.resetError();
			point.resetAnimation();
		});

		setTimeout(() => this.hideAll(), MemoryTrainer.HIDE_DELAY);
	}

	hasCollision(x, y, radius, excludeIndex) {
		for (let i = 0; i < this.points.length; i++) {
			if (i === excludeIndex) continue;
			const distance = this.getDistance(x, y, this.points[i].x, this.points[i].y);
			if (distance < radius * 2) {
				return true;
			}
		}
		return false;
	}

	hideAll() {
		this.points.forEach(point => point.hide());
	}

	gameOver() {
		this.isGameOver = true;
		this.isPaused = true;
		this.cancelAnimation();

		setTimeout(
			() => this.drawGameOverScreen(),
			MemoryTrainer.GAME_OVER_SCREEN_DELAY
		);
	}

	drawGameOverScreen() {
		const ctx = this.ctx;
		const centerX = this.canvas.width / 2;
		const centerY = this.canvas.height / 2;

		ctx.save();
		ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		ctx.font = '48pt Roboto';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(`${this.level - 1}`, centerX, centerY - 30);

		ctx.font = '18pt Roboto';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
		ctx.fillText('Click to continue', centerX, centerY + 60);

		ctx.restore();
	}

	restart() {
		this.cancelAnimation();
		this.init();
		this.isPaused = false;
		this.isGameOver = false;
		this.animate();
	}

	cancelAnimation() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	init() {
		this.points = [];
		this.counter = 0;
		this.level = 1;
		this.isPaused = false;
		this.isGameOver = false;

		const radius = MemoryTrainer.INITIAL_RADIUS;
		const x = this.randomInt(radius, this.canvas.width - radius);
		const y = this.randomInt(radius, this.canvas.height - radius);

		this.points.push(new Point(0, x, y, this.ctx));
		this.updateUI();

		setTimeout(() => this.hideAll(), MemoryTrainer.HIDE_DELAY);
	}

	animate() {
		if (this.isPaused) return;

		const currentTime = performance.now();

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.points.forEach(point => {
			point.update(currentTime);
		});

		this.updateUI();

		this.animationId = requestAnimationFrame(() => this.animate());
	}

	updateUI() {
		const recordEl = document.getElementById('record');
		const levelEl = document.getElementById('level');

		if (recordEl) recordEl.textContent = this.record;
		if (levelEl) levelEl.textContent = this.level;
	}


	updateRecord() {
		if (this.level > this.record) {
			this.record = this.level;
			this.saveRecord();
			this.updateUI();
		}
	}

	loadRecord() {
		try {
			const record = localStorage.getItem('memoryTrainerRecord');
			return record ? parseInt(record, 10) : 0;
		} catch (e) {
			return 0;
		}
	}

	saveRecord() {
		try {
			localStorage.setItem('memoryTrainerRecord', this.record.toString());
		} catch (e) {
			console.warn('Failed to save record:', e);
		}
	}

	randomInt(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	getDistance(x1, y1, x2, y2) {
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new MemoryTrainer();
});
