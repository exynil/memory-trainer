class Point {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.textSize = 130;
        this.textColor = '#dedede';
        this.radius = 120;
        this.circleColor = '#dedede';
        this.isHidden = false;
    }

    update() {
        this.isHidden ? this.drawCircle() : this.drawText();
    }

    hide() {
        this.isHidden = true;
    }

    show() {
        this.isHidden = false;
    }

    drawCircle() {
        ctx.beginPath();
        ctx.save();
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.circleColor;
        ctx.fillStyle = this.circleColor;
        ctx.strokeStyle = this.circleColor;
        ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
        ctx.closePath();
    }

    drawText() {
        ctx.beginPath();
        ctx.save();
        ctx.font = this.textSize + 'pt Jura';
        ctx.fillStyle = this.textColor;
        ctx.fillText(this.id, this.x - ctx.measureText(this.id).width / 2, this.y + this.textSize / 2);
        ctx.restore();
        ctx.closePath();
    }
    notError() {
        this.circleColor = '#f5f5f5';
    }
    error() {
        this.circleColor = '#e84343';
    }
    reduce() {
        this.textSize -= 3;
        this.radius -= 3;
    }
}
