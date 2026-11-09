import React, { useMemo, useState, useRef, useEffect } from 'react';
import BackButton from '../components/BackButton';
import './LapTimer.css';

function aggregate(values, initial, combiner, extractor = value => value){
  return values.reduce((result, element) => {
    const current = extractor(element)
    return combiner(result, current)
  }, initial)
}

function getTotal(values, extractor){
  return aggregate(values, 0, (a,b) => a + b, extractor)
}

function getMax(values, extractor = value => value){
  return aggregate(values, 0, 
    (result, current) => current > result ? current : result, 
    extractor)
}

function TimeDisplay({valueMs}){
  const secRaw = valueMs / 1000
  const min = Math.floor(secRaw / 60)
  const sec = Math.floor(secRaw % 60)
  function zeroPad(value){
    return String(value).padStart(2, '0')
  }
  // console.log(`TimeDisplay(${valueMs})`)
  return <div className='time-display'>
    <span className='min'>{zeroPad(min)}</span>:<span className='sec'>{zeroPad(sec)}</span>
  </div>
}

function DistanceDisplay({value, units}){
  const formattedValue = (Math.trunc(value * 100) / 100).toFixed(2)
  return <div className='distance-display'>
    <span className='value'>{formattedValue}</span>
    <span className='unit'> {units}</span>
  </div>
}

// returns ms per mile
function calculatePace(durationMs, lapDistance){
  // console.log(`calculatePace(${durationMs}, ${lapDistance})`)
  return durationMs / lapDistance
}

function LapRow({durationMs, index, lapDistanceMiles, maxDurationMs}){
  const pace = calculatePace(durationMs, lapDistanceMiles)
  // console.log(`LapRow({${durationMs}, ${index}, ${lapDistanceMiles}, ${maxDurationMs}})`)
  return <div className='lap-row'>
    <div className='row-num'>{index + 1}</div>
    <DistanceDisplay value={lapDistanceMiles * (index + 1)} units={"mi"} />
    <TimeDisplay valueMs={pace} />
  </div>
}

function LapsPanel({laps, lapDistanceMiles}){
  const maxDurationMs = getMax(laps, lap => lap.maxDurationMs)
  return <div className="laps">
    {laps.map((lap, index) => (
      <LapRow key={index} index={index} 
        durationMs={lap} maxDurationMs={maxDurationMs}
        lapDistanceMiles={lapDistanceMiles} />
    ))}
  </div>
}

function PlayPauseButton({playShown, onClick}){
  const playIcon = (
    <svg xmlns="http://w3.org" viewBox="3 0 18 20" width="20" height="20" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>)
  const pauseIcon = (
    <svg width="20px" height="20px" viewBox="0 50 400 400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" >
    <path d="M64 96 L160 96 L160 416 L64 416 L64 96 Z M224 96 L320 96 L320 416 L224 416 L224 96 Z" />
  </svg>)

  return (
    <button className='play-pause-btn' onClick={onClick}>
      {playShown ? playIcon : pauseIcon}
    </button>
  )
}

const sampleLaps = [
  2 * 60,
  2.1 * 60,
  2.1 * 60,
  2.1 * 60,
  3.2 * 60
].map(value => value * 1000)

function LapTimer() {
  const [laps, setLaps] = useState([]) // finished laps only
  const [lapDistanceMiles, setLapDistanceMiles] = useState(0.2)
  const [running, setRunning] = useState(false)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [currentLapElapsed, setCurrentLapElapsed] = useState(0)

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const lapStartTimeRef = useRef(0);

  useEffect(() => {
    if (running) {
      // calculate original start time based on elapsed time from now
      const currentTime = Date.now()
      startTimeRef.current = currentTime - totalElapsed
      lapStartTimeRef.current = currentTime - currentLapElapsed
      
      // update elapsed time every tick
      timerRef.current = setInterval(() => {
        const currentTime = Date.now()
        setTotalElapsed(currentTime - startTimeRef.current)
        setCurrentLapElapsed(currentTime - lapStartTimeRef.current)
      }, 10)
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [running])

  const toggleRunning = () => setRunning(!running)

  const newLap = () => {
    const newLaps = [...laps, currentLapElapsed]
    setLaps(newLaps)

    lapStartTimeRef.current = Date.now()
    setCurrentLapElapsed(0)
  }

  // console.log(laps)

  // Object.entries({}).forEach(([key, value]) => {
  //   window[key] = value
  // })


  // console.log(`totalDurationMs = ${totalDurationMs}`)
  const totalDistanceMiles = laps.length > 0 ? 
    laps.length * lapDistanceMiles : 0

  return (
    <div className="lap-timer-app">
      <div className="title">Lap Timer</div>
      <div className='lap-distance'>
        <div className='label'>Lap distance:</div>
        <input type='number' value={lapDistanceMiles} 
          onChange={(e) => setLapDistanceMiles(Number(e.target.value))}></input>
      </div>
      <LapsPanel laps={laps} lapDistanceMiles={lapDistanceMiles} />
      <div className="totals">
        <TimeDisplay valueMs={totalElapsed} />
        <TimeDisplay valueMs={currentLapElapsed} />
        {/* <DistanceDisplay value={totalDistanceMiles} units="mi"/> */}
      </div>
      <div className="controls">
        <PlayPauseButton playShown={!running} onClick={toggleRunning}/>
        <button className='lap-btn' onClick={newLap} disabled={!running}>Lap</button>
      </div>
    </div>
  );
};

export default LapTimer;
