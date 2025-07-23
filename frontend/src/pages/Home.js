import React, { useState, useRef, useEffect } from 'react';
import ButterflyCanvas from '../components/ButterflyCanvas';

export default function Home({ cameraState, musicLevel, isHome, resumeAudioContext }) {
  const logoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused
  const [loading, setLoading] = useState(true); // <-- Ensure loading state is defined

  // Play/pause handler (only trigger music on button click)
  const handleMusicToggle = async () => {
    console.log('Play button clicked');
    const audio = audioRef.current;
    if (!audio) {
      console.log('Audio element not found');
      return;
    }
    // Try to resume AudioContext if suspended (for browsers that require it)
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        const ctx = window._globalAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._globalAudioCtx = ctx;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }
    if (audio.paused) {
      if (resumeAudioContext && resumeAudioContext.current && resumeAudioContext.current.resumeAudioContext) {
        await resumeAudioContext.current.resumeAudioContext();
      }
      audio.play()
        .then(() => {
          // setIsPlaying(true); // Now handled by event
          console.log('Audio started');
        })
        .catch((err) => {
          // setIsPlaying(false); // Now handled by event
          if (err.name === 'NotAllowedError') {
            alert('Your browser blocked autoplay. Please interact with the page to enable music.');
          }
          console.error('Audio play failed:', err);
        });
    } else {
      audio.pause();
      // setIsPlaying(false); // Now handled by event
      console.log('Audio paused');
    }
  };

  // Fade out loading screen when everything is loaded
  useEffect(() => {
    if (!loading) return;
    const handle = setTimeout(() => setLoading(false), 1800); // Simulate loading delay
    return () => clearTimeout(handle);
  }, [loading]);

  // Update isPlaying state based on audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Update isPlaying state based on audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Ensure music auto-plays on Home page load (if not already playing)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Try to play if not already playing
    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((err) => {
          // Autoplay restrictions: ignore NotAllowedError, log others
          if (err.name !== 'NotAllowedError') {
            console.error('Audio play failed on Home load:', err);
          }
        });
      }
    }
    // Always focus the body to ensure keydown events are received
    if (document.body) document.body.focus();
    // Add a one-time pointerdown and spacebar listener to play audio on first user interaction
    const tryPlayOnUserInteract = (e) => {
      // For keydown, only trigger on spacebar (support both 'Space' and ' ')
      if (e.type === 'keydown' && e.code !== 'Space' && e.key !== ' ') return;
      if (audio.paused) {
        audio.play().then(() => {
          // Remove listeners after successful play
          document.removeEventListener('pointerdown', tryPlayOnUserInteract);
          document.removeEventListener('keydown', tryPlayOnUserInteract);
        }).catch((err) => {
          if (err.name !== 'NotAllowedError') {
            console.error('Audio play failed on user interaction:', err);
          }
        });
      } else {
        // Remove listeners if already playing
        document.removeEventListener('pointerdown', tryPlayOnUserInteract);
        document.removeEventListener('keydown', tryPlayOnUserInteract);
      }
    };
    document.addEventListener('pointerdown', tryPlayOnUserInteract);
    document.addEventListener('keydown', tryPlayOnUserInteract);
    // Cleanup
    return () => {
      document.removeEventListener('pointerdown', tryPlayOnUserInteract);
      document.removeEventListener('keydown', tryPlayOnUserInteract);
    };
  }, []);

  // Centered container for all main content
  const centerContainerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    maxWidth: '100vw',
    zIndex: 2,
    pointerEvents: 'auto',
  };
  // Make logo scaling more prominent
  const logoStyle = {
    width: 'min(480px, 80vw)',
    height: 'auto',
    margin: '0 0 30px 0',
    display: 'block',
    maxWidth: '95vw',
    filter: 'drop-shadow(0 0 32px #6cf) drop-shadow(0 0 8px #fff)',
    pointerEvents: 'none',
    transition: 'filter 0.3s',
    transform: `scale(${1 + musicLevel * 0.8})`, // More prominent
    transitionProperty: 'filter, transform',
    transitionDuration: '0.2s',
    willChange: 'transform',
  };
  const menuContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    margin: '30px 0 20px 0',
    pointerEvents: 'auto',
    flexWrap: 'wrap',
  };
  const imgButtonStyle = {
    position: 'relative',
    width: '200px',
    height: '60px',
    display: 'block',
    overflow: 'hidden',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    pointerEvents: 'auto',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };
  const imgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
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

  // Hover state for each button
  const [hovered, setHovered] = useState({ radio: false, about: false, archive: false });

  // Music controls (below menu buttons)
  const musicControls = isHome && (
    <div style={{ textAlign: 'center', margin: '32px 0 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto' }}>
      <button
        id="music-toggle-btn"
        aria-label="Toggle Music"
        type="button"
        onClick={handleMusicToggle}
        style={{
          fontFamily: 'MS Gothic, MS PGothic, Meiryo, monospace',
          fontSize: '1em',
          padding: 0,
          borderRadius: 0,
          border: 'none',
          background: 'none',
          color: '#6cf',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'none',
          height: 64,
          width: 64,
          verticalAlign: 'middle',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        <img
          id="music-toggle-img"
          src={process.env.PUBLIC_URL + (isPlaying ? '/PAUSE AUDIO.png' : '/PLAY AUDIO.png')}
          alt={isPlaying ? 'Pause Music' : 'Play Music'}
          style={{ width: 60, height: 60, display: 'block', pointerEvents: 'none', userSelect: 'none' }}
        />
      </button>
      {!isPlaying && (
        <div style={{ color: '#fff', marginTop: 12, fontSize: '1.1em', textShadow: '0 0 4px #000, 0 0 8px #6cf', background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '6px 18px', maxWidth: 320 }}>
          Click the play button to enable background music.
        </div>
      )}
    </div>
  );

  // Main content (centered)
  return (
    <>
      {/* Background music only on Home page */}
      <audio
        ref={audioRef}
        id="bg-music"
        src="https://sinbound.online.s3.amazonaws.com/public/tsukihime.mp3"
        loop
        hidden
      />
      {/* Loading screen with butterfly animation */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          zIndex: 10000,
          opacity: loading ? 1 : 0,
          pointerEvents: 'all',
          transition: 'opacity 0.7s cubic-bezier(.4,0,.2,1)',
        }}>
          <ButterflyCanvas visible={loading} />
        </div>
      )}
      {/* Removed the <audio> element from Home.js; only use the global one in App.js */}
      <div style={centerContainerStyle}>
        <img ref={logoRef} src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/logo_asset.png'} alt="logo" style={logoStyle} />
        <div style={menuContainerStyle}>
          <button
            style={imgButtonStyle}
            tabIndex={0}
            onMouseEnter={() => setHovered(h => ({ ...h, radio: true }))}
            onMouseLeave={() => setHovered(h => ({ ...h, radio: false }))}
            onClick={() => (window.location.href = '/radio')}
          >
            <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/radio-default.png'} alt="Radio" style={{ ...imgStyle, zIndex: 1, opacity: hovered.radio ? 0 : 1 }} className="default-img" />
            <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/radio-hover.png'} alt="Radio Hover" style={{ ...imgStyle, zIndex: 2, opacity: hovered.radio ? 1 : 0 }} className="hover-img" />
          </button>
          <button
            style={imgButtonStyle}
            tabIndex={0}
            onMouseEnter={() => setHovered(h => ({ ...h, about: true }))}
            onMouseLeave={() => setHovered(h => ({ ...h, about: false }))}
            onClick={() => (window.location.href = '/about')}
          >
            <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/about-default.png'} alt="About" style={{ ...imgStyle, zIndex: 1, opacity: hovered.about ? 0 : 1 }} className="default-img" />
            <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/about-hover.png'} alt="About Hover" style={{ ...imgStyle, zIndex: 2, opacity: hovered.about ? 1 : 0 }} className="hover-img" />
          </button>
          <button
            style={imgButtonStyle}
            tabIndex={0}
            onMouseEnter={() => setHovered(h => ({ ...h, archive: true }))}
            onMouseLeave={() => setHovered(h => ({ ...h, archive: false }))}
            onClick={() => (window.location.href = '/archive')}
          >
            <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/archive-default.png'} alt="Archive" style={{ ...imgStyle, zIndex: 1, opacity: hovered.archive ? 0 : 1 }} className="default-img" />
            <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/archive-hover.png'} alt="Archive Hover" style={{ ...imgStyle, zIndex: 2, opacity: hovered.archive ? 1 : 0 }} className="hover-img" />
          </button>
        </div>
        {musicControls}
      </div>
      {/* Divider and footer at the bottom */}
      <div style={{ position: 'fixed', left: 0, bottom: 60, width: '100vw', textAlign: 'center', zIndex: 2 }}>
        <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/divider.png'} alt="divider" style={dividerStyle} />
      </div>
      <footer style={{ ...footerStyle, position: 'fixed', left: 0, bottom: 0, width: '100vw', zIndex: 2, background: 'rgba(0,0,0,0.7)' }}>
        <a href="https://instagram.com/sinbound.soc" target="_blank" style={footerLinkStyle}>instagram</a>
        <a href="https://twitter.com/sinbound.soc" target="_blank" style={footerLinkStyle}>twitter</a>
        <a href="https://soundcloud.com/sinbound.soc" target="_blank" style={footerLinkStyle}>soundcloud</a>
      </footer>
    </>
  );
} 