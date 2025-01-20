import React, { useState, useEffect, useCallback, useRef } from 'react';

const GridGame = () => {
  const GRID_SIZE = 10;
  const INITIAL_TIME = 70; // 1:10 in seconds
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [isActive, setIsActive] = useState(false);
  const [ntpm, setNtpm] = useState(0);
  const [bps, setBps] = useState(0);
  const [targetCell, setTargetCell] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const ntpmRef = useRef(0);
  
  const generateNewTarget = useCallback(() => {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    return `${row}-${col}`;
  }, []);

  // NEED TO FIX BPS FORMULA WITH ONE FROM GRID TASK PAPER
  const calculateBPS = (ntpmValue) => {
    const bitsPerTarget = Math.log2(GRID_SIZE * GRID_SIZE);
    const absNtpm = Math.abs(ntpmValue);
    const bps = ((absNtpm * bitsPerTarget) / 60).toFixed(2);
    return ntpmValue < 0 ? `-${bps}` : bps;
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
            setBps(calculateBPS(ntpmRef.current));
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleCellClick = (cellId) => {
    if (!isActive && !gameOver) {
      setIsActive(true);
    }
    
    if (gameOver) return;

    if (cellId === targetCell) {
      const newNtpm = ntpm + 1;
      setNtpm(newNtpm);
      ntpmRef.current = newNtpm;
      setTargetCell(generateNewTarget());
      setBps(calculateBPS(newNtpm));
    } else {
      const newNtpm = ntpm - 1;
      setNtpm(newNtpm);
      ntpmRef.current = newNtpm;
      setBps(calculateBPS(newNtpm));
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="mb-4 text-2xl text-black font-mono text-center">
        <div>{formatTime(timer)}</div>
        <div>{bps} BPS</div>
        <div>{ntpm} NTPM · {GRID_SIZE}×{GRID_SIZE}</div>
      </div>
      
      <div className="grid gap-px bg-gray-200 border border-gray-300 aspect-square" 
           style={{ 
             gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
             width: 'min(80vh, 800px)',
           }}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const col = index % GRID_SIZE;
          const cellId = `${row}-${col}`;
          const isTarget = cellId === targetCell;
          
          return (
            <div
              key={cellId}
              className={`relative cursor-pointer flex items-center justify-center ${
                isTarget 
                  ? 'bg-gray-950 hover:bg-gray-950 text-white' 
                  : 'bg-white hover:bg-gray-50 text-gray-500'
              }`}
              onClick={() => handleCellClick(cellId)}
            >
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridGame;
