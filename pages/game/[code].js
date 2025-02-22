// pages/game/[code].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import GameMap from '../../components/GameMap'
import VoiceControls from '../../components/VoiceControls'
import { checkWinCondition } from '../../lib/gameLogic'

export default function Game() {
  const router = useRouter()
  const { code } = router.query
  const [gameState, setGameState] = useState(null)
  const [players, setPlayers] = useState([])
  const [showFinderPopup, setShowFinderPopup] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [currentPlayerId, setCurrentPlayerId] = useState(null)
  const [gracePeriod, setGracePeriod] = useState(10) // 5-second grace period
  const [showEliminatedPopup, setShowEliminatedPopup] = useState(false)

  useEffect(() => {
    if (!code) return

    const fetchInitialData = async () => {
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('code', code)
        .single()
      
      if (gameData) {
        setGameState(gameData.state)
        setPlayers(gameData.players)
        if (gameData.state.status === 'playing' && initialLoad) {
          setShowFinderPopup(true)
          setInitialLoad(false)
          // Start 5-second countdown
          const interval = setInterval(() => {
            setGracePeriod(prev => {
              if (prev <= 1) {
                clearInterval(interval)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
      }

      const { data: userData } = await supabase.auth.getUser()
      setCurrentPlayerId(userData.user?.id || null)
    }

    fetchInitialData()

    const channel = supabase
      .channel(`games:code=eq.${code}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'games', 
          filter: `code=eq.${code}`
        }, 
        payload => {
          setGameState(payload.new.state)
          setPlayers(payload.new.players)
          
          if (payload.new.state.status === 'playing' && initialLoad) {
            setShowFinderPopup(true)
            setInitialLoad(false)
          }

          // Show popup and redirect if eliminated
          if (payload.new.state.found.includes(currentPlayerId) && !showEliminatedPopup) {
            setShowEliminatedPopup(true)
            setTimeout(() => {
              router.push('/')
              setShowEliminatedPopup(false)
            }, 2000) // Show popup for 2 seconds before redirect
          }

          const winCondition = checkWinCondition(payload.new.state, payload.new.players)
          if (winCondition) {
            supabase
              .from('games')
              .update({ state: winCondition })
              .eq('code', code)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [code, initialLoad, currentPlayerId, router, showEliminatedPopup])

  const handleMove = async (newX, newY) => {
    const { data: userData } = await supabase.auth.getUser()
    const currentPlayerId = userData.user.id
    const updatedPlayers = players.map(p => 
      p.id === currentPlayerId ? { ...p, x: newX, y: newY } : p
    )

    if (gameState.finder === currentPlayerId && gracePeriod === 0) { // Only eliminate after grace period
      const newFound = updatedPlayers.filter(p => {
        if (p.id === currentPlayerId || gameState.found.includes(p.id)) return false
        const dx = p.x - newX
        const dy = p.y - newY
        return Math.sqrt(dx*dx + dy*dy) < 40
      }).map(p => p.id)

      if (newFound.length > 0) {
        await supabase
          .from('games')
          .update({ 
            players: updatedPlayers,
            state: { ...gameState, found: [...gameState.found, ...newFound] }
          })
          .eq('code', code)
        return
      }
    }

    await supabase
      .from('games')
      .update({ players: updatedPlayers })
      .eq('code', code)
  }

  const timeLeft = gameState?.status === 'playing' 
    ? Math.max(0, gameState.timeLimit - Math.floor((new Date() - new Date(gameState.startedAt)) / 1000))
    : null

  const finder = players.find(p => p.id === gameState?.finder)
  const finderName = finder?.username || 'Unknown'

  return (
    <div style={{ 
      padding: 20, 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <VoiceControls />
      <button 
        onClick={() => router.push('/')} 
        style={{ position: 'absolute', top: 20, right: 10, padding: '10px 20px' }}
      >
        Exit
      </button>
      {timeLeft !== null && (
        <div style={{ 
          position: 'absolute', 
          top: 25, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          color: 'white',
          fontSize: 20,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px #000'
        }}>
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      )}
      {gracePeriod > 0 && gameState?.status === 'playing' && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: 20,
          borderRadius: 10,
          color: 'white',
          textAlign: 'center',
          zIndex: 10
        }}>
          <h2>Hiders: Run Away!</h2>
          <p>{gracePeriod} seconds remaining</p>
        </div>
      )}
      {gameState && players.length > 0 && currentPlayerId && (
        <GameMap 
          players={players}
          currentPlayerId={currentPlayerId}
          gameState={gameState}
          onMove={handleMove}
        />
      )}
      {showFinderPopup && gameState?.status === 'playing' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          padding: 30,
          borderRadius: 10,
          color: 'white',
          textAlign: 'center',
          zIndex: 10,
          boxShadow: '0 0 10px rgba(255,255,255,0.3)'
        }}>
          <h2>The Finder Is...</h2>
          <p style={{ fontSize: 24, margin: '20px 0' }}>{finderName}</p>
          <div style={{
            width: 40,
            height: 40,
            background: finder?.color || '#888',
            borderRadius: '50%',
            margin: '0 auto 20px',
            border: '2px solid #fff'
          }} />
          <button 
            onClick={() => setShowFinderPopup(false)}
            style={{ 
              padding: '10px 20px', 
              background: '#44ff44',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            Start Playing
          </button>
        </div>
      )}
      {showEliminatedPopup && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.9)',
          padding: 30,
          borderRadius: 10,
          color: 'white',
          textAlign: 'center',
          zIndex: 10,
          boxShadow: '0 0 10px rgba(255,255,255,0.3)'
        }}>
          <h2>You Were Found and Eliminated!</h2>
          <p>Redirecting to home in 2 seconds...</p>
        </div>
      )}
      {gameState?.status === 'finished' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: 20,
          borderRadius: 10,
          color: 'white',
          textAlign: 'center'
        }}>
          <h2>{gameState.winner === 'finder' ? 'Finder Wins!' : 'Hiders Win!'}</h2>
          <button onClick={() => router.push('/')} style={{ padding: '10px 20px', marginTop: 20 }}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  )
}