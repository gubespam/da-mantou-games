import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import ToggleSlide from '../components/ToggleSlide';
import './Reversible.css';

const Players = Object.freeze({
  WHITE: "white",
  BLACK: "black"
});

const GameModes = Object.freeze({
  PLAYING: "play",
  FINISHED: "done"
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

// generate all positions within a board
function* genCells(){
  for(let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex++){
    for(let colIndex = 0; colIndex < BOARD_SIZE; colIndex++){
      yield [rowIndex, colIndex]
    }
  }
}

function forEachCell(board, fn){
  for(const [row, col, cell] of genCells(board)){
    fn(row, col, cell)
  }
}

// get the last element of an array
function arrLast(arr){
  return arr[arr.length - 1]
}

// check if a generator returned nothing
function emptyGen(genResult){
  return genResult.next().done
}

function validCoord(row, col){
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function* genNeighbors(row, col){
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
window.genNeighbors = genNeighbors

function forEachNeighbor(board, row, col, fn){
  for (const [row, col] of genNeighbors(row, col)) {
    fn(row, col, board[row][col])
  }
}

// generate a consecutive row of positions in a direction that match a given player
// oneMore = if true, the final position beyond the end is returned
function* genLineWithPlayer(board, row, col, dirR, dirC, player, oneMore){
  // follow in this direction until we hit something beside the player's pieces
  let pr = row + dirR
  let pc = col + dirC
  while(validCoord(pr, pc) && board[pr][pc] == player){
    yield [pr, pc]
    pr += dirR
    pc += dirC
  }
  if(oneMore){
    yield [pr, pc]
  }
}
window.genLineWithPlayer = genLineWithPlayer

// for a given player and position, find all lines of consecutive pieces of the other player,
// eminating from this position.
// return is an array of lines
// each line is an array of positions corresponding to the other player's pieces
function* genCaptureLines(board, row, col, player){
  const otherPlayer = other(player)
  // go out in each neighboring direction
  // find all the neighboring pieces belonging to the other player
  const adjacentOtherPlayerPieces = [...genNeighbors(row, col).filter(([r,c]) => board[r][c] === otherPlayer)]
  for(const [r, c] of adjacentOtherPlayerPieces){
    // search for another piece of the current player on the other side of a line of the other player's pieces
    // follow in this direction until we hit something beside the other player's pieces
    // if we're on a valid place on the board and it's the current player's piece, we found the other side
    const dirR = r - row
    const dirC = c - col
    const line = [...genLineWithPlayer(board, row, col, dirR, dirC, otherPlayer, true)]
    let [pr, pc] = arrLast(line)
    if(validCoord(pr, pc) && board[pr][pc] == player){
      // found an end piece - this line is good to return
      yield line
    }
  }
}
window.genCaptureLines = genCaptureLines

// create a list of valid moves for the current player
// output is a list of [row, col]
function* genValidMoves(board, player) {
  // check all cells on board
  for(const [row, col] of genCells()){
    const cell = board[row][col]
    // if not occupied
    if(cell === undefined){
      // if(row == 0 && col == 6){
      //   debugger;
      // }
      // check for capture lines in all directions
      if(!emptyGen(genCaptureLines(board, row, col, player))){
        // if capture found, this is a valid move
        yield [row, col];
      }
    }
  }
}
window.genValidMoves = genValidMoves

function validMovesBoard(board, currentPlayer){
  const grid = emptyBoard()
  const validMoves = [...genValidMoves(board, currentPlayer)]
  for(const [r, c] of validMoves){
    grid[r][c] = true
  }
  return [grid, validMoves]
}

// given a position where a move happens, find the cells to be captured
function* genCaptureCells(board, row, col, player){
  const lines = genCaptureLines(board, row, col, player)
  for(const line of lines){
    for(const pos of line){
      yield pos
    }
  }
}

// place a piece at a position and perform captures
function makeMove(board, row, col, player) {
  const newBoard = board.map(r => r.slice());

  newBoard[row][col] = player;

  // do captures
  for(const [r, c] of genCaptureCells(board, row, col, player)){
    newBoard[r][c] = player;
  }

  return newBoard;
}

function determineWinner(board){
  // count number of pieces of each player
  let white = 0
  let black = 0
  forEachCell(board, (row, col, cell) => {
    if(cell === Players.WHITE){
      white++
    }
    if(cell === Players.BLACK){
      black++
    }
  })
  return white > black ? Players.WHITE : 
    black == white ? Players.BLACK :
    undefined
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

function initializeBoard2(setup){
  // const setup = [
  //   "    wb b",
  //   "   bbbww",
  //   "   bbb  ",
  //   "   bb   ",
  //   "   bw   ",
  //   "        ",
  //   "        ",
  //   "        ",
  // ]
  return setup.map(row => [...row].map(cell => ({ w: Players.WHITE, b: Players.BLACK }[cell])))
}
window.initializeBoard2 = initializeBoard2

function dumpBoard(){
  const board = window.board
  return board.map(row => row.map(cell => {
    if(cell === Players.WHITE) return "w"
    if(cell === Players.BLACK) return "b"
    return " "
  }).join(""))
}
window.dumpBoard = dumpBoard

// almost won
// setBoard(initializeBoard2(['b wwwbbb', 'bbbbbwbb', 'bwbbbbwb', 'bbwbwwwb', 'bbbwwbbb', 'bbwbwbbb', 'bbbwbbbb', 'bbbbbbbb']))
// setPlayer("white")
// setGameMode("play")

function GameStatus({gameMode, winner, currentPlayer, onNewGame}){
  if(gameMode == GameModes.FINISHED){
    const newGame = <button className='new-game' onClick={() => onNewGame()}>New Game</button>
    if(winner){
      return (
        <div className="current-player winner">
          <div>Winner</div>
          <Cell player={winner}></Cell>
          {newGame}
        </div>)
    } else {
      return (
        <div className="current-player tie">
          <div>Tie!</div>
          {newGame}
        </div>)
    }
  } else if(gameMode == GameModes.PLAYING){
    return (
      <div className="current-player">
        <div>Current Player</div>
        <Cell player={currentPlayer}></Cell>
      </div>)
  }
}

function Reversible() {
  const [currentPlayer, setCurrentPlayer] = useState(Players.BLACK)
  const [board, setBoard] = useState(initializeBoard());
  // const [currentPlayer, setCurrentPlayer] = useState(Players.WHITE)
  // const [board, setBoard] = useState(initializeBoard2());
  const [showValidMoves, setShowValidMoves] = useState(false);
  const [gameMode, setGameMode] = useState(GameModes.PLAYING);
  const [winner, setWinner] = useState(undefined)

  window.board = board
  window.setBoard = setBoard
  window.player = currentPlayer
  window.setPlayer = setCurrentPlayer
  window.setGameMode = setGameMode
  window.setWinner = setWinner

  const [validMovesGrid, validMoves] = useMemo(() => validMovesBoard(board, currentPlayer), [board, currentPlayer])

  return (
    <div className="game-page">
      <BackButton />
      <h1>Reversible</h1>
      <GameStatus {...{ gameMode, winner, currentPlayer }} 
        onNewGame={() => {
          setCurrentPlayer(Players.BLACK)
          setBoard(initializeBoard())
          setGameMode(GameModes.PLAYING)
          setWinner(undefined)
        }}
      />
      <div className="options">
        <div>Show valid moves</div>
        <ToggleSlide
          checked={showValidMoves}
          onChange={setShowValidMoves}
          ariaLabel="Enable option"
        />
      </div>
      <div className={`board ${showValidMoves ? 'show-valid' : ''}`}>
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
                      // console.log(`valid move at ${rowIndex}, ${colIndex}`)
                      const nextBoard = makeMove(board, rowIndex, colIndex, currentPlayer)
                      setBoard(nextBoard)

                      // check for player skip and game over scenarios
                      let nextPlayer = other(currentPlayer)
                      let [nextMovesGrid, nextMoves] = validMovesBoard(nextBoard, nextPlayer)
                      if(nextMoves.length === 0){
                        // next player cannot move, so skip that player's turn
                        nextPlayer = other(nextPlayer)
                        const a = validMovesBoard(nextBoard, nextPlayer)
                        nextMovesGrid = a[0]
                        nextMoves = a[1]
                        if(nextMoves.length === 0){
                          // this player cannot go either, so game over
                          setGameMode(GameModes.FINISHED)
                          console.log("Game over")
                          // determine who won
                          setWinner(determineWinner(board))
                        } else {
                          console.log(`Skipping ${other(currentPlayer)} - no valid moves`)
                        }
                      } else {
                        setCurrentPlayer(nextPlayer)
                        console.log("Next player: " + nextPlayer)
                        console.log(`${nextMoves.length} moves available`)
                      }
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
