class ConfettiSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas with id "${canvasId}" not found.`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationFrame = null;
    this.active = false;
    this.particleCount = 0;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.showCounter = false; // 默认不显示计数器

    this.setupCanvas();
    window.addEventListener('resize', this.setupCanvas.bind(this));
  }

  setupCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start(particleCount = 500, colors = null, showCounter = false) {
    if (this.active) return;
    this.active = true;
    this.particleCountOverride = particleCount; // 保存用户指定的粒子数量
    this.colorsOverride = colors; // 保存用户指定的颜色
    this.showCounter = showCounter; // 保存是否显示计数器
    this.spawnConfetti(particleCount, colors);
  }

  stop() {
    this.active = false;
    this.reset();
  }

  spawnConfetti(particleCount = 500, colors = null) {
    this.updateCounter();

    // 清除所有旧粒子
    this.particles = [];

    // 左右两个位置生成粒子
    const finalParticleCount = particleCount;

    for (let i = 0; i < finalParticleCount; i++) {
      const isLeft = Math.random() > 0.5; // 决定粒子从左侧还是右侧发射
      const originX = isLeft ? -50 : this.width + 50; // 初始位置在屏幕外
      const originY = this.height * 1.2; // 从下方开始

      // 粒子初始速度 - 向上朝中心点喷射
      // 左侧粒子向右上方向，右侧粒子向左上方向
      let vx, vy;

      if (isLeft) {
        // 左侧粒子向右上方喷射
        vx = (Math.random() * 7 + 3); // 右侧速度
      } else {
        // 右侧粒子向左上方喷射
        vx = -(Math.random() * 7 + 3); // 左侧速度
      }

      // 所有粒子向上移动，模拟喷射效果
      vy = -(Math.random() * 25 + 15); // 高速向上

      this.particles.push({
        x: originX,
        y: originY,
        vx: vx,
        vy: vy,
        angle: 0,
        angVel: Math.random() * 8 - 4, // 旋转速度
        size: Math.random() * 12 + 8, // 粒子大小
        color: this.getRandomColor(colors),
        phase: 0, // 摇摆的相位
        swayAmplitude: Math.random() * 4 - 2, // 摇摆幅度
        life: Math.random() * 2 + 1.5, // 生命周期
        gravity: 0.4 + Math.random() * 0.3 // 重力
      });
    }

    this.particleCount = this.particles.length;
    this.updateCounter();

    if (!this.animationFrame) {
      this.animate();
    }
  }

  getRandomColor(colors = null) {
    // 使用Typora的紫罗兰色系
    const defaultColors = [
      '#6366F1', '#818CF8', '#A5B4FC', '#8B5CF6',
      '#D8B4FE', '#7C3AED', '#9362F0', '#AE87F3'
    ];
    const colorsToUse = colors || defaultColors;
    return colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
  }

  animate() {
    if (!this.active) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    let activeParticles = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // 更新位置
      p.x += p.vx;
      p.y += p.vy;

      // 逐渐增加重力影响
      p.vy += p.gravity;

      // 粒子上升后阶段 - 添加随机摇摆
      if (p.vy > 0) {
        // 飘落阶段
        p.vy = p.vy * 0.99; // 空气阻力
        p.phase += 0.02;
        p.x += Math.sin(p.phase) * p.swayAmplitude; // 左右摇摆
      }

      // 旋转
      p.angle += p.angVel;

      // 生命周期
      p.life -= 0.02;

      // 移除生命周期结束的粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // 绘制粒子
      const alpha = Math.min(1, p.life * 1.5);
      this.drawParticle(p, alpha);
      activeParticles++;
    }

    this.particleCount = activeParticles;
    this.updateCounter();

    if (this.particles.length > 0) {
      this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    } else {
      this.animationFrame = null;
      this.active = false; // 粒子全部消失后，停止动画循环
    }
  }

  drawParticle(p, alpha) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.angle * Math.PI / 180);

    // 两种粒子形状：长条形彩带和小方块
    if (Math.random() > 0.3) {
      // 长条形彩带
      const width = p.size;
      const height = width / 3;
      const gradient = this.ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, `${p.color}${Math.floor(alpha * 200).toString(16).padStart(2, '0')}`);

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(-width / 2, -height / 2, width, height);
    } else {
      // 小方块
      const half = p.size / 2;
      this.ctx.fillStyle = `${p.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.fillRect(-half, -half, p.size, p.size);

      // 添加小装饰点
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(half / 2, -half / 2, p.size / 6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  updateCounter() {
    let counter = document.querySelector('.particle-counter');
    if (this.showCounter) {
        if (!counter) {
          counter = document.createElement('div');
          counter.className = 'particle-counter';
          document.body.appendChild(counter);
        }
        counter.textContent = `彩带粒子: ${this.particleCount}`;
    } else {
        if (counter) {
            counter.remove(); // 移除计数器
        }
    }
  }

  reset() {
    this.particles = [];
    this.particleCount = 0;
    this.ctx.clearRect(0, 0, this.width, this.height);
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.updateCounter();
  }
}

let confetti = null;

function initConfetti(canvasId) {
  confetti = new ConfettiSystem(canvasId);
  return confetti;
}

function startConfetti(particleCount = 500, colors = null, showCounter = false) {
  if (confetti) {
    confetti.start(particleCount, colors, showCounter);
  } else {
    console.error('Confetti system not initialized. Call initConfetti() first.');
  }
}

function stopConfetti() {
  if (confetti) {
    confetti.stop();
  }
}
