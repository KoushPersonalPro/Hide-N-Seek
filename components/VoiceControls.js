// components/VoiceControls.js
import { useState } from 'react'

export default function VoiceControls() {
  const [micOn, setMicOn] = useState(false)

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
      <button 
        onClick={() => setMicOn(!micOn)}
        style={{
          background: micOn ? '#44ff44' : '#ff4444',
          border: 'none',
          padding: '5px 10px',
          borderRadius: 5,
          cursor: 'pointer'
        }}
      >
        Mic {micOn ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}