import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Edges, RoundedBox } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useSpring, animated } from '@react-spring/three';
import { useSpring as useSpringWeb, animated as animatedWeb } from '@react-spring/web';


// Remove the async function and top-level assignments
// const generateSongsArrayFromJSON = async () => {
//   const res = await fetch('songdatabase.json');
//   const data = await res.json();

//   const finalArray = data.map(song => ({
//     id: song.id,
//     artist: song.artist,
//     title: song.title,
//     desc: song.description,
//     coverimage: `mix-coverimage/${song.coverimage}`,
//     link: `/trackplayer?track=mix-tracks/${song.link}`
//   }));

//   return finalArray;
// };

// const carouselImages = generateSongsArrayFromJSON();
// const items = carouselImages;

// const carouselImages = [
//   process.env.PUBLIC_URL + 'mix-coverimage' + 'https://sinbound.online.s3.amazonaws.com/public/Gu-pyf9W8AAPa_k.jpg',
//   process.env.PUBLIC_URL + 'mix-coverimage' + 'https://sinbound.online.s3.amazonaws.com/public/Gu1zZmeW4AAb6R5.jpg',
//   process.env.PUBLIC_URL + 'mix-coverimage' + 'https://sinbound.online.s3.amazonaws.com/public/GuzfqUXWsAA3RR7.jpg',
// ];
// const items = Array.from({ length: 6 }, (_, i) => ({
//   img: carouselImages[i % carouselImages.length],
//   title: 'artist mix',
//   desc: 'artist mix',
//   link: '/trackplayer',
// }));

// MetaballsLine: fluid, extending metaballs effect along the axis
function MetaballsLine({ height = '92vh' }) {
  const canvasRef = useRef(null);
  const [entities, setEntities] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      dist: 0,
      speed: 0.008 + Math.random() * 0.012,
      radius: 38 + Math.random() * 18,
      hue: Math.random() * 360,
      t: Math.random() * 1000,
    }))
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let running = true;
    let width = window.innerWidth;
    let heightPx = typeof height === 'string' && height.endsWith('vh') ? window.innerHeight * (parseFloat(height) / 100) : window.innerHeight;
    canvas.width = width;
    canvas.height = heightPx;
    function animate() {
      if (!running) return;
      // Animate entities
      setEntities(prev =>
        prev.map((e, i) => {
          let t = e.t + 1;
          let dist = Math.min(e.dist + e.speed * 2, width * 0.45);
          let angle = e.angle + Math.sin(t / 120 + i) * 0.01;
          let radius = 38 + Math.sin(t / 40 + i) * 18;
          let hue = (e.hue + 0.3 + Math.sin(t / 200 + i) * 0.2) % 360;
          return { ...e, t, dist, angle, radius, hue };
        })
      );
      // Metaballs rendering
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, heightPx);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, width, heightPx);
      // Metaballs field
      const imageData = ctx.getImageData(0, 0, width, heightPx);
      const data = imageData.data;
      // For performance, sample every 2px
      const step = 2;
      for (let y = 0; y < heightPx; y += step) {
        for (let x = 0; x < width; x += step) {
          let field = 0;
          let color = [0, 0, 0];
          for (let e of entities) {
            // All flow from center of the page outward
            const cx = width / 2 + Math.cos(e.angle) * e.dist;
            const cy = heightPx / 2 + Math.sin(e.angle) * e.dist;
            const dx = x - cx;
            const dy = y - cy;
            const r = e.radius;
            field += r * r / (dx * dx + dy * dy + 1);
            // Color blend: use each entity's unique hue
            const rgb = hslToRgb(e.hue / 360, 1, 0.6);
            color[0] += rgb[0];
            color[1] += rgb[1];
            color[2] += rgb[2];
          }
          if (field > 1.2) {
            // Blend color
            let c = color.map(v => Math.min(255, v / entities.length));
            let idx = (y * width + x) * 4;
            data[idx] = c[0];
            data[idx + 1] = c[1];
            data[idx + 2] = c[2];
            data[idx + 3] = Math.min(255, (field - 1.2) * 80);
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(animate);
    }
    animate();
    function handleResize() {
      width = window.innerWidth;
      heightPx = typeof height === 'string' && height.endsWith('vh') ? window.innerHeight * (parseFloat(height) / 100) : window.innerHeight;
      canvas.width = width;
      canvas.height = heightPx;
    }
    window.addEventListener('resize', handleResize);
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [entities, height]);
  // HSL to RGB helper
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: height,
        zIndex: 2,
        pointerEvents: 'none',
        mixBlendMode: 'lighter',
      }}
    />
  );
}

