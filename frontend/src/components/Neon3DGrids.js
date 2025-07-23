import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

// Helper to interpolate between multiple colors
function lerpColors(colors, t) {
  const n = colors.length;
  const scaled = t * (n - 1);
  const i = Math.floor(scaled);
  const frac = scaled - i;
  const a = colors[i % n];
  const b = colors[(i + 1) % n];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * frac)},${Math.round(a[1] + (b[1] - a[1]) * frac)},${Math.round(a[2] + (b[2] - a[2]) * frac)})`;
}

function NeonGrid({ basePosition, color, phase, hovered, setHovered, parallax }) {
  const group = useRef();
  const gridSize = 32; // Wider grid
  const spacing = 2.2; // More space between dots
  useFrame(({ clock }) => {
    if (group.current) {
      // Animate z position with phase offset
      group.current.position.z = Math.sin(clock.getElapsedTime() + phase) * 4 + basePosition[2];
      // Parallax effect
      if (parallax) {
        group.current.position.x = basePosition[0] + parallax.x * 2.5;
        group.current.position.y = basePosition[1] + parallax.y * 2.5;
      }
    }
  });
  return (
    <group
      ref={group}
      position={basePosition}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {Array.from({ length: gridSize }).map((_, i) =>
        Array.from({ length: gridSize }).map((_, j) => (
          <mesh key={`${i}-${j}`}
            position={[(i - gridSize / 2) * spacing, (j - gridSize / 2) * spacing, 0]}
          >
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              emissive={hovered ? '#fff' : color}
              color={hovered ? '#fff' : color}
              emissiveIntensity={4.5}
              toneMapped={false}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

// Expanding, fading circle layer with multiple ranges/colors
function ExpandingCircles({ musicLevel }) {
  const group = useRef();
  // More layers, wider rings, width and speed react to music
  const layers = [
    { base: 2, color: 'rgba(180,120,255,', speed: 1, width: 1.5, opacity: 0.18 }, // purple
    { base: 5, color: 'rgba(0,255,200,', speed: 0.7, width: 2.2, opacity: 0.12 }, // teal
    { base: 8, color: 'rgba(255,80,180,', speed: 1.3, width: 2.8, opacity: 0.10 }, // pink
    { base: 12, color: 'rgba(102,204,255,', speed: 0.5, width: 3.5, opacity: 0.09 }, // blue
    { base: 17, color: 'rgba(255,255,255,', speed: 1.1, width: 2.5, opacity: 0.07 }, // white
    { base: 21, color: 'rgba(180,120,255,', speed: 0.9, width: 3.8, opacity: 0.06 }, // purple
    { base: 26, color: 'rgba(255,80,180,', speed: 1.5, width: 4.2, opacity: 0.05 }, // pink
  ];
  // Each layer has its own set of circles
  const [circles, setCircles] = useState(
    layers.map((layer, i) => [
      { t: 0, key: i * 100 },
      { t: 0.5, key: i * 100 + 1 },
    ])
  );
  useFrame((state, delta) => {
    setCircles(prev =>
      prev.map((layerCircles, i) => {
        const { speed } = layers[i];
        let next = layerCircles.map(c => ({ ...c, t: c.t + delta * (0.25 + musicLevel * 1.5) * speed }));
        next = next.filter(c => c.t < 1.0);
        if (next.length < 2) {
          next.push({ t: 0, key: Math.random() });
        }
        return next;
      })
    );
  });
  return (
    <group ref={group}>
      {layers.map((layer, i) =>
        circles[i].map(c => {
          // Make ring width and expansion react to music
          const width = layer.width + musicLevel * 2.5;
          const expansion = 12 + musicLevel * 10;
          return (
            <mesh key={c.key} position={[0, 0, -2 - i * 0.5]}>
              <ringGeometry args={[layer.base + c.t * expansion, layer.base + width + c.t * expansion, 96]} />
              <meshBasicMaterial
                color={`${layer.color}${layer.opacity * (1 - c.t)})`}
                transparent
                opacity={layer.opacity * (1 - c.t)}
                depthWrite={false}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function GridColorController({ musicLevel, setColorT }) {
  useFrame(({ clock }) => {
    setColorT((clock.getElapsedTime() * (0.15 + musicLevel * 1.2)) % 1);
  });
  return null;
}

const Neon3DGrids = forwardRef(function Neon3DGrids({ onCameraStateChange, onMusicLevelChange }, ref) {
  const [hovered, setHovered] = useState(false);
  const [cameraState, setCameraState] = useState({ t: 0, x: 0, y: 0, z: 48 });
  const [musicLevel, setMusicLevel] = useState(0); // 0 (quiet) to 1 (loud)
  const sourceNodeRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Expose resumeAudioContext to parent
  useImperativeHandle(ref, () => ({
    resumeAudioContext: async () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
    }
  }), []);

  // Music reactivity: analyze audio and set musicLevel
  useEffect(() => {
    let analyser, running = true;
    const audioElem = document.getElementById('bg-music');
    if (audioElem) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audioElem);
      }
      analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 32;
      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioCtxRef.current.destination);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      function update() {
        if (!running) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = Math.min(1, avg / 128);
        setMusicLevel(level);
        if (onMusicLevelChange) onMusicLevelChange(level);
        requestAnimationFrame(update);
      }
      update();
    }
    return () => { running = false; if (analyser) analyser.disconnect(); };
  }, [onMusicLevelChange]);

  // Notify parent of camera state changes
  useEffect(() => {
    if (onCameraStateChange) {
      onCameraStateChange(cameraState);
    }
  }, [cameraState, onCameraStateChange]);

  // Mouse parallax effect
  useEffect(() => {
    function handleMouseMove(e) {
      setParallax({
        x: ((e.clientX / window.innerWidth) - 0.5) * 2, // -1 to 1
        y: ((e.clientY / window.innerHeight) - 0.5) * 2, // -1 to 1
      });
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Color cycle: blue, teal, purple, pink
  const palette = [
    [102, 204, 255],   // blue
    [0, 255, 200],    // teal
    [180, 80, 255],   // purple
    [255, 80, 180],   // pink
    [102, 204, 255],  // blue (loop)
  ];
  // Cycle color based on musicLevel and time
  const [colorT, setColorT] = useState(0);
  const gridColor = lerpColors(palette, colorT);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -9999, pointerEvents: 'auto' }}>
      <Canvas camera={{ position: [0, 0, 40], fov: 60 }} style={{ background: '#000' }}>
        <GridColorController musicLevel={musicLevel} setColorT={setColorT} />
        <ExpandingCircles musicLevel={musicLevel} />
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 0, 40]} intensity={2.5} color={gridColor} />
        <NeonGrid
          basePosition={[0, 0, -8]}
          color={gridColor}
          phase={0}
          hovered={hovered}
          setHovered={setHovered}
          parallax={parallax}
        />
        <NeonGrid
          basePosition={[0, 0, 8]}
          color={gridColor}
          phase={Math.PI}
          hovered={hovered}
          setHovered={setHovered}
          parallax={parallax}
        />
        {/* OrbitControls can be left for debugging, but is not needed for this effect */}
      </Canvas>
    </div>
  );
});

export default Neon3DGrids; 