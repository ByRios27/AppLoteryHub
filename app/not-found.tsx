import React from 'react';

export default function NotFound() {
  return (
    <div style={{
      fontFamily: 'system-ui, Roboto, Helvetica, Arial, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>404</h1>
      <h2 style={{ fontSize: 18 }}>Página no encontrada</h2>
    </div>
  );
}
