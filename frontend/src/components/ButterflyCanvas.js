import React, { useRef, useEffect } from 'react';

export default function ButterflyCanvas({ visible }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let running = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    // Butterfly params
    let t = 0;
    function drawButterfly(ctx, x, y, scale, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      // Antennas
      ctx.save();
      ctx.strokeStyle = 'rgba(255,120,220,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.bezierCurveTo(-10, -48, -30, -60, -36 + Math.sin(t * 2) * 4, -80 - Math.cos(t * 2) * 6);
      ctx.moveTo(0, -28);
      ctx.bezierCurveTo(10, -48, 30, -60, 36 + Math.cos(t * 2) * 4, -80 - Math.sin(t * 2) * 6);
      ctx.shadowColor = 'rgba(255,120,220,0.5)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
      // Glow
      ctx.shadowColor = 'rgba(255,80,180,0.7)';
      ctx.shadowBlur = 32 + 16 * Math.abs(Math.sin(t));
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 32, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,80,180,0.8)';
      ctx.fill();
      // Wings (more detailed)
      for (let side of [-1, 1]) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.rotate(Math.sin(t) * 0.22 * side);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          0, -10,
          60, -60 + Math.sin(t * 2) * 10,
          80 + Math.sin(t * 2) * 10, 0
        );
        ctx.bezierCurveTo(
          60, 60 + Math.cos(t * 2) * 10,
          0, 30,
          0, 0
        );
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,120,220,0.7)';
        ctx.fill();
        // Inner wing detail
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          0, -5,
          30, -30 + Math.sin(t * 2) * 5,
          40 + Math.sin(t * 2) * 5, 0
        );
        ctx.bezierCurveTo(
          30, 30 + Math.cos(t * 2) * 5,
          0, 15,
          0, 0
        );
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,180,255,0.25)';
        ctx.fill();
        // Wing glow
        ctx.beginPath();
        ctx.arc(60, 0, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,120,220,0.13)';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    function animate() {
      if (!running) return;
      // Motion blur: draw a semi-transparent black rectangle over the canvas
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      t += 0.025; // More fluid (was 0.04)
      // Flutter horizontally in the middle
      const centerX = width / 2 + Math.sin(t * 1.1) * (width * 0.18);
      const centerY = height / 2;
      drawButterfly(ctx, centerX, centerY, 1.0 + 0.08 * Math.sin(t * 1.5), t); // Smaller scale
      requestAnimationFrame(animate);
    }
    animate();
    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    window.addEventListener('resize', handleResize);
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [visible]);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10001,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.7s cubic-bezier(.4,0,.2,1)',
      }}
    />
  );
} 