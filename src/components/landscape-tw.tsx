import React from 'react';

// STUB COMPONENT for React Bits Pro Landscape
// When you run the real CLI command with your license key, this file will be overwritten with the actual WebGL implementation.
export default function Landscape({
  color,
  midColor,
  farColor,
  backgroundColor,
  speed,
  altitude,
  focal,
  elevation,
  scale,
  detail
}: any) {
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(to bottom, ${backgroundColor} 0%, ${midColor} 50%, ${farColor} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        fontSize: '12px',
        opacity: 0.8
      }}
    >
      [React Bits Pro Landscape Stub] 
      <br/> 
      Waiting for valid License Key installation.
    </div>
  );
}
