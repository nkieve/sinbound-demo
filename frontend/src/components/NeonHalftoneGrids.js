import React, { useRef, useEffect } from 'react';

const GRID_SIZE = 20;
const DOT_SPACING = 30;
const GRID_CURVE = 0.015; // curvature factor

function lerpColor(a, b, t) {
  // a, b: [r,g,b], t: 0-1
  return `rgb(
    ${Math.round(a[0] + (b[0] - a[0]) * t)},
    ${Math.round(a[1] + (b[1] - a[1]) * t)},
    ${Math.round(a[2] + (b[2] - a[2]) * t)}
  )`;
}

export default function NeonHalftoneGrids() {
  const canvasRef = useRef(null);
  const animRef = useRef({ z: 0, colorT: 0, time: 0 });

  useEffect(() => {
    console.log('NeonHalftoneGrids: useEffect started');
    const canvas = canvasRef.current;
    
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context!');
      return;
    }
    
    console.log('Canvas and context initialized');
    
    // Set canvas size to match window
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    console.log(`Canvas size: ${width}x${height}`);

    function drawGrid(mirrorX, mirrorY, z, colorT) {
      const centerX = width / 2;
      const centerY = height / 2;
      const neonBlue = [102, 204, 255];
      const darkBlue = [10, 20, 60];
      const color = lerpColor(neonBlue, darkBlue, colorT);

      for (let i = -GRID_SIZE; i <= GRID_SIZE; i++) {
        for (let j = -GRID_SIZE; j <= GRID_SIZE; j++) {
          // 3D grid, curved at 45deg, mirrored
          let x = i * DOT_SPACING;
          let y = j * DOT_SPACING;
          // Curve: bend towards center
          let curve = Math.pow(x * mirrorX + y * mirrorY, 2) * GRID_CURVE;
          let zPos = z + curve;
          // Perspective projection
          let scale = 400 / (400 + zPos);
          let px = centerX + (x * mirrorX) * scale;
          let py = centerY + (y * mirrorY) * scale;
          // Lighting: brighter near center
          let dist = Math.hypot(px - centerX, py - centerY);
          let light = Math.max(0, 1 - dist / (width / 2));
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, 3 + 4 * light, 0, Math.PI * 2);
          ctx.shadowColor = color;
          ctx.shadowBlur = 20 + 40 * light;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.7 + 0.3 * light;
          ctx.fill();
          ctx.restore();
        }
      }
    }

    function render() {
      // Clear with a dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      // Grid 1: normal
      drawGrid(1, 1, animRef.current.z, animRef.current.colorT);
      // Grid 2: mirrored at XY
      drawGrid(-1, -1, animRef.current.z, animRef.current.colorT);
      // Lighting source: radial gradient in center
      let grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/3);
      grad.addColorStop(0, 'rgba(102,204,255,0.25)');
      grad.addColorStop(1, 'rgba(0,0,32,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    function animate() {
      // Update animation values using sine waves for smooth oscillation
      animRef.current.time += 0.02;
      animRef.current.z = Math.sin(animRef.current.time) * 50 + 50; // Oscillate between 0 and 100
      animRef.current.colorT = (Math.sin(animRef.current.time * 0.5) + 1) / 2; // Oscillate between 0 and 1
      
      render();
      requestAnimationFrame(animate);
    }
    
    console.log('Starting animation loop');
    animate();

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      console.log(`Canvas resized to: ${width}x${height}`);
    });

    return () => {
      console.log('Cleaning up animation');
    };
  }, []);

  return (
    <canvas
      id="canvas-index-halftone-glow"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: -9999,
        pointerEvents: 'none',
        background: '#000'
      }}
    />
  );
} 