function CarouselItem({ item, i, current, hovered, big, setHovered, N, radius }) {
  const angle = (2 * Math.PI / N) * i;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const y = 0;
  const isActive = i === current;
  const isHovered = hovered === i;
  const t = Date.now() / 1000 + i * 0.5;
  const breathingGlow = 0.7 + 0.3 * Math.sin(t);
  let baseGlowColor = i % 2 === 0 ? `hsl(${180 + 10 * Math.sin(t)},100%,60%)` : `hsl(${50 + 10 * Math.sin(t)},100%,60%)`;
  let contrastGlowColor = i % 2 === 0 ? `hsl(${320 + 10 * Math.sin(t)},100%,60%)` : `hsl(${200 + 10 * Math.sin(t)},100%,60%)`;
  const glowColor = isActive && isHovered ? contrastGlowColor : baseGlowColor;
  const shadowColor = isActive || isHovered ? baseGlowColor : '#333';
  const { scale, emissiveIntensity } = useSpring({
    scale: isHovered
      ? (big ? 1.75 : 1.55)
      : isActive
      ? (big ? 1.65 : 1.45) + 0.05 * Math.sin(Date.now() / 200)
      : 1,
    emissiveIntensity: (isActive || isHovered ? 1.2 : 0.5) * breathingGlow,
    config: { mass: 1, tension: 170, friction: 18 },
  });
  // Determine if this item is on the back side of the cylinder
  const isBack = Math.abs(((angle * 180) / Math.PI + 360) % 360) > 90 && Math.abs(((angle * 180) / Math.PI + 360) % 360) < 270;
  // Animated scale and glow for active/hovered item, plus breathing
  // Animated drift for active item
  // Remove driftRef for main position, always use [x, y, z]
  // For a 6-item carousel, flip text for the back-facing container (i === 3)
  const isFlipped = i === 3;
  return (
    <group key={i} position={[x, y, z]} rotation={[0, -angle, 0]}>
      {/* Large invisible hover area in front of the container */}
      <mesh
        position={[0, 0, 0.5]}
        onPointerOver={() => setHovered(i)}
        onPointerOut={() => setHovered(null)}
      >
        <planeGeometry args={[big ? 6.5 : 4.5, big ? 4.2 : 3.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <animated.mesh
        scale={scale.to(s => [s, s, s])}
        castShadow
        receiveShadow
      >
        <RoundedBox args={[big ? 4.8 : 3.0, big ? 3.0 : 2.1, big ? 0.62 : 0.44]} radius={big ? 0.48 : 0.30} smoothness={6} edges={{ color: glowColor, thickness: big ? 2.2 : 1.2 }}>
          {/* Confined inner glow rounded rectangle */}
          <RoundedBox args={[big ? 3.6 : 2.4, big ? 1.88 : 1.28, big ? 0.17 : 0.08]} radius={big ? 0.48 : 0.30} smoothness={5} position={[0, 0, big ? 0.30 : 0.21]}>
            <meshPhysicalMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={1.7 * breathingGlow}
              opacity={0.38}
              transparent
              metalness={0.4}
              roughness={0.18}
            />
          </RoundedBox>
          {/* Inner solid glow sheen */}
          <mesh position={[0, 0, big ? 0.46 : 0.36]}>
            <planeGeometry args={[big ? 6.0 : 4.2, big ? 3.6 : 2.7]} />
            <meshBasicMaterial color={glowColor} opacity={isActive || isHovered ? 0.48 : 0.28} transparent />
          </mesh>
          <animated.meshPhysicalMaterial
            color={'#fff'}
            emissive={isActive || isHovered ? glowColor : '#6cf'}
            emissiveIntensity={emissiveIntensity.to(e => e * 1.7)}
            opacity={0.95}
            transparent
            clearcoat={1}
            clearcoatRoughness={0.15}
            reflectivity={0.85}
            metalness={0.2}
          />
          <shadowMaterial attach="material" opacity={0.35} />
        </RoundedBox>
      </animated.mesh>
      {/* Image as texture overlay */}
      <Html center style={{ pointerEvents: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
        rotation={[0, -angle, 0]}
        transform={`skewY(${Math.sin(angle) * 6}deg) rotateZ(${angle * 8 / Math.PI}deg)`}
      >
        <a href={item.link} style={{ textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src={item.img} alt={item.title} style={{
            width: big ? 195 : 125,
            height: big ? 138 : 83,
            borderRadius: 12,
            boxShadow: isActive || isHovered ? `0 0 0 ${big ? 8 : 4}px ${shadowColor}` : `0 0 0 ${big ? 4 : 2}px #333`,
            marginBottom: 12,
            opacity: isActive ? 1 : 0.7,
            filter: isActive || isHovered ? 'grayscale(10%)' : 'grayscale(30%) blur(1px)',
            transform: `skewY(${Math.sin(angle) * 6}deg) rotateZ(${angle * 8 / Math.PI}deg)`,
            transition: 'box-shadow 0.2s, filter 0.2s',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
          }} />
          <div style={{
            fontWeight: 'bold',
            fontSize: big ? '1.7em' : '1.1em',
            color: isBack ? '#fff' : (isActive || isHovered ? '#fff' : (i % 2 === 0 ? '#ff4fa3' : '#00fff7')),
            textShadow: isActive || isHovered ? `0 0 2px #000, 0 0 8px #fff` : `0 0 2px ${baseGlowColor}`,
            filter: `${isActive || isHovered ? 'none' : 'blur(0.5px)'} contrast(1.2) invert(1)`,
            transform: item.title === 'SensationalX Furry Night' ? 'scaleX(-1)' : (isFlipped ? 'scaleX(-1)' : undefined),
            transition: 'filter 0.2s',
            textAlign: 'center',
            margin: '0 auto',
            width: '100%',
            lineHeight: 1.2,
          }}>{item.title}</div>
          <div style={{
            fontSize: big ? '1.2em' : '0.9em',
            color: isBack ? '#fff' : '#aaa',
            filter: 'invert(1) contrast(1.2)',
            transition: 'filter 0.2s',
            transform: item.title === 'SensationalX Furry Night' ? 'scaleX(-1)' : (isFlipped ? 'scaleX(-1)' : undefined),
            textAlign: 'center',
            margin: '0 auto',
            width: '100%',
            lineHeight: 1.2,
          }}>{item.desc}</div>
        </a>
      </Html>
    </group>
  );
}

function Carousel3D({ current, hovered, setHovered, big, items, onItemClick }) {
  // Make the cylinder axis smaller for a more compact carousel
  const baseRadius = big ? 10 : 6;
  const radius = baseRadius + (big ? 1.2 : 0.8) * Math.sqrt(items.length);
  const N = Math.max(items.length, 1);
  const groupRef = useRef();
  const [autoSpin, setAutoSpin] = useState(true);
  const [autoAngle, setAutoAngle] = useState(0);
  const lastUserAction = useRef(Date.now());
  const lastCurrent = useRef(current);

  // Animate the group rotation so the selected item is always at the front
  const targetAngle = -((2 * Math.PI / N) * current);
  const { rotationY } = useSpring({
    rotationY: autoSpin ? autoAngle : targetAngle,
    config: { mass: 1, tension: 170, friction: 26 },
  });

  // Auto-spin logic
  useFrame(() => {
    if (autoSpin && groupRef.current) {
      setAutoAngle(a => a + 0.008); // Adjust speed as needed
    }
    // If user recently interacted, pause auto-spin for 3s
    if (!autoSpin && Date.now() - lastUserAction.current > 3000 && lastCurrent.current === current) {
      setAutoSpin(true);
    }
  });

  // Pause auto-spin on user selection
  useEffect(() => {
    setAutoSpin(false);
    lastUserAction.current = Date.now();
    lastCurrent.current = current;
  }, [current]);

  // Camera parallax effect
  const { camera } = useThree();
  useEffect(() => {
    function handleMouseMove(e) {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      camera.position.x = x * 2.5;
      camera.position.y = -y * 1.5;
      camera.lookAt(0, 0, 0);
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera]);
  if (!items || items.length === 0) return null;
  return (
    <animated.group ref={groupRef} position={[0, 0, 0]} rotation-y={rotationY}>
      {items.map((item, i) => (
        <CarouselItem
          key={i}
          item={item}
          i={i}
          current={current}
          hovered={hovered}
          big={big}
          setHovered={setHovered}
          N={N}
          radius={radius}
        />
      ))}
    </animated.group>
  );
}

function RadioDiscsBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let running = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    function drawDiscs(t) {
      ctx.clearRect(0, 0, width, height);
      // Deep blue background
      ctx.fillStyle = '#0a0a2a';
      ctx.fillRect(0, 0, width, height);
      // Draw angled, animated discs
      const centerX = width / 2;
      const centerY = height / 2;
      const angle = Math.PI / 4; // 45 degrees
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      for (let i = 0; i < 7; i++) {
        const baseR = 80 + i * 90;
        const r = baseR + Math.sin(t / 900 + i) * 40;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.globalAlpha = 0.13 + 0.07 * Math.sin(t / 700 + i);
        ctx.fillStyle = i % 2 === 0 ? '#00fff7' : '#ff4fa3';
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    function animate() {
      if (!running) return;
      drawDiscs(Date.now());
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
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0a0a2a',
      }}
    />
  );
}

// Halftone background overlay
function HalftoneOverlay({ color = '#fff', dotSize = 2, spacing = 10, opacity = 0.13 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let running = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    function draw() {
      if (!running) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;
      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    draw();
    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      draw();
    }
    window.addEventListener('resize', handleResize);
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
    };
  }, [color, dotSize, spacing, opacity]);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
        mixBlendMode: 'soft-light',
      }}
    />
  );
}

function PulsingArrow({ direction, style }) {
  // direction: 'tl', 'tr', 'bl', 'br'
  const { scale, shadow } = useSpringWeb({
    from: { scale: 1, shadow: 0.5 },
    to: async (next) => {
      while (1) {
        await next({ scale: 1.18, shadow: 1 });
        await next({ scale: 1, shadow: 0.5 });
      }
    },
    config: { mass: 1, tension: 120, friction: 10 },
    loop: true,
  });
  // Arrow rotation and color per corner
  let rotation = 0, gradId = '', color1 = '', color2 = '';
  if (direction === 'tl') { rotation = -135; gradId = 'arrowGradTL'; color1 = '#ff4fa3'; color2 = '#fff1fa'; }
  if (direction === 'tr') { rotation = -45; gradId = 'arrowGradTR'; color1 = '#00fff7'; color2 = '#e0ffff'; }
  if (direction === 'bl') { rotation = 135; gradId = 'arrowGradBL'; color1 = '#ffe14f'; color2 = '#fffbe0'; }
  if (direction === 'br') { rotation = 45; gradId = 'arrowGradBR'; color1 = '#a080ff'; color2 = '#e0e0ff'; }
  return (
    <animatedWeb.div style={{
      position: 'fixed',
      ...style,
      zIndex: 10002,
      width: 72,
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      pointerEvents: 'none',
      transform: scale.to(s => `scale(${s}) rotate(${rotation}deg)`),
      filter: 'drop-shadow(0 0 18px ' + color1 + ')',
      transition: 'transform 0.2s',
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={color2} />
            <stop offset="60%" stopColor={color1} />
            <stop offset="100%" stopColor="#222" />
          </linearGradient>
        </defs>
        {/* Arrow shaft */}
        <rect x="28" y="16" width="8" height="28" rx="4" fill={`url(#${gradId})`} stroke="#fff" strokeWidth="1.5" />
        {/* Arrow head */}
        <polygon points="32,6 54,34 44,34 44,54 20,54 20,34 10,34" fill={`url(#${gradId})`} stroke="#fff" strokeWidth="2.5" />
        {/* Metallic highlight */}
        <ellipse cx="32" cy="22" rx="7" ry="2.2" fill="#fff" opacity="0.18" />
      </svg>
    </animatedWeb.div>
  );
}

// Main Radio page component
function Radio(props) {
  const audioRef = React.useRef(null);
  const sfxRef = React.useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pulsing heading animation
  const { scale } = useSpringWeb({
    from: { scale: 1 },
    to: async (next) => {
      while (1) {
        await next({ scale: 1.08 });
        await next({ scale: 1 });
    }
},
config: { mass: 1, tension: 120, friction: 10 },
loop: true,
}); 
  
  // Handle carousel item clicks
  const handleItemClick = (item) => {
    // Navigate to TrackPlayer with the mixId/category as a parameter
    window.location.href = `/trackplayer?mix=${item.id}`;
  };
  // Define big for use in camera and Carousel3D
  const big = true;
  // Play SFX at low volume
  const playSFX = () => {
    const sfx = sfxRef.current;
    if (sfx) {
      sfx.volume = 0.12;
      sfx.currentTime = 0;
      sfx.play();
    }
  };
  // Keyboard navigation and SFX
  useEffect(() => {
    function handleKey(e) {
      if (N <= 0) return;
      if (e.key === 'ArrowLeft') {
        setCurrent(c => (c - 1 + N) % N);
        playSFX();
      }
      if (e.key === 'ArrowRight') {
        setCurrent(c => (c + 1) % N);
        playSFX();
      }
      // Also treat keyboard as user interaction for audio unlock
      if (!audioReady && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        unlockAudio();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line
  }, [audioReady]);
  // Audio unlock logic
  const unlockAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    audio.volume = 0.85;
    setAudioReady(true);
  };
  // Audio autoplay and user interaction (mouse/touch/keyboard)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const unlock = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
    // eslint-disable-next-line
  }, []);
  // Play background audio on ready
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioReady) {
      audio.play();
    }
  }, [audioReady]);

  // Fetch the JSON data on mount
  useEffect(() => {
   //  fetch('https://sinbound.online.s3.amazonaws.com/public/songdatabase.json')
    fetch('https://sinbound.online.s3.amazonaws.com/public/songdatabase.json')

      .then(res => res.json())
      .then(data => {
        const finalArray = data.map(song => ({
          img: process.env.PUBLIC_URL + '/mix-coverimage/' + song.coverimage,
          title: song.title,
          desc: song.description,
          link: '/trackplayer?track=' + song.link
        }));
        setItems(finalArray);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // N is the number of items in the carousel
  const N = items.length;

  // Clamp current index if items change
  useEffect(() => {
    if (items.length > 0 && current >= items.length) {
      setCurrent(items.length - 1);
    }
    if (items.length > 0 && current < 0) {
      setCurrent(0);
    }
  }, [items, current]);

  // Styles
  const overlayStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 10,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const headingStyle = {
    color: '#fff',
    fontFamily: 'MS Gothic, MS PGothic, Meiryo, monospace',
    fontSize: '2.6em',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    margin: '0 0 32px 0',
    textShadow: '0 0 18px #00fff7, 0 0 8px #fff',
    filter: 'contrast(1.2)',
    userSelect: 'none',
    pointerEvents: 'auto',
    willChange: 'transform',
  };
  // Main return
  return (
    <>
      <RadioDiscsBackground />
      <HalftoneOverlay />
      <MetaballsLine />
      {/* Pulsing glowing arrows in corners */}
      <PulsingArrow direction="tl" style={{ left: 12, top: 12 }} />
      <PulsingArrow direction="tr" style={{ right: 12, top: 12 }} />
      <PulsingArrow direction="bl" style={{ left: 12, bottom: 12 }} />
      <PulsingArrow direction="br" style={{ right: 12, bottom: 12 }} />
      <div style={overlayStyle}>
        {/* Hidden background audio and SFX */}
        <audio
          ref={audioRef}
          src={'https://sinbound.online.s3.amazonaws.com/public/birkin loop.wav'}
          preload="auto"
          loop
          muted
          style={{ display: 'none' }}
        />
        <audio
          ref={sfxRef}
          src={'https://sinbound.online.s3.amazonaws.com/public/sfx001.wav'}
          preload="auto"
          style={{ display: 'none' }}
        />
        <animatedWeb.h1 style={{ ...headingStyle, transform: scale.to(s => `scale(${s})`) }}>
          choose a track
        </animatedWeb.h1>
        <div style={{ width: '100vw', height: '85vh', maxWidth: 1600, margin: '0 auto', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
          {loading ? (
            <div style={{ color: '#fff', textAlign: 'center', fontSize: 24, marginTop: 80 }}>Loading carousel...</div>
          ) : (
            <>
              {!loading && items.length > 0 && (
                <Canvas shadows camera={{ position: [0, 0, Math.max(28, (big ? 18 : 11) + (big ? 2.5 : 1.5) * Math.sqrt(items.length) * 1.5)], fov: 54 }} style={{ width: '100%', height: '100%', background: 'none', borderRadius: 0, boxShadow: 'none', pointerEvents: 'auto' }}>
                  <ambientLight intensity={0.7} />
                  <directionalLight position={[0, 8, 8]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
                  <EffectComposer>
                    <Bloom luminanceThreshold={0.18} luminanceSmoothing={0.7} intensity={1.2} />
                  </EffectComposer>
                  <Carousel3D 
          current={current} 
          hovered={hovered}   
          setHovered={setHovered} 
          big     
          items={items}
          onItemClick={handleItemClick}
        />
                </Canvas>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Radio;