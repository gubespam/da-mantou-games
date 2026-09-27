import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import './Reversible.css';

const Players = Object.freeze({
  WHITE: "white",
  BLACK: "black"
});

const BOARD_SIZE = 8;

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(undefined));
}

function initializeBoard() {
  const board = emptyBoard()
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = Players.WHITE;
  board[mid][mid] = Players.WHITE;
  board[mid - 1][mid] = Players.BLACK;
  board[mid][mid - 1] = Players.BLACK;
  return board;
}

function other(player){
  switch(player){
    case Players.WHITE:
      return Players.BLACK;
    case Players.BLACK:
      return Players.WHITE;
    default:
      return undefined;
  }
}

function* generateCells(){
  for(let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex++){
    for(let colIndex = 0; colIndex < BOARD_SIZE; colIndex++){
      yield [rowIndex, colIndex]
    }
  }
}

function forEachCell(board, fn){
  for(const [row, col, cell] of generateCells(board)){
    fn(row, col, cell)
  }
}

function validCoord(row, col){
  return row >= 0 && row < BOARD_SIZE && col > 0 && col < BOARD_SIZE
}

function* generateNeighbors(row, col){
  const rStart = Math.max(0, row - 1)
  const rEnd = Math.min(BOARD_SIZE, row + 2)
  const cStart = Math.max(0, col - 1)
  const cEnd = Math.min(BOARD_SIZE, col + 2)
  for(let rowIndex = rStart; rowIndex < rEnd; rowIndex++){
    for(let colIndex = cStart; colIndex < cEnd; colIndex++){
      if(rowIndex !== row || colIndex !== col){
        yield [rowIndex, colIndex]
      }
    }
  }
}
window.generateNeighbors = generateNeighbors

function forEachNeighbor(board, row, col, fn){
  for (const [row, col] of generateNeighbors(row, col)) {
    fn(row, col, board[row][col])
  }
}

// create a list of valid moves for the current player
// output is a list of [row, col]
function* generateValidMoves(board, player) {
  const otherPlayer = other(player)

  for(const [row, col] of generateCells()){
    const cell = board[row][col]
    if(cell === undefined){
      // yield [row, col]

      // find all the neighboring pieces belonging to the other player
      const adjacentOtherPlayerPieces = [...generateNeighbors(row, col).filter(([r,c]) => board[r][c] === otherPlayer)]
      for(const [r, c] of adjacentOtherPlayerPieces){
        // yield [row, col]
        // search for another piece of the current player on the other side of a line of the other player's pieces
        // follow in this direction until we hit something beside the other player's pieces
        // if we're on a valid place on the board and it's the current player's piece, we found the other side
        const dirR = r - row
        const dirC = c - col
        let pr = r + dirR
        let pc = c + dirC
        while(validCoord(pr, pc) && board[pr][pc] == otherPlayer){
          pr += dirR
          pc += dirC
        }
        if(validCoord(pr, pc) && board[pr][pc] == player){
          // found an end piece
          // starting point is a valid move
          yield [row, col];
        }
      }
    }
  }
}

function validMovesBoard(board, currentPlayer){
  const grid = emptyBoard()
  for(const [r, c] of generateValidMoves(board, currentPlayer)){
    grid[r][c] = true
  }
  return grid
}

function makeMove(board, row, col, player) {
  const newBoard = board.map(r => r.slice());
  newBoard[row][col] = player;
  return newBoard;
}

// States
// - No Game Active / Game Over
//   - Show last winner
//   - Start New Game
// - Playing
//   - Show current player
//   - Highlight valid moves
//   - Accept valid move, update board, switch player

function Cell({ player, valid, onClick }) {
  return (
    <div className={`cell ${player !== undefined ? player : ''} ${valid ? 'valid' : ''}`} onClick={onClick}>
    </div>
  );
}

function Reversible() {
  const [currentPlayer, setCurrentPlayer] = useState(Players.WHITE)
  const [board, setBoard] = useState(initializeBoard());

  const validMovesGrid = useMemo(() => validMovesBoard(board, currentPlayer), [board])

  return (
    <div className="game-page">
      <h1>Reversible</h1>
      <div className="current-player">
        <div>Current Player</div>
        <Cell player={currentPlayer}></Cell>
      </div>
      <div className='options'>
        
      </div>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div className="row" key={rowIndex}>
            {row.map((cellValue, colIndex) => {
              const valid = validMovesGrid[rowIndex][colIndex]
              return (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  player={cellValue}
                  valid={valid}
                  onClick={() => {
                    if(valid){
                      console.log(`valid move at ${rowIndex}, ${colIndex}`)
                      setBoard(makeMove(board, rowIndex, colIndex, currentPlayer))
                      setCurrentPlayer(other(currentPlayer))
                    } else {
                      console.log(`invalid move at ${rowIndex}, ${colIndex}`)
                    }
                  }}
                />)
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reversible;
