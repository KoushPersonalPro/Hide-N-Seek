// components/GameMap.js
import { useEffect, useRef } from 'react'
import Player from './Player'

export default function GameMap({ players, currentPlayerId, gameState, onMove }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const drawMap = () => {
      ctx.fillStyle = '#3a3a3a'
      ctx.fillRect(0, 0, 800, 600)

      const elements = [
        { type: 'door', x: 20, y: 20, w: 60, h: 40, color: '#2a2a5a' },
        { type: 'door', x: 720, y: 540, w: 60, h: 40, color: '#2a2a5a' },
        { type: 'crate', x: 100, y: 50, w: 80, h: 80, color: '#4a2c1d' },
        { type: 'crate', x: 150, y: 250, w: 100, h: 60, color: '#4a2c1d' },
        { type: 'crate', x: 650, y: 150, w: 60, h: 80, color: '#4a2c1d' },
        { type: 'crate', x: 50, y: 450, w: 80, h: 100, color: '#4a2c1d' },
        { type: 'machinery', x: 600, y: 20, w: 100, h: 120, color: '#5a5a5a' },
        { type: 'machinery', x: 200, y: 350, w: 120, h: 80, color: '#5a5a5a' },
        { type: 'pipe', x: 300, y: 100, w: 200, h: 20, color: '#8a8a8a' },
        { type: 'pipe', x: 50, y: 200, w: 20, h: 150, color: '#8a8a8a' },
        { type: 'pipe', x: 500, y: 400, w: 150, h: 20, color: '#8a8a8a' },
        { type: 'belt', x: 350, y: 250, w: 150, h: 40, color: '#3a3a5a' },
        { type: 'belt', x: 200, y: 500, w: 200, h: 40, color: '#3a3a5a' },
        { type: 'wall', x: 50, y: 350, w: 100, h: 20, color: '#6a6a6a' },
        { type: 'wall', x: 600, y: 450, w: 20, h: 100, color: '#6a6a6a' }
      ]

      elements.forEach(element => {
        ctx.fillStyle = element.color
        ctx.fillRect(element.x, element.y, element.w, element.h)
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(element.x + 5, element.y + 5, element.w, element.h)
        if (element.type === 'door') {
          ctx.fillStyle = '#ffffff20'
          ctx.fillRect(element.x + 10, element.y + 10, element.w - 20, element.h - 20)
        }
        if (element.type === 'belt') {
          ctx.strokeStyle = '#ffffff40'
          ctx.beginPath()
          ctx.moveTo(element.x, element.y + element.h/2)
          ctx.lineTo(element.x + element.w, element.y + element.h/2)
          ctx.stroke()
        }
      })
    }

    drawMap()
  }, [])

  return (
    <div style={{ 
      position: 'relative', 
      width: 800, 
      height: 600, 
      background: '#3a3a3a',
      border: '2px solid #ffffff20',
      borderRadius: 5,
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} width={800} height={600} style={{ position: 'absolute' }} />
      {players && players.map(player => (
        <Player
          key={player.id}
          {...player}
          isFinder={gameState.finder === player.id}
          isCurrent={currentPlayerId === player.id}
          onMove={onMove}
          gameState={gameState}
        />
      ))}
    </div>
  )
}