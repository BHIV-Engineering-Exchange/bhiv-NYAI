import React, { useEffect, useRef } from 'react';
import './Galaxy.css';

export default function Galaxy({
  density = 0.5,
  speed = 0.5,
  glowIntensity = 0.5,
  transparent = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate lightweight star particles
    const particleCount = Math.floor(60 * density);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      speedX: (Math.random() - 0.5) * 0.3 * speed,
      speedY: (Math.random() - 0.5) * 0.3 * speed,
    }));

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep space radial background
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.2
      );
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      grad.addColorStop(0.5, 'rgba(10, 15, 30, 0.95)');
      grad.addColorStop(1, 'rgba(5, 7, 15, 1)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render floating stars
      angle += 0.002 * speed;
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(angle * 5 + p.x));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 215, 255, ${currentAlpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [density, speed, glowIntensity, transparent]);

  return (
    <div className="galaxy-container">
      <canvas ref={canvasRef} />
    </div>
  );
}
