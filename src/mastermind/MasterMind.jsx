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

function emptyGuess() {
  return new Array(BOARD_WIDTH).fill(undefined);
}

function emptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => ({
    guess: emptyGuess(),
    score: emptyGuess()
  }));
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
function PickableGuess({guess, onChange, onSubmit}){
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState(0)
  const submitEnabled = guess.filter(peg => peg === undefined).length === 0
  console.log('submitEnabled', submitEnabled)
  return <div className="guess-row pickable">
    <div className="guess">
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
    <button className="guess-submit" 
      onClick={() => onSubmit()}
      disabled={!submitEnabled}
      >Submit</button>
  </div>
}

// The bar showing the secret while the first player edits it
function Secret({secret, onChange, onSubmit}){
  return (
    <div className="secret">
      <div>Pick your secret code</div>
      <PickableGuess 
        guess={secret} 
        onChange={(guess) => onChange(guess)} 
        onSubmit={onSubmit}/>
    </div>
  )
}

// A scoring peg on the side of a scored guess row
function ScoringPeg({value, onClick}){
  return <div className={`score-peg ${value}`} onClick={onClick}></div>
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

function Board({board, guessIndex, setBoard, onSubmit}){
  return (
    <div className="mm-board">
      {board/*.filter((row, rowIndex) => rowIndex <= guessIndex)*/
        .map((row, rowIndex) => (
          (rowIndex === guessIndex ?
            <PickableGuess key={rowIndex} guess={row.guess} onChange={(newGuess) => {
              const newBoard = [...board]
              const newRow = {...row}
              newRow.guess = newGuess
              newBoard[guessIndex] = newRow
              setBoard(newBoard)
            }} onSubmit={onSubmit}/>
          : <ScoredGuessRow key={rowIndex} guess={row.guess} score={row.score} />
          )))
        }
    </div>)
}

// input: array of guess colors, secret
// output: array of score colors
function scoreGuess(guess, secret){
  // black pegs first
  // white pegs next
  // undefined: not part of secret
  const score = new Array(BOARD_WIDTH)

  // compare each peg against secret
  let blackCount = 0
  let whiteCount = 0
  guess.forEach((peg, index) => {
    // first: black: right color, right position
    if(secret[index] === peg){
      blackCount++;
    }
    // second: white: right color, wrong position
    else if(secret.includes(peg)){
      whiteCount++;
    }
  })
  for(let i = 0; i < blackCount; i++){
    score[i] = ScorePegs.BLACK
  }
  for(let i = blackCount; i < blackCount + whiteCount; i++){
    score[i] = ScorePegs.WHITE
  }
  return score
}

function MasterMind() {
  const [secret, setSecret] = useState(() => emptyGuess())
  const [board, setBoard] = useState(initializeBoard());
  const [guessIndex, setGuessIndex] = useState(0)
  const [gameMode, setGameMode] = useState(GameModes.SET_CODE);
  const [hasWon, setHasWon] = useState(false);

  Object.entries({board, setBoard, guessIndex, setGuessIndex, gameMode, setGameMode}).forEach(([key, value]) => {
    window[key] = value
  })

  const submitSecret = () => {
    setGameMode(GameModes.GUESSING)
  }

  const submitGuess = () => {
    const guess = board[guessIndex].guess
    const score = scoreGuess(guess, secret)

    // TODO handle game over - user won

    const newBoard = [...board]
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
      <h1>Code Breaker</h1>
      <div className='hints'>
        <div className='hint-row'>
          <ScoringPeg value="white"></ScoringPeg>
          <span>Right color, wrong position</span>
        </div>
        <div className='hint-row'>
        <ScoringPeg value="black"></ScoringPeg>
          <span>Right color, right position</span>
        </div>
      </div>
      {
        gameMode === GameModes.FINISHED &&
          <button className="new-game" onClick={() => {
            setSecret(emptyGuess())
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
            <Secret secret={secret} onChange={setSecret} onSubmit={submitSecret}/> 
        }
        {
          gameMode !== GameModes.SET_CODE &&
            <Board board={board} setBoard={setBoard} guessIndex={guessIndex} onSubmit={submitGuess}/>
        }
      </div>
    </div>
  );
};

export default MasterMind;
