// pages/lobby/[code].js
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Lobby() {
  const router = useRouter()
  const { code } = router.query
  const [players, setPlayers] = useState([])
  const [isCreator, setIsCreator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState(null)

  const availableColors = [
    '#ff4444', '#44ff44', '#4444ff', '#ffff44',
    '#ff44ff', '#44ffff', '#ff8844', '#8844ff',
    '#44ff88', '#ff4488'
  ]

  useEffect(() => {
    if (!code) return

    const fetchGame = async () => {
      try {
        setLoading(true)
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('code', code)
          .single()
        
        if (gameError) throw gameError
        if (!gameData) throw new Error('Game not found')

        setPlayers(gameData.players)

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          router.push('/')
          return
        }

        setIsCreator(gameData.creator_id === userData.user.id)
        const currentPlayer = gameData.players.find(p => p.id === userData.user.id)
        if (currentPlayer && currentPlayer.color) setSelectedColor(currentPlayer.color)
      } catch (error) {
        console.error('Error fetching game:', error.message)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchGame()

    const channel = supabase
      .channel(`games:${code}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'games', 
          filter: `code=eq.${code}`
        }, 
        payload => {
          setPlayers(payload.new.players)
          if (payload.new.state.status === 'playing') {
            router.push(`/game/${code}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [code, router])

  const handleColorSelect = async (color) => {
    if (players.some(p => p.color === color)) return
    
    const { data: userData } = await supabase.auth.getUser()
    const updatedPlayers = players.map(p =>
      p.id === userData.user.id ? { ...p, color } : p
    )
    
    await supabase
      .from('games')
      .update({ players: updatedPlayers })
      .eq('code', code)
    
    setSelectedColor(color)
  }

  const handleStart = async () => {
    if (players.length <= 1) {
      alert('Need at least 2 players to start the game!')
      return
    }

    const finderId = players[Math.floor(Math.random() * players.length)].id
    const newState = {
      status: 'playing',
      finder: finderId,
      found: [],
      startedAt: new Date().toISOString(),
      timeLimit: 300 // 5 minutes
    }
    await supabase
      .from('games')
      .update({ state: newState })
      .eq('code', code)
  }

  const allColorsSelected = players.every(p => p.color)

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Lobby - Code: {code}</h1>
      <h3>Players ({players.length}/10):</h3>
      <ul>
        {players.map(player => (
          <li key={player.id}>
            {player.username} {player.color ? (
              <span style={{ 
                display: 'inline-block', 
                width: 15, 
                height: 15, 
                background: player.color, 
                borderRadius: '50%', 
                marginLeft: 5 
              }}></span>
            ) : '(No color selected)'}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 20 }}>
        <h4>Select Your Color:</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {availableColors.map(color => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              disabled={players.some(p => p.color === color) || selectedColor}
              style={{
                width: 30,
                height: 30,
                background: color,
                borderRadius: '50%',
                border: '2px solid #fff',
                cursor: players.some(p => p.color === color) || selectedColor ? 'not-allowed' : 'pointer',
                opacity: players.some(p => p.color === color) ? 0.5 : 1
              }}
            />
          ))}
        </div>
      </div>
      {isCreator && (
        <button 
          onClick={handleStart}
          disabled={players.length <= 1 || !allColorsSelected}
          style={{ 
            padding: '10px 20px', 
            marginTop: 20,
            background: allColorsSelected && players.length > 1 ? '#44ff44' : '#888',
            cursor: allColorsSelected && players.length > 1 ? 'pointer' : 'not-allowed'
          }}
        >
          Start Game
        </button>
      )}
      <button 
        onClick={() => router.push('/')}
        style={{ padding: '10px 20px', marginTop: 20, marginLeft: 10 }}
      >
        Leave
      </button>
    </div>
  )
}