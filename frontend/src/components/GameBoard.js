import React from 'react';
import './GameBoard.css';

const GameBoard = ({ board, onMove, disabled, lastMove }) => {
  const handleCellClick = (row, col) => {
    if (disabled || board[row][col] !== '') return;
    onMove(row, col);
  };

  const isLastMove = (row, col) => {
    return lastMove && lastMove.row === row && lastMove.col === col;
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`board-cell ${isLastMove(rowIndex, colIndex) ? 'last-move' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                disabled={disabled}
              >
                {cell && (
                  <span className={`cell-symbol ${cell.toLowerCase()}`}>
                    {cell}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard; 