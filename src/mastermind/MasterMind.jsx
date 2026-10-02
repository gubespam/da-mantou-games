import React, { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import './MasterMind.css';

// Code Pegs
const CodePegs = Object.freeze({
  RED: "red",
  BLUE: "blue",
  GREEN: "green",
  YELLOW: "yellow",
  WHITE: "white",
  BLACK: "black"
});

// Scoring Pegs
// black - right color, right spot
// white - right color, wrong spot
// none - color not in sequence
// duplicate colors results in only one peg, black priority over white
const ScorePegs = Object.freeze({
  WHITE: "white",
  BLACK: "black"
});

// Game Modes
// FINISHED - no active game
// SET_CODE - codemaker sets the secret code
// GUESSING - codebreaker places a guess
const GameModes = Object.freeze({
  SET_CODE: "set_code",
  GUESSING: "guessing",
  FINISHED: "finished"
});

const BOARD_WIDTH = 4;
const BOARD_HEIGHT = 10;

function emptySecret() {
  return new Array(BOARD_WIDTH).fill(undefined);
}

function emptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => new Array(BOARD_WIDTH).fill(undefined));
}

function initializeBoard() {
  const board = emptyBoard()
  return board;
}

// Winning condition
// All 4 scoring pegs are black (sequence matches exactly)

// A single code peg in the guesses or secret row
function CodePeg({value, onClick, children}){
  return <div className={`code-peg ${value === undefined ? "none" : value}`} onClick={onClick}>
    {children}
  </div>
}

// A floating window that lets the user choose a peg color
// A small grid with all the colors, using flex to organize them into a 2x3 grid
function CodePegPicker({onSelect}){
  return <div className="code-picker">
    {Object.entries(CodePegs).map(([key, value]) => 
      <CodePeg key={value} value={value} onClick={(event) => {
        event.stopPropagation() // don't trigger click on parent element (the code peg)
        onSelect(value)
      }} />
    )}
  </div>
}

// A guess row which the user can edit (picking peg colors)
function PickableGuess({guess, onChange}){
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState(0)
  return <div className="guess-row pickable">
    {guess.map((value, index) => (
      <CodePeg key={index} value={value} onClick={() => {
        setPickerOpen(true)
        console.log("picker open")
        setPickerIndex(index)
      }}>
        {
          // console.log(`${pickerOpen} && ${pickerIndex} == ${index}`) || 
          pickerOpen && pickerIndex == index ? 
          (<CodePegPicker onSelect={(picked) => {
            setPickerOpen(false)
            console.log("close picker")
            const newGuess = [...guess]
            newGuess[index] = picked
            onChange(newGuess)
          }} />) : null
        }
      </CodePeg>
    ))}
  </div>
}

// The bar showing the secret while the first player edits it
function Secret({secret, onChange}){
  return (
    <div className="secret">
      <div>Pick your secret code</div>
      <PickableGuess guess={secret} onChange={(guess) => onChange(guess)} />
    </div>
  )
}

// A scoring peg on the side of a scored guess row
function ScoringPeg({value, onClick}){
  return <div className={`score-peg ${value}`} onClick={onClick}>
  </div>
}

// An immutable guess row that has already been scored
function ScoredGuessRow({guess, score}){
  return (
    <div className="guess-row scored">
      <div className="guess">
        {guess.map((peg, colIndex) => {
          return (
            <CodePeg
              key={colIndex}
              value={peg}
            />)
        })}
      </div>
      <div className="score">
        {score.map((peg, colIndex) => {
          return (
            <ScoringPeg
              key={colIndex}
              value={peg}
            />)
        })}
      </div>
    </div>)
}

function Board({board, guessIndex, setBoard}){
  return (
    <div className={`board`}>
      {board.filter((row, rowIndex) => rowIndex <= guessIndex)
        .map((row, rowIndex) => (
          rowIndex == guessIndex ?
            <PickableGuess guess={row.guess} onChange={(newGuess) => {
              const newBoard = [...board]
              const newRow = [...row]
              newRow.guess = newGuess
              newBoard[guessIndex] = newRow
              setBoard(newBoard)
            }} />
          : <ScoredGuessRow guess={row.guess} score={row.score} />
          ))
      }
    </div>)
}

function MasterMind() {
  const [secret, setSecret] = useState(() => emptySecret())
  const [board, setBoard] = useState(initializeBoard());
  const [guessIndex, setGuessIndex] = useState(0)
  const [gameMode, setGameMode] = useState(GameModes.SET_CODE);
  const [hasWon, setHasWon] = useState(false);

  const submitSecret = (secret) => {
    setSecret(secret)
    setGameMode(GameModes.GUESSING)
  }

  const submitGuess = () => {
    const score = [] // TODO calculate score
    // TODO handle game over - user won

    const newBoard = [...board]
    const guess = board[guessIndex].guess
    newBoard[guessIndex] = {guess, score}
    setBoard(newBoard)
    setGuessIndex(guessIndex + 1)

    if(guessIndex == BOARD_HEIGHT){
      // game over
      setGameMode(GameModes.FINISHED)
    }
  }

  return (
    <div className={`game-page`}>
      <BackButton />
      <h1>Master Mind</h1>
      {
        gameMode === GameModes.FINISHED &&
          <button className="new-game" onClick={() => {
            setSecret(emptySecret())
            setBoard(initializeBoard());
            setGuessIndex(0)
            setGameMode(GameModes.SET_CODE);
            setHasWon(false);
          }} >New Game</button>
      }

      {/* <div>gameMode: {gameMode}</div> */}
      <div className={`playarea mm-${gameMode} ${hasWon ? "mm-haswon" : ""}`}>
        {
          gameMode === GameModes.SET_CODE &&
            <Secret secret={secret} onChange={setSecret}/> 
        }
        {
          gameMode !== GameModes.SET_CODE &&
            <Board board={board} setBoard={setBoard} />
        }
        {
          gameMode !== GameModes.FINISHED &&
            <button className="guess-submit" 
              onClick={gameMode === GameModes.GUESSING ? submitGuess : submitSecret} 
              >Submit</button>
        }
      </div>
    </div>
  );
};

export default MasterMind;
