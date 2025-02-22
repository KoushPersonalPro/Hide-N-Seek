// pages/index.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Users, GamepadIcon, ArrowRightCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase'

export default function Home() {
  const [username, setUsername] = useState('')
  const [gameCode, setGameCode] = useState('')
  const router = useRouter()

  const handleCreate = async () => {
    if (!username) return alert('Please enter a username')
    
    try {
      const { data: userData, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      if (!userData.user) throw new Error('No user data returned')
      
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { error: insertError } = await supabase.from('games').insert({
        code,
        creator_id: userData.user.id,
        players: [{ id: userData.user.id, username, x: 0, y: 0 }],
        state: { status: 'waiting' }
      })
      
      if (insertError) throw insertError
      router.push(`/lobby/${code}`)
    } catch (error) {
      console.error('Error creating game:', error.message)
      alert('Failed to create game: ' + error.message)
    }
  }

  const handleJoin = async () => {
    if (!username || !gameCode) return alert('Please enter username and code')
    
    try {
      const { data: userData, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      if (!userData.user) throw new Error('No user data returned')
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', gameCode)
        .single()

      if (gameError) throw gameError
      if (!game) throw new Error('Game not found')

      if (game.players.length < 10) {
        const { error: updateError } = await supabase
          .from('games')
          .update({
            players: [...game.players, { id: userData.user.id, username, x: 0, y: 0 }]
          })
          .eq('code', gameCode)
        
        if (updateError) throw updateError
        router.push(`/lobby/${gameCode}`)
      } else {
        alert('Game is full')
      }
    } catch (error) {
      console.error('Error joining game:', error.message)
      alert('Failed to join game: ' + error.message)
    }
  }

  return (
    <div className="container">
      <div className="card-wrapper">
        <div className="card">
          <div className="header">
            <GamepadIcon className="game-icon" />
            <h1>Hide & Seek</h1>
          </div>

          <div className="form">
            <div className="input-wrapper">
              <div className="input-icon">
                <Users />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <button className="button create-button" onClick={handleCreate}>
              <Sparkles />
              <span>Create New Game</span>
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <div className="input-wrapper">
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                maxLength={6}
                className="code-input"
              />
            </div>

            <button className="button join-button" onClick={handleJoin}>
              <ArrowRightCircle />
              <span>Join Game</span>
            </button>
          </div>
        </div>

        <p className="footer">
          Join the fun! Create a new game or enter a code to join an existing one.
        </p>
      </div>

      <style>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .card-wrapper {
          width: 100%;
          max-width: 28rem;
        }

        .card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
          margin: 0;
        }

        .game-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: white;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .input-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          color: white;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
        }

        input[type="text"] {
          padding-left: 2.75rem;
        }

        .code-input {
          text-align: center;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .button {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          border: none;
          font-weight: 600;
          color: white;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .button svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .create-button {
          background: linear-gradient(to right, #22d3ee, #3b82f6);
        }

        .create-button:hover {
          background: linear-gradient(to right, #06b6d4, #2563eb);
          transform: scale(1.05);
        }

        .join-button {
          background: linear-gradient(to right, #f43f5e, #e11d48);
        }

        .join-button:hover {
          background: linear-gradient(to right, #e11d48, #be123c);
          transform: scale(1.05);
        }

        .button:active {
          transform: scale(0.95);
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .divider span {
          margin: 0 1rem;
        }

        .footer {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 640px) {
          .card {
            padding: 1.5rem;
          }

          .header h1 {
            font-size: 2rem;
          }

          .game-icon {
            width: 2rem;
            height: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
