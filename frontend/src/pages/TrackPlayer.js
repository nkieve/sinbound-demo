import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
// Add import for URL param parsing

export default function TrackPlayer({ cameraState }) {
  const logoStyle = {
    width: 'min(180px, 40vw)',
    height: 'auto',
    margin: '40px auto 20px auto',
    display: 'block',
    maxWidth: '90vw',
    filter: 'drop-shadow(0 0 24px #6cf) drop-shadow(0 0 8px #fff)',
    pointerEvents: 'none',
    transition: 'filter 0.3s',
  };
  const dividerStyle = {
    width: 370,
    maxWidth: '90%',
    height: 33,
    margin: '40px auto 0 auto',
    display: 'block',
  };
  const footerStyle = {
    textAlign: 'center',
    margin: '20px 0',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1rem',
  };
  const footerLinkStyle = {
    color: '#fff',
    textDecoration: 'none',
    margin: '0 15px',
    transition: 'color 0.3s ease',
  };

  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mouseParallax, setMouseParallax] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSpinText, setShowSpinText] = useState(true);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  // Helper to get URL param
  function getMixParam() {
    const params = new URLSearchParams(window.location.search);
    const track = params.get('track');
    // return track ? encodeURIComponent(track) : null;
    return track ? track : null;
  }

  useEffect(() => {
    const mix = getMixParam();
    console.log('mix');
    console.log(mix);
    if (mix) {
      setTracks([mix]);
    } else {
      setTracks([]);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && tracks.length > 0) {
      // audioRef.current.src = process.env.PUBLIC_URL + '/' + tracks[current].link;
      audioRef.current.src = getMixParam();
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [current, isPlaying, tracks]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const stop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };
  const next = () => setCurrent((current + 1) % tracks.length);
  const prev = () => setCurrent((current - 1 + tracks.length) % tracks.length);
  const selectTrack = (idx) => {
    setCurrent(idx);
    setIsPlaying(true);
  };

  // Track progress state
  const [trackProgress, setTrackProgress] = useState(0); // 0 to 1
  const [trackDuration, setTrackDuration] = useState(0);
  const [trackCurrent, setTrackCurrent] = useState(0);

  // Update progress as the track plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function updateProgress() {
      setTrackCurrent(audio.currentTime);
      setTrackDuration(audio.duration || 0);
      setTrackProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    }
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [audioRef, current]);

  // Play/pause/seek handlers
  const handlePlay = () => { audioRef.current && audioRef.current.play(); setIsPlaying(true); };
  const handlePause = () => { audioRef.current && audioRef.current.pause(); setIsPlaying(false); };
  const handlePrev = prev;
  const handleNext = next;
  const handleSeek = (e) => {
    if (!audioRef.current || !trackDuration) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = percent * trackDuration;
  };

  // On mount, restore play state and track index from localStorage
  useEffect(() => {
    const savedPlaying = localStorage.getItem('trackplayer_isPlaying');
    const savedTrack = localStorage.getItem('trackplayer_current');
    if (savedTrack !== null) setCurrent(Number(savedTrack));
    if (savedPlaying === 'true') setIsPlaying(true);
  }, []);

  // On mount, if isPlaying is true, try to play, but if blocked, require user interaction
  useEffect(() => {
    if (!isPlaying) return;
    const audio = audioRef.current;
    if (!audio) return;
    // Try to play immediately
    const tryPlay = () => {
      audio.play().catch((err) => {
        if (err && err.name === 'NotAllowedError') {
          setNeedsUserInteraction(true);
        }
      });
    };
    tryPlay();
  }, [isPlaying, current]);

  // Listen for user interaction if needed
  useEffect(() => {
    if (!needsUserInteraction) return;
    const audio = audioRef.current;
    if (!audio) return;
    const onUserInteract = () => {
      audio.play().finally(() => {
        setNeedsUserInteraction(false);
        window.removeEventListener('pointerdown', onUserInteract);
        window.removeEventListener('keydown', onUserInteract);
      });
    };
    window.addEventListener('pointerdown', onUserInteract);
    window.addEventListener('keydown', onUserInteract);
    return () => {
      window.removeEventListener('pointerdown', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
    };
  }, [needsUserInteraction]);

  // Save play state and track index to localStorage
  useEffect(() => {
    localStorage.setItem('trackplayer_isPlaying', isPlaying);
    localStorage.setItem('trackplayer_current', current);
  }, [isPlaying, current]);

  // On audio loaded, auto-play if isPlaying is true
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onLoaded() {
      if (isPlaying && audio.paused) {
        audio.play().catch(() => {});
      }
    }
    audio.addEventListener('loadeddata', onLoaded);
    return () => audio.removeEventListener('loadeddata', onLoaded);
  }, [isPlaying, current]);

  // On mount, sync UI state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function syncState() {
      setIsPlaying(!audio.paused && !audio.ended);
    }
    audio.addEventListener('play', syncState);
    audio.addEventListener('pause', syncState);
    audio.addEventListener('ended', syncState);
    return () => {
      audio.removeEventListener('play', syncState);
      audio.removeEventListener('pause', syncState);
      audio.removeEventListener('ended', syncState);
    };
  }, []);

  // Fullscreen flex container for immersive experience
  const fullscreenStyle = {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'black',
    position: 'relative',
    overflow: 'hidden',
  };

  // Overlay for player controls/info
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  };
  const playerBoxStyle = {
    background: 'rgba(20,20,30,0.82)',
    borderRadius: 24,
    boxShadow: '0 8px 48px 0 #000a, 0 1.5px 8px #6cf8',
    padding: '48px 32px 32px 32px',
    minWidth: 340,
    maxWidth: 520,
    width: '90vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'auto',
    border: '1.5px solid #6cf4',
  };

  // Custom controls bar style
  const controlsBarStyle = {
    position: 'absolute',
    left: '50%',
    bottom: '6vh',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    zIndex: 10,
    background: 'rgba(20,20,30,0.55)',
    borderRadius: 32,
    boxShadow: '0 4px 32px #000a',
    padding: '18px 36px',
    pointerEvents: 'auto',
  };
  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    transition: 'background 0.2s',
  };
  const iconStyle = {
    height: '3.2em',
    width: 'auto',
    filter: 'drop-shadow(0 0 8px #6cf8)',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  // Placeholder for 3D animated background
  // In the future, replace this with a real 3D/WebGL/canvas animation
  const animationPlaceholder = (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1,
      background: 'radial-gradient(ellipse at 50% 60%, #222 60%, #0af 100%)',
      opacity: 0.7,
      pointerEvents: 'none',
      filter: 'blur(2px) saturate(1.2)',
    }}>
      {/* TODO: Replace with 3D animation that reacts to music */}
    </div>
  );

  function ParallaxUniverse({ audioRef, mouseParallax, onAudioLevel }) {
    const group = useRef();
    const { camera, size, gl, scene } = useThree();
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    // Store AudioContext and source node refs
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const [freqData, setFreqData] = useState(new Uint8Array(256));

    useEffect(() => {
      let raf;
      function setupAudio() {
        if (!audioRef.current) return;
        // Use a property on the audio element to track if a source node has already been created
        if (!audioRef.current._mediaElementSourceNode) {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          audioRef.current._mediaElementSourceNode = audioCtxRef.current.createMediaElementSource(audioRef.current);
          analyserRef.current = audioCtxRef.current.createAnalyser();
          audioRef.current._mediaElementSourceNode.connect(analyserRef.current);
          analyserRef.current.connect(audioCtxRef.current.destination);
          analyserRef.current.fftSize = 256;
          dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        }
      }
      function animate() {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          setFreqData(new Uint8Array(dataArrayRef.current));
          const avg = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
          if (onAudioLevel) onAudioLevel(avg / 255);
        }
        raf = requestAnimationFrame(animate);
      }
      setupAudio();
      animate();
      return () => {
        if (raf) cancelAnimationFrame(raf);
        // Do not close the AudioContext or disconnect the source node, as this can break hot reloads and cause further errors
      };
    }, [audioRef]);

    // Mouse parallax effect
    useEffect(() => {
      if (!mouseParallax) return;
      function handleMouse(e) {
        setMouse({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2,
        });
      }
      window.addEventListener('mousemove', handleMouse);
      return () => window.removeEventListener('mousemove', handleMouse);
    }, [mouseParallax]);

    useFrame(() => {
      // Camera parallax
      if (mouseParallax) {
        camera.position.x = (mouse?.x || 0) * 2;
        camera.position.y = -(mouse?.y || 0) * 1.2;
        camera.lookAt(0, 0, 0);
      }
      // Animate group for audio reactivity
      if (group.current) {
        const audioLevel = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
        group.current.rotation.z = Math.sin(Date.now() / 4000) * 0.1 + audioLevel * 0.2;
        group.current.rotation.x = Math.cos(Date.now() / 6000) * 0.08 + audioLevel * 0.1;
      }
    });

    // Calculate bass level (average of lowest 8 bins)
    const bassLevel = freqData.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
    // Calculate tempo/energy (average of bins 32-128)
    const tempoLevel = freqData.slice(32, 128).reduce((a, b) => a + b, 0) / 96 / 255;

    // Color palette for cycling: teal, cyan, pink, blue
    const colorPalette = [
      [0, 255, 191],   // teal (#00ffbf)
      [0, 255, 255],   // cyan (#00ffff)
      [255, 79, 163],  // pink (#ff4fa3)
      [0, 191, 255],   // blue (#00bfff)
    ];
    function lerpColor(a, b, t) {
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
    }

    // 3D radiating stars and circles
    return (
      <group ref={group}>
        {/* Space background stars */}
        <Stars
          radius={120}
          depth={80}
          count={18000}
          factor={2.2}
          saturation={0.7}
          fade
          speed={0.8}
        />
        {/* Highly reactive parallax stars (dots) and halftone effect */}
        {(() => {
          // Number of dots increases with tempo/energy
          const baseDots = 80;
          const extraDots = Math.floor(tempoLevel * 120); // up to +120
          const totalDots = baseDots + extraDots;
          return Array.from({ length: totalDots }).map((_, i) => {
            // Use tempoLevel for radius, color, and z-depth
            const t = Date.now() / (600 + i * 2);
            const angle = (i / totalDots) * Math.PI * 2 + t * (0.7 + tempoLevel * 1.5);
            const r = 3.5 + Math.sin(t + i) * (0.7 + tempoLevel * 2.5);
            const z = Math.cos(t + i) * (0.7 + tempoLevel * 2.5);
            const size = 0.06 + tempoLevel * 0.12 + Math.abs(Math.sin(t + i)) * 0.08;
            const glow = 1.2 + tempoLevel * 3.5 + Math.abs(Math.sin(t + i)) * 1.2;
            return (
              <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, z]}>
                <sphereGeometry args={[size, 8, 8]} />
                <meshStandardMaterial color={'#fffbe0'} emissive={'#ffe14f'} emissiveIntensity={glow} transparent opacity={0.85} />
              </mesh>
            );
          });
        })()}
        {/* Multi-layer dynamic radiating rays (stars) */}
        {(() => {
          // Layer configs: [count, base radius, speed multiplier]
          const layers = [
            [32, 2.5, 1],
            [24, 3.7, 0.7],
            [16, 5.2, 0.45],
          ];
          return layers.flatMap(([baseRays, baseRadius, speedMult], layerIdx) => {
            const extraRays = Math.floor((freqData.reduce((a, b) => a + b, 0) / freqData.length) / 12); // up to +20
            const totalRays = baseRays + extraRays;
            return Array.from({ length: totalRays }).map((_, i) => {
              const freqIdx = Math.floor((i / totalRays) * freqData.length);
              const mag = freqData[freqIdx] || 0;
              const r = baseRadius + mag / 32 + Math.sin(Date.now() / (600 * speedMult) + i) * (0.2 + mag / 255 * 0.5);
              const angle = (i / totalRays) * Math.PI * 2 + Date.now() / (900 * speedMult + mag * 2);
              const z = Math.sin(Date.now() / (1200 * speedMult) + i) * (0.5 + mag / 255 * 2.5);
              // Glow intensity and size are much higher with bass
              const glow = 1.5 + bassLevel * 7.5 + mag / 255 * 1.2;
              const size = 0.18 + mag / 255 * 0.22 + bassLevel * 0.45;
              // Color cycling
              const t = ((Date.now() / (1200 * speedMult) + i * 0.13) % 1);
              const paletteIdx = Math.floor(t * colorPalette.length);
              const nextIdx = (paletteIdx + 1) % colorPalette.length;
              const localT = (t * colorPalette.length) % 1;
              const color = lerpColor(colorPalette[paletteIdx], colorPalette[nextIdx], localT);
              return (
                <mesh key={layerIdx + '-' + i} position={[Math.cos(angle) * r, Math.sin(angle) * r, z]}>
                  <sphereGeometry args={[size, 16, 16]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} />
                </mesh>
              );
            });
          });
        })()}
        {/* Dynamic radiating circles (rings) */}
        {(() => {
          // Number of rings increases with music energy
          const baseRings = 6;
          const extraRings = Math.floor((freqData.reduce((a, b) => a + b, 0) / freqData.length) / 32); // up to +8
          const totalRings = baseRings + extraRings;
          return Array.from({ length: totalRings }).map((_, i) => {
            // Use low/mid frequency for ring size and z-depth
            const freqIdx = Math.floor((i / totalRings) * (freqData.length / 2));
            const mag = freqData[freqIdx] || 0;
            const baseR = 2.5 + i * 0.7 + mag / 128 + Math.sin(Date.now() / (900 + i * 100)) * (0.2 + mag / 255 * 0.5);
            const z = Math.cos(Date.now() / 1100 + i) * (0.7 + mag / 255 * 2.5);
            return (
              <mesh key={"ring"+i} rotation={[0,0,0]} position={[0,0,z]}>
                <torusGeometry args={[baseR, 0.08 + mag / 255 * 0.12, 32, 64]} />
                <meshStandardMaterial color={`hsl(${220 + i * 10},100%,70%)`} emissive={`hsl(${220 + i * 10},100%,70%)`} emissiveIntensity={0.25 + mag / 255 * 0.7} transparent opacity={0.45} />
              </mesh>
            );
          });
        })()}
      </group>
    );
  }

  function RhythmGame({ audioLevel, isPlaying }) {
    // Lane config
    const laneX = 0; // Centered
    const laneWidth = 512; // Use original image width or set to a large value
    const laneHeight = 700;
    const [balls, setBalls] = useState([]); // { y: px, hit: bool }
    const [lastSpawn, setLastSpawn] = useState(Date.now());
    const [failed, setFailed] = useState(false);
    const hitZoneY = 420; // px from top
    const speed = 2.5 + audioLevel * 4; // px/frame, faster with more energy

    // Spawn balls on beat (placeholder: spawn every ~900ms if playing)
    useEffect(() => {
      if (!isPlaying || failed) return;
      const now = Date.now();
      if (now - lastSpawn > 900 - audioLevel * 400) {
        setBalls(a => [...a, { y: 0, hit: false }]);
        setLastSpawn(now);
      }
      const id = setTimeout(() => {}, 100);
      return () => clearTimeout(id);
    }, [isPlaying, lastSpawn, audioLevel, failed]);

    // Animate balls
    useEffect(() => {
      if (!isPlaying || failed) return;
      let raf;
      function animate() {
        setBalls(a => a.map(ball => ({ ...ball, y: ball.y + speed })));
        raf = requestAnimationFrame(animate);
      }
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    }, [isPlaying, speed, failed]);

    // Remove balls that are off screen
    useEffect(() => {
      setBalls(a => a.filter(ball => !ball.hit && ball.y < hitZoneY + 60));
    }, [balls]);

    // Listen for song end to fail track
    useEffect(() => {
      if (!isPlaying) return;
      const onEnd = () => setFailed(true);
      const audio = document.querySelector('audio');
      if (audio) audio.addEventListener('ended', onEnd);
      return () => { if (audio) audio.removeEventListener('ended', onEnd); };
    }, [isPlaying]);

    // Render
    return (
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 8,
        overflow: 'hidden',
      }}>
        {/* Lane main section */}
        <img src={'/beatmap-element1@2x.png'} style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:laneWidth,height:laneHeight,zIndex:2,pointerEvents:'none',maxWidth:'90vw'}} alt="lane main" />
        {/* Falling balls */}
        {balls.map((ball, i) => (
          <div key={i} style={{
            position:'absolute',
            left:'50%',
            top:`calc(50% + ${ball.y - laneHeight/2 + 60}px)`,
            transform:'translateX(-50%)',
            width:40,
            height:40,
            borderRadius:'50%',
            background:'radial-gradient(circle at 30% 30%, #fff 70%, #6cf 100%)',
            boxShadow:'0 0 16px #6cf8, 0 0 4px #fff',
            zIndex:4,
            pointerEvents:'none',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2em',color:'#fff',fontWeight:700
          }}>●</div>
        ))}
        {/* Track failed message */}
        {failed && (
          <div style={{
            position:'absolute',
            left:'50%',
            top:'40%',
            transform:'translate(-50%,-50%)',
            color:'#ff4fa3',
            fontFamily:'MS Gothic, monospace',
            fontWeight:700,
            fontSize:'2.5em',
            textShadow:'0 0 18px #000,0 0 24px #fff',
            zIndex:20,
            pointerEvents:'none',
            background:'rgba(0,0,0,0.7)',
            borderRadius:18,
            padding:'32px 64px',
          }}>TRACK FAILED</div>
        )}
      </div>
    );
  }

  // Hide the spin text after 3 seconds
  useEffect(() => {
    if (!showSpinText) return;
    const timeout = setTimeout(() => setShowSpinText(false), 3000);
    return () => clearTimeout(timeout);
  }, [showSpinText]);

  // For left-to-right fade, animate a gradient mask
  const [spinMask, setSpinMask] = useState(0); // 0 to 1
  useEffect(() => {
    if (!showSpinText) return;
    let start = Date.now();
    let raf;
    function animate() {
      const elapsed = Date.now() - start;
      setSpinMask(Math.min(1, elapsed / 3000));
      if (elapsed < 3000) raf = requestAnimationFrame(animate);
    }
    animate();
    return () => raf && cancelAnimationFrame(raf);
  }, [showSpinText]);

  // Well done message state
  const [showWellDone, setShowWellDone] = useState(false);
  const [wellDoneSide, setWellDoneSide] = useState('left'); // 'left' or 'right'
  const [wellDoneMetallic, setWellDoneMetallic] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [spinCursor, setSpinCursor] = useState(false);
  const [spinStart, setSpinStart] = useState(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [lastMouse, setLastMouse] = useState(null);

  // Mouse spin detection
  useEffect(() => {
    let spinning = false;
    let spinningFast = false;
    let totalAngle = 0;
    let lastAngle = null;
    let lastTime = null;
    function onMouseMove(e) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const now = Date.now();
      if (lastAngle !== null && lastTime !== null) {
        let delta = angle - lastAngle;
        // Normalize to [-PI, PI]
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        // Only count if mouse is moving (not stuck)
        if (Math.abs(delta) > 0.01) {
          totalAngle += delta;
        }
        // If not moved for 2s, reset
        if (now - lastTime > 2000) {
          totalAngle = 0;
          setSpinStart(null);
        }
        // Metallic/celebratory: 1.5 full circles
        if (Math.abs(totalAngle) > Math.PI * 2 * 1.5 && !spinningFast) {
          spinningFast = true;
          setWellDoneMetallic(true);
          setShowConfetti(true);
          setSpinCursor(true);
          setTimeout(() => setWellDoneMetallic(false), 3000);
          setTimeout(() => setShowConfetti(false), 2000);
          setTimeout(() => setSpinCursor(false), 2000);
        }
        // Normal: 3 full circles
        if (Math.abs(totalAngle) > Math.PI * 2 * 3 && !spinning) {
          spinning = true;
          setShowWellDone(true);
          setWellDoneSide(side => side === 'left' ? 'right' : 'left');
          setTimeout(() => setShowWellDone(false), 2000);
          totalAngle = 0;
          setSpinStart(null);
        }
      }
      lastAngle = angle;
      lastTime = now;
    }
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'black',
      position: 'relative',
      overflow: 'hidden',
      border: 'none', // Remove any border
    }}>
      {/* Hidden audio element for playback and reactivity */}
      <audio ref={audioRef} style={{display:'none'}} />
      {/* Glowing yellow intro text */}
      {showSpinText && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          transform: 'translate(-50%, -50%)',
          color: '#ffe14f',
          fontFamily: 'MS Gothic, monospace',
          fontWeight: 700,
          fontSize: '2.2em',
          textShadow: '0 0 24px #ffe14f, 0 0 12px #fffbe0, 0 0 8px #fff',
          zIndex: 30,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.45)',
          borderRadius: 18,
          padding: '24px 48px',
          opacity: showSpinText ? 1 : 0,
          transition: 'opacity 0.7s',
          WebkitMaskImage: `linear-gradient(90deg, #fff ${100*spinMask}%, transparent ${100*spinMask+1}%)`,
          maskImage: `linear-gradient(90deg, #fff ${100*spinMask}%, transparent ${100*spinMask+1}%)`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}>
          Spin gugugugugururgrururgu To make the stars move
        </div>
      )}
      {/* Well done message */}
      {showWellDone && (
        <div style={{
          position: 'absolute',
          top: '44%',
          left: wellDoneSide === 'left' ? '12%' : 'auto',
          right: wellDoneSide === 'right' ? '12%' : 'auto',
          transform: 'translateY(-50%)',
          fontFamily: 'MS Gothic, monospace',
          fontWeight: 900,
          fontSize: '2.6em',
          background: 'rgba(0,0,0,0.32)',
          borderRadius: 18,
          padding: '28px 64px',
          zIndex: 40,
          pointerEvents: 'none',
          color: '#fff',
          textShadow: wellDoneMetallic ? '0 0 8px #ffe14f, 0 0 4px #fffbe0' : '0 0 4px #ffe14f',
          backgroundImage: wellDoneMetallic
            ? 'linear-gradient(90deg, #fffbe0 0%, #ffe14f 30%, #ff4fa3 60%, #b0cfff 100%)'
            : 'linear-gradient(90deg, #ffe14f 0%, #ff4fa3 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: wellDoneMetallic
            ? 'drop-shadow(0 0 8px #ffe14f) drop-shadow(0 0 4px #fffbe0) brightness(1.2)'
            : 'drop-shadow(0 0 4px #ffe14f)',
          opacity: showWellDone ? 1 : 0,
          transition: 'opacity 0.7s',
          animation: showWellDone ? 'fadeInOut 2s' : 'none',
        }}>
          <span style={{
            background: wellDoneMetallic
              ? 'linear-gradient(120deg, #fffbe0 0%, #ffe14f 30%, #ff4fa3 60%, #b0cfff 100%)'
              : 'none',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            position: 'relative',
            overflow: 'hidden',
          }}>
            Well done!
            {wellDoneMetallic && (
              <span style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shine 1.2s linear',
                pointerEvents: 'none',
              }} />
            )}
          </span>
        </div>
      )}
      {/* Confetti effect */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          {Array.from({ length: 48 }).map((_, i) => {
            const color = ['#ffe14f','#ff4fa3','#00ffbf','#00bfff','#fffbe0'][i%5];
            const left = Math.random()*100;
            const top = Math.random()*100;
            const rotate = Math.random()*360;
            const size = 16+Math.random()*18;
            return <div key={i} style={{
              position:'absolute',
              left:`${left}%`,
              top:`${top}%`,
              width:size,
              height:size,
              borderRadius:4,
              background:color,
              opacity:0.85,
              transform:`rotate(${rotate}deg)`,
              boxShadow:`0 0 12px 2px ${color}`,
              animation:'confetti-fall 2s linear',
            }} />;
          })}
        </div>
      )}
      {/* Spinning cursor effect */}
      {spinCursor && (
        <style>{`
          html, body { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="%23ffe14f" stroke="%23ff4fa3" stroke-width="4"/></svg>') 16 16, auto !important; }
          @keyframes shine { 0%{left:-100%;} 100%{left:100%;} }
          @keyframes confetti-fall { 0%{opacity:1;transform:translateY(-40px);} 100%{opacity:0;transform:translateY(100vh);} }
          @keyframes fadeInOut { 0%{opacity:0;} 10%{opacity:1;} 90%{opacity:1;} 100%{opacity:0;} }
        `}</style>
      )}
      <Canvas style={{position:'absolute',top:0,left:0,width:'100vw',height:'100vh',zIndex:1}} camera={{ position: [0, 0, 8], fov: 70 }}>
        <ParallaxUniverse audioRef={audioRef} mouseParallax={true} onAudioLevel={setAudioLevel} />
        {/* Optionally add <OrbitControls enableZoom={false} enablePan={false} /> for debug */}
      </Canvas>
      {/* Track info above controls */}
      {tracks.length > 0 && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '16vh',
          transform: 'translateX(-50%)',
          zIndex: 12,
          textAlign: 'center',
          color: '#fff',
          fontFamily: 'MS Gothic, MS PGothic, Meiryo, monospace',
          fontSize: '1.45em',
          letterSpacing: 1,
          textShadow: '0 0 8px #000, 0 0 16px #6cf',
          background: 'rgba(0,0,0,0.32)',
          borderRadius: 12,
          padding: '10px 32px 8px 32px',
          fontWeight: 600,
          maxWidth: 520,
          pointerEvents: 'none',
        }}>
          <div style={{fontSize:'1.1em',marginBottom:2}}>{tracks[current].title}</div>
          <div style={{fontSize:'0.95em',color:'#6cf',fontWeight:400}}>{tracks[current].artist}</div>
        </div>
      )}
      <RhythmGame audioLevel={audioLevel} isPlaying={isPlaying} />
      {/* Custom player controls and progress bar */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: 48,
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 'min(480px, 90vw)',
        pointerEvents: 'auto',
      }}>
        <div style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:32,marginBottom:18}}>
          <button onClick={handlePrev} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <img src={'/trackplayer-lasttrackbutton.png'} alt="Prev" style={{height:'2.2em',width:'auto',filter:'drop-shadow(0 0 8px #6cf8)'}} />
          </button>
          <button onClick={isPlaying ? handlePause : handlePlay} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <img src={process.env.PUBLIC_URL + (isPlaying ? '/trackplayer-pausebutton.png' : '/trackplayer-playbutton.png')} alt={isPlaying ? 'Pause' : 'Play'} style={{height:'2.2em',width:'auto',filter:'drop-shadow(0 0 8px #ffe14f)'}} />
          </button>
          <button onClick={handleNext} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <img src={'/trackplayer-nextbutton.png'} alt="Next" style={{height:'2.2em',width:'auto',filter:'drop-shadow(0 0 8px #6cf8)'}} />
          </button>
        </div>
        {/* Progress bar */}
        <div
          onClick={handleSeek}
          style={{
            width: '100%',
            height: 18,
            borderRadius: 12,
            background: 'rgba(255,225,79,0.13)',
            boxShadow: '0 0 16px #ffe14f88',
            position: 'relative',
            cursor: 'pointer',
            overflow: 'hidden',
            marginTop: 2,
            marginBottom: 2,
            border: '2px solid #ffe14f',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${Math.max(0, Math.min(1, trackProgress)) * 100}%`,
              borderRadius: 12,
              background: 'linear-gradient(90deg, #ffe14f 60%, #fffbe0 100%)',
              boxShadow: '0 0 24px 8px #ffe14f, 0 0 12px 2px #fffbe0',
              transition: 'width 0.2s',
              filter: 'blur(0.5px) brightness(1.2)',
            }}
          />
        </div>
        {/* Time left */}
        <div style={{color:'#ffe14f',fontFamily:'MS Gothic, monospace',fontSize:'0.95em',marginTop:2,textShadow:'0 0 6px #fffbe0'}}>
          {trackDuration > 0 ?
            `-${Math.max(0, Math.floor(trackDuration - trackCurrent)).toString().padStart(2, '0')}:${((trackDuration - trackCurrent) % 60).toFixed(0).padStart(2, '0')}`
            : ''}
        </div>
      </div>
    </div>
  );
} 