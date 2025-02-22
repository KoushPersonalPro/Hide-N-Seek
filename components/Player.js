// components/Player.js
import { useEffect } from 'react'

export default function Player({ x = 0, y = 0, username, color, isFinder, isCurrent, onMove, gameState }) {
  useEffect(() => {
    if (!isCurrent || gameState.found?.includes(username)) return

    const handleKeyDown = (e) => {
      const speed = 15
      let newX = x
      let newY = y

      switch(e.key) {
        case 'ArrowUp': newY -= speed; break
        case 'ArrowDown': newY += speed; break
        case 'ArrowLeft': newX -= speed; break
        case 'ArrowRight': newX += speed; break
        default: return
      }

      newX = Math.max(0, Math.min(780, newX))
      newY = Math.max(0, Math.min(580, newY))
      
      const mapElements = [
        { x: 20, y: 20, w: 60, h: 40 },
        { x: 720, y: 540, w: 60, h: 40 },
        { x: 100, y: 50, w: 80, h: 80 },
        { x: 150, y: 250, w: 100, h: 60 },
        { x: 650, y: 150, w: 60, h: 80 },
        { x: 50, y: 450, w: 80, h: 100 },
        { x: 600, y: 20, w: 100, h: 120 },
        { x: 200, y: 350, w: 120, h: 80 },
        { x: 300, y: 100, w: 200, h: 20 },
        { x: 50, y: 200, w: 20, h: 150 },
        { x: 500, y: 400, w: 150, h: 20 },
        { x: 350, y: 250, w: 150, h: 40 },
        { x: 200, y: 500, w: 200, h: 40 },
        { x: 50, y: 350, w: 100, h: 20 },
        { x: 600, y: 450, w: 20, h: 100 }
      ]

      const playerRect = { x: newX, y: newY, w: 20, h: 20 }
      const hasCollision = mapElements.some(element => 
        playerRect.x < element.x + element.w &&
        playerRect.x + playerRect.w > element.x &&
        playerRect.y < element.y + element.h &&
        playerRect.y + playerRect.h > element.y
      )

      if (!hasCollision && (newX !== x || newY !== y)) {
        onMove(newX, newY)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [x, y, isCurrent, onMove, gameState.found, username])

  const torchStyle = {
    position: 'absolute',
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(255,255,200,0.4) 0%, rgba(0,0,0,0) 70%)',
    left: x - 50,
    top: y - 50,
    pointerEvents: 'none',
    zIndex: 1,
    borderRadius: '50%'
  }

  const isEliminated = gameState.found?.includes(username)

  return (
    <div style={{ 
      position: 'absolute', 
      left: x, 
      top: y, 
      zIndex: 2,
      transition: 'left 0.1s ease-out, top 0.1s ease-out'
    }}>
      <div
        style={{
          width: 20,
          height: 20,
          background: color || '#888',
          borderRadius: '50%',
          border: '2px solid #fff',
          position: 'relative',
          opacity: isEliminated ? 0.3 : 1,
          boxShadow: '0 0 5px rgba(255,255,255,0.3)',
          transition: 'opacity 0.3s'
        }}
      />
      <div style={{ 
        position: 'absolute', 
        top: -25, 
        left: '50%', 
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: 12,
        textShadow: '1px 1px 2px #000',
        whiteSpace: 'nowrap'
      }}>
        {username}
      </div>
      {isFinder && gameState.status === 'playing' && <div style={torchStyle} />}
      {isEliminated && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'red',
          fontSize: 14,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px #000'
        }}>
          Eliminated
        </div>
      )}
    </div>
  )
}