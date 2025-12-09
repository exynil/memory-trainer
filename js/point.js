class Point {
	static INITIAL_TEXT_SIZE = 130;
	static INITIAL_RADIUS = 120;
	static DEFAULT_COLOR = '#E0E0E0';
	static ERROR_COLOR = '#B00020';
	static PARTICLE_COLOR = '#FFFFFF';
	static MIN_TEXT_SIZE = 30;
	static MIN_RADIUS = 30;
	static SIZE_REDUCTION = 3;
	static APPEARANCE_DURATION = 400;
	static OPENING_PULSE_DURATION = 400;
	static OPENING_SETTLE_DURATION = 200;
	static PARTICLE_COUNT = 12;
	static PARTICLE_MIN_SPEED = 2;
	static PARTICLE_MAX_SPEED = 5;
	static PARTICLE_MIN_DURATION = 300;
	static PARTICLE_MAX_DURATION = 500;
	static PARTICLE_MIN_SIZE = 3;
	static PARTICLE_MAX_SIZE = 7;
	static PARTICLE_TRAIL_LENGTH = 3;
	static ANIMATION_FRAME_TIME = 16;
	static GRAVITY = 0.15;
	static FRICTION = 0.96;

	constructor(id, x, y, ctx) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.ctx = ctx;
		this.textSize = Point.INITIAL_TEXT_SIZE;
		this.textColor = Point.DEFAULT_COLOR;
		this.radius = Point.INITIAL_RADIUS;
		this.circleColor = Point.DEFAULT_COLOR;
		this.isHidden = false;

		this.scale = 0;
		this.opacity = 0;
		this.textOpacity = 0;
		this.particles = [];
		this.animationStartTime = null;
		this.isOpening = false;
		this.openScale = 1;
		this.pulseScale = 1;
		this.openStartTime = null;
	}

	update(currentTime) {
		this.updateAnimations(currentTime);
		this.isHidden ? this.drawCircle() : this.drawText();
		this.drawParticles();
	}

	updateAnimations(currentTime) {
		if (!this.animationStartTime) {
			this.animationStartTime = currentTime;
		}

		const elapsed = currentTime - this.animationStartTime;
		this.updateAppearanceAnimation(elapsed);
		this.updateOpeningAnimation(currentTime);
		this.updateParticles();
	}

	updateAppearanceAnimation(elapsed) {
		if (elapsed < Point.APPEARANCE_DURATION) {
			const progress = elapsed / Point.APPEARANCE_DURATION;
			this.scale = this.easeOutBounce(progress);
			this.opacity = this.easeOutCubic(progress);
		} else {
			this.scale = 1;
			this.opacity = 1;
		}
	}

	updateOpeningAnimation(currentTime) {
		if (this.isOpening) {
			if (!this.openStartTime) {
				this.openStartTime = currentTime;
				this.createOpeningParticles();
			}

			const openElapsed = currentTime - this.openStartTime;
			const pulseDuration = Point.OPENING_PULSE_DURATION;
			const settleDuration = Point.OPENING_SETTLE_DURATION;

			if (openElapsed < pulseDuration) {
				const progress = openElapsed / pulseDuration;
				const pulse = Math.sin(progress * Math.PI * 2) * 0.15;
				this.openScale = 1 + pulse;
				this.pulseScale = 1 + pulse * 0.5;
				this.textOpacity = this.easeOutCubic(Math.min(progress * 1.5, 1));
			} else if (openElapsed < pulseDuration + settleDuration) {
				const progress = (openElapsed - pulseDuration) / settleDuration;
				this.openScale = 1 + 0.1 * (1 - progress);
				this.pulseScale = 1;
				this.textOpacity = 1;
			} else {
				this.openScale = 1;
				this.pulseScale = 1;
				this.textOpacity = 1;
				this.isOpening = false;
				this.openStartTime = null;
			}
		} else if (!this.isHidden) {
			this.textOpacity = 1;
		}
	}

	updateParticles() {
		this.particles = this.particles.filter(particle => {
			particle.age += Point.ANIMATION_FRAME_TIME;
			particle.x += particle.vx;
			particle.y += particle.vy;
			particle.vy += Point.GRAVITY;
			particle.vx *= Point.FRICTION;
			particle.vy *= Point.FRICTION;

			if (particle.trail) {
				particle.trail.push({ x: particle.x, y: particle.y });
				if (particle.trail.length > Point.PARTICLE_TRAIL_LENGTH) {
					particle.trail.shift();
				}
			}

			return particle.age < particle.duration;
		});
	}

	easeOutCubic(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	easeOutBounce(t) {
		if (t < 1 / 2.75) {
			return 7.5625 * t * t;
		} else if (t < 2 / 2.75) {
			return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
		} else if (t < 2.5 / 2.75) {
			return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
		} else {
			return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
		}
	}

	addRipple(x, y) {
		// Animation removed - only text bounce remains
	}

	createOpeningParticles() {
		for (let i = 0; i < Point.PARTICLE_COUNT; i++) {
			const angle = (Math.PI * 2 / Point.PARTICLE_COUNT) * i;
			const speed = Point.PARTICLE_MIN_SPEED +
				Math.random() * (Point.PARTICLE_MAX_SPEED - Point.PARTICLE_MIN_SPEED);

			this.particles.push({
				x: this.x,
				y: this.y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				age: 0,
				duration: Point.PARTICLE_MIN_DURATION +
					Math.random() * (Point.PARTICLE_MAX_DURATION - Point.PARTICLE_MIN_DURATION),
				size: Point.PARTICLE_MIN_SIZE +
					Math.random() * (Point.PARTICLE_MAX_SIZE - Point.PARTICLE_MIN_SIZE),
				color: Point.PARTICLE_COLOR,
				trail: []
			});
		}
	}

	drawCircle() {
		const ctx = this.ctx;
		ctx.save();
		ctx.globalAlpha = this.opacity;
		ctx.fillStyle = this.circleColor;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius * this.scale * this.pulseScale, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	drawText() {
		const ctx = this.ctx;
		const text = this.id.toString();
		ctx.save();
		ctx.globalAlpha = this.opacity * this.textOpacity;
		ctx.font = `bold ${this.textSize * this.scale * this.openScale}pt Roboto`;
		ctx.fillStyle = this.textColor;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, this.x, this.y);
		ctx.restore();
	}


	drawParticles() {
		const ctx = this.ctx;
		this.particles.forEach(particle => {
			const progress = particle.age / particle.duration;
			const opacity = 1 - progress;

			// Draw trail for spark effect
			if (particle.trail && particle.trail.length > 1) {
				ctx.save();
				ctx.strokeStyle = particle.color;
				ctx.lineWidth = 2;
				ctx.globalAlpha = opacity * 0.3;
				ctx.beginPath();
				ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
				for (let i = 1; i < particle.trail.length; i++) {
					ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
				}
				ctx.stroke();
				ctx.restore();
			}

			// Draw spark particle
			ctx.save();
			ctx.globalAlpha = opacity;
			ctx.fillStyle = particle.color;
			ctx.shadowBlur = 8;
			ctx.shadowColor = particle.color;
			const size = particle.size * (1 - progress * 0.3);
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
			ctx.fill();

			// Add glow
			ctx.globalAlpha = opacity * 0.4;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, size * 1.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});
	}

	hide() {
		this.isHidden = true;
		this.textOpacity = 0;
		this.isOpening = false;
	}

	show() {
		this.isHidden = false;
		this.isOpening = true;
		this.openStartTime = null;
		if (!this.animationStartTime) {
			this.animationStartTime = performance.now() - Point.APPEARANCE_DURATION;
		}
	}

	showAsError() {
		this.isHidden = false;
		this.isOpening = true;
		this.openStartTime = null;
		this.circleColor = Point.ERROR_COLOR;
		this.textColor = Point.ERROR_COLOR;
		if (!this.animationStartTime) {
			this.animationStartTime = performance.now() - Point.APPEARANCE_DURATION;
		}
	}

	setError() {
		this.circleColor = Point.ERROR_COLOR;
	}

	resetError() {
		this.circleColor = Point.DEFAULT_COLOR;
	}

	reduce() {
		this.textSize = Math.max(Point.MIN_TEXT_SIZE, this.textSize - Point.SIZE_REDUCTION);
		this.radius = Math.max(Point.MIN_RADIUS, this.radius - Point.SIZE_REDUCTION);
	}

	resetAnimation() {
		this.animationStartTime = null;
		this.openStartTime = null;
		this.scale = 0;
		this.opacity = 0;
		this.textOpacity = 0;
		this.isOpening = false;
		this.openScale = 1;
		this.pulseScale = 1;
		this.particles = [];
	}
}
