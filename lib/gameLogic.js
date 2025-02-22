// lib/gameLogic.js
export const startGame = (players) => {
    const finderIndex = Math.floor(Math.random() * players.length)
    return {
      status: 'playing',
      finder: players[finderIndex].id,
      found: [],
      startedAt: new Date().toISOString(),
      timeLimit: 300 // 5 minutes in seconds
    }
  }
  
  export const checkWinCondition = (gameState, players) => {
    if (gameState.found.length === players.length - 1) {
      return { status: 'finished', winner: 'finder' }
    }
    
    const elapsed = (new Date() - new Date(gameState.startedAt)) / 1000
    if (elapsed >= gameState.timeLimit) {
      return { status: 'finished', winner: 'hiders' }
    }
    
    return null
  }
  