import React, { useState, useRef, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Neon3DGrids from './components/Neon3DGrids';
import ButterflyCanvas from './components/ButterflyCanvas';

const Home = lazy(() => import('./pages/Home'));
const Radio = lazy(() => import('./pages/Radio'));
const About = lazy(() => import('./pages/About'));
const Archive = lazy(() => import('./pages/Archive'));
const TrackPlayer = lazy(() => import('./pages/TrackPlayer'));

function AudioController() {
  const location = useLocation();
  useEffect(() => {
    const audio = document.getElementById('bg-music');
    if (!audio) return;
    if (location.pathname === '/') {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [location]);
  return null;
}

function App() {
  const [cameraState, setCameraState] = useState({ t: 0, x: 0, y: 0, z: 48 });
  const [musicLevel, setMusicLevel] = useState(0);
  const audioRef = useRef(null);
  const neonGridsRef = useRef(null);
  // Use useLocation from react-router-dom
  const location = window.location.pathname;

  // Only show Suspense fallback for non-home pages
  if (location === '/') {
    return (
      <Router>
        <Neon3DGrids ref={neonGridsRef} onCameraStateChange={setCameraState} onMusicLevelChange={setMusicLevel} />
        <Home cameraState={cameraState} musicLevel={musicLevel} isHome={true} resumeAudioContext={neonGridsRef} />
        <audio id="page-transition-sfx" src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/sfx090.wav'} preload="auto" style={{ display: 'none' }} />
      </Router>
    );
  }

  return (
    <Router>
      {/* Do NOT render Neon3DGrids on any page except Home */}
      <Suspense fallback={<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000', zIndex: 10000 }}><ButterflyCanvas visible={true} /></div>}>
        <Routes>
          <Route path="/" element={<Home cameraState={cameraState} musicLevel={musicLevel} isHome={true} resumeAudioContext={neonGridsRef} />} />
          <Route path="/radio" element={<Radio cameraState={cameraState} />} />
          <Route path="/about" element={<About cameraState={cameraState} />} />
          <Route path="/archive" element={<Archive cameraState={cameraState} />} />
          <Route path="/trackplayer" element={<TrackPlayer cameraState={cameraState} />} />
        </Routes>
      </Suspense>
      <audio id="page-transition-sfx" src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/sfx090.wav'} preload="auto" style={{ display: 'none' }} />
    </Router>
  );
}

export default App;
