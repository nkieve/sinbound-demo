import React, { useEffect, useState, useRef } from 'react';
// Add import for URL param parsing

export default function Archive({ cameraState }) {
  const overlayStyle = {
    position: 'fixed',
    left: '50vw',
    top: '10vh',
    zIndex: 2,
    color: '#fff',
    pointerEvents: 'none',
    textAlign: 'center',
    transition: 'left 0.2s, top 0.2s',
    width: '100vw',
  };
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
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);

  // Helper to get URL param
  function getMixParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mix');
  }

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/songdatabase.json')
      .then(res => res.json())
      .then((data) => {
        const mixId = getMixParam();
        if (mixId) {
          // Only show the song with this id
          const filtered = data.filter(song => String(song.id) === String(mixId));
          setTracks(filtered);
        } else {
          setTracks(data);
        }
      })
      .catch(() => setTracks([]));
  }, []);

  const playTrack = (track) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = process.env.PUBLIC_URL + '/' + track.link;
      audioRef.current.style.display = 'block';
      audioRef.current.play();
    }
  };

  return (
    <>
      <div style={overlayStyle}>
        <a href="/" style={{display:'inline-block',marginBottom:10,color:'#6cf',textDecoration:'underline',fontSize:'1.1em'}}>← Return to Home</a>
        <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/logo_asset.png'} alt="logo" style={logoStyle} />
        <h2 style={{margin: 0, color: '#6cf'}}>Track Archive</h2>
        <div style={{margin: '40px auto', width: '100%', maxWidth: 700, minHeight: 200, background: 'rgba(0,0,0,0.3)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '1.2em', color: '#fff', pointerEvents: 'auto'}}>
          <h3 style={{color:'#6cf', marginBottom: 10}}>Track Library</h3>
          <ul style={{listStyle: 'none', padding: 0, margin: 0, width: '100%'}}>
            {tracks.map((track, idx) => (
              <li key={track.id} style={{marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111', borderRadius: 4, padding: '8px 12px'}}>
                <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320}}>{track.title}</span>
                <span>
                  <button onClick={() => playTrack(track)} style={{marginRight: 10, background: 'none', border: 'none', color: '#6cf', fontSize: 18, cursor: 'pointer'}}>▶</button>
                  <a href={process.env.PUBLIC_URL + '/' + track.link} download style={{color: '#6cf', textDecoration: 'underline', fontSize: 16}}>download</a>
                </span>
              </li>
            ))}
          </ul>
          <audio ref={audioRef} controls style={{marginTop: 18, display: currentTrack ? 'block' : 'none', width: '100%'}} />
        </div>
      </div>
      <div style={{ width: '100%', textAlign: 'center', margin: '40px 0 0 0' }}>
        <img src={process.env.PUBLIC_URL + 'https://sinbound.online.s3.amazonaws.com/public/divider.png'} alt="divider" style={dividerStyle} />
      </div>
      <footer style={footerStyle}>
        <a href="https://instagram.com/sinbound.soc" target="_blank" style={footerLinkStyle}>instagram</a>
        <a href="https://twitter.com/sinbound.soc" target="_blank" style={footerLinkStyle}>twitter</a>
        <a href="https://soundcloud.com/sinbound.soc" target="_blank" style={footerLinkStyle}>soundcloud</a>
      </footer>
    </>
  );
} 