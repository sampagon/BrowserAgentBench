import React, { useState, useEffect, useCallback, useRef } from 'react';

const GridGame = () => {
  const INITIAL_TIME = 70; // 1:10 in seconds
  const [gridSize, setGridSize] = useState(10);
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [isActive, setIsActive] = useState(false);
  const [bps, setBps] = useState(0);
  const [targetCell, setTargetCell] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [trials, setTrials] = useState([]); // Track all trials with timestamps
  const trialsRef = useRef([]); // Ref for access in timer
  
  const generateNewTarget = useCallback(() => {
    const row = Math.floor(Math.random() * gridSize);
    const col = Math.floor(Math.random() * gridSize);
    return `${row}-${col}`;
  }, [gridSize]);

  // Calculate NTPM based on last minute of trials
  const calculateNTPM = (trialsList) => {
    return trialsList
      .filter(trial => Date.now() - trial.timestamp < 60000) // Only last minute
      .reduce((sum, trial) => sum + (trial.hit ? 1 : -1), 0);
  };

  // Updated BPS calculation to match Neuralink's formula
  const calculateBPS = (ntpmValue) => {
    const bitsPerTarget = Math.log2(gridSize * gridSize - 1);
    return Math.max(0, (bitsPerTarget * ntpmValue) / 60).toFixed(2);
  };

  useEffect(() => {
    if (!targetCell) {
      setTargetCell(generateNewTarget());
    }
  }, [targetCell, generateNewTarget]);

  useEffect(() => {
    let interval = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const newTime = prevTimer - 1;
          if (newTime === 0) {
            setGameOver(true);
            setIsActive(false);
            const finalNTPM = calculateNTPM(trialsRef.current);
            setBps(calculateBPS(finalNTPM));
          }
          return newTime;
        });
        
        // Update NTPM and BPS every second
        const currentNTPM = calculateNTPM(trialsRef.current);
        setBps(calculateBPS(currentNTPM));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleCellClick = (cellId) => {
    if (!isActive && !gameOver) {
      setIsActive(true);
    }
    
    if (gameOver) return;

    const newTrial = {
      timestamp: Date.now(),
      hit: cellId === targetCell
    };

    const updatedTrials = [...trials, newTrial];
    setTrials(updatedTrials);
    trialsRef.current = updatedTrials;

    if (cellId === targetCell) {
      setTargetCell(generateNewTarget());
    }

    const currentNTPM = calculateNTPM(updatedTrials);
    setBps(calculateBPS(currentNTPM));
  };

  const handleGridSizeChange = (newSize) => {
    if (!isActive && !gameOver) {
      setGridSize(newSize);
      setTargetCell(null); // This will trigger regeneration of target
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const resetGame = () => {
    setTimer(INITIAL_TIME);
    setIsActive(false);
    setTrials([]);
    trialsRef.current = [];
    setBps(0);
    setGameOver(false);
    setTargetCell(generateNewTarget());
  };

  const currentNTPM = calculateNTPM(trials);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="mb-4 space-y-4">
        <div className="flex gap-2">
          {[10, 20, 30].map(size => (
            <button
              key={size}
              onClick={() => handleGridSizeChange(size)}
              disabled={isActive || gameOver}
              className={`px-4 py-2 rounded ${
                gridSize === size 
                  ? 'bg-gray-950 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${(isActive || gameOver) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {size}×{size}
            </button>
          ))}
        </div>
        
        <div className="text-2xl text-black font-mono text-center">
          <div>{formatTime(timer)}</div>
          <div>{bps} BPS</div>
          <div>{currentNTPM} NTPM · {gridSize}×{gridSize}</div>
        </div>
        
        {gameOver && (
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-gray-950 text-white rounded hover:bg-gray-800"
          >
            Play Again
          </button>
        )}
      </div>
      
      <div 
        className="grid gap-px bg-gray-200 border border-gray-300 aspect-square" 
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          width: 'min(80vh, 800px)',
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const cellId = `${row}-${col}`;
          const isTarget = cellId === targetCell;
          
          return (
            <div
              key={cellId}
              className={`relative cursor-pointer flex items-center justify-center ${
                isTarget 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-white hover:bg-gray-50 text-gray-500'
              }`}
              onClick={() => handleCellClick(cellId)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default GridGame;
