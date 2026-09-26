import React from 'react';
import { useState, useEffect } from 'react';
import './Reversible.css';

const Players = Object.freeze({
  WHITE: "white",
  BLACK: "black"
});

const BOARD_SIZE = 8;

function initializeBoard() {
  const board = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(undefined));
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = Players.WHITE;
  board[mid][mid] = Players.WHITE;
  board[mid - 1][mid] = Players.BLACK;
  board[mid][mid - 1] = Players.BLACK;
  return board;
}

// States
// - No Game Active / Game Over
//   - Show last winner
//   - Start New Game
// - Playing
//   - Show current player
//   - Highlight valid moves
//   - Accept valid move, update board, switch player

function Cell({ value, onClick }) {
  return (
    <div className={`cell ${value !== undefined ? value : ''}`} onClick={onClick}>
    </div>
  );
}

function Reversible() {
  const [board, setBoard] = React.useState(initializeBoard());

  return (
    <div className="game-page">
      <div className="title">Reversible</div>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div className="row" key={rowIndex}>
            {row.map((cellValue, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cellValue}
                onClick={() => {
                  // Handle cell click
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reversible;
