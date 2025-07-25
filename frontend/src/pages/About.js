import React from 'react';

export default function About({ cameraState }) {
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
  return (
    <>
      <div style={overlayStyle}>
        <a href="/" style={{display:'inline-block',marginBottom:10,color:'#6cf',textDecoration:'underline',fontSize:'1.1em'}}>← Return to Home</a>
        <img src={'https://sinbound.online.s3.amazonaws.com/public/logo_asset.png'} alt="logo" style={logoStyle} />
        <h2 style={{margin: 0, color: '#6cf'}}>About</h2>
        <div style={{margin: '140px auto 40px auto', width: '90%', maxWidth: 700, background: '#111', boxShadow: '0px 0px 5px black', padding: '32px 24px', borderRadius: 0, textAlign: 'center', fontFamily: 'inherit'}}>
          <h2 style={{color: '#fff', marginTop: 0, letterSpacing: 2, fontSize: '2rem', textTransform: 'uppercase', textAlign: 'center'}}>SINBOUND.SOC</h2>
          <p style={{color: '#ccc', fontSize: '1.15rem', textAlign: 'center'}}>
            Sinbound.soc is a creative collective dedicated to exploring the boundaries of sound, art, and digital culture.<br />
            We host radio shows, curate archives, and connect artists and listeners worldwide.<br />
            Our mission is to foster a vibrant community where experimentation and collaboration thrive.
          </p>
        </div>
      </div>
      <div style={{ width: '100%', textAlign: 'center', margin: '40px 0 0 0' }}>
        <img src={'https://sinbound.online.s3.amazonaws.com/public/divider.png'} alt="divider" style={dividerStyle} />
      </div>
      <footer style={footerStyle}>
        <a href="https://instagram.com/sinbound.soc" target="_blank" style={footerLinkStyle}>instagram</a>
        <a href="https://twitter.com/sinbound.soc" target="_blank" style={footerLinkStyle}>twitter</a>
        <a href="https://soundcloud.com/sinbound.soc" target="_blank" style={footerLinkStyle}>soundcloud</a>
      </footer>
    </>
  );
} 