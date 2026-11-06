import React, { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import './LapTimer.css';

// View Modes
const AppModes = Object.freeze({
  SETTINGS: "settings",
  APP: "app",
});

// returns minutes per mile
function calculatePace(durationMs, lapDistance){
  return durationMs / lapDistance / 60000
}

function getTotal(values){
  let total = 0
  values.forEach(value => total += value)
  return total
}

function TimeDisplay({valueMs}){
  const min = Math.floor(valueMs / 1000 / 60)
  const sec = Math.floor(valueMs / 1000)
  return <div className='time-display'>
    <span className='min'>{min}</span>
    <span className='sec'>{sec}</span>
  </div>
}

function DistanceDisplay({value, units}){
  return <div className='distance-display'>
    <span className='value'>{value}</span>
    <span className='unit'>{units}</span>
  </div>
}

function ProgressBar({value, max}){
  const percentFilled = Math.floor(value * 100 / max)
  // TODO styles to control bar width
  return <div className='progress'>
    <div className='bar'></div>
  </div>
}

function LapRow({durationMs, index, lapDistanceMiles, maxDurationMs}){
  const pace = calculatePace(durationMs, lapDistanceMiles)
  return <div className='lap-row'>
    <div className='row-num'>{index + 1}</div>
    <ProgressBar value={durationMs} max={maxDurationMs}/>
    <TimeDisplay valueMs={pace} />
  </div>
}

function LapTimer() {
  const [laps, setLaps] = useState([])
  const [appMode, setAppMode] = useState(AppModes.APP)
  const [lapDistanceMiles, setLapDistanceMiles] = useState(0.20)

  // Object.entries({}).forEach(([key, value]) => {
  //   window[key] = value
  // })

  const totalDurationMs = getTotal(laps, lap => lap.durationMs)
  const totalDistanceMiles = laps.length > 0 ? 
    (laps.length - 1) * lapDistanceMiles : 0

  return (
    <div className="lap-timer-app">
      <BackButton />
      <div className="title">Lap Timer</div>
      <div className="laps">
        {laps.map((lap, index) => (
          <LapRow key={index} durationMs={lap.durationMs} index={index} lapDistanceMiles={lapDistanceMiles} maxDurationMs={maxDurationMs}/>
        ))}
      </div>
      <div className="totals">
        <TimeDisplay valueMs={totalDurationMs} />
        <DistanceDisplay value={totalDistanceMiles} units="mi"/>
      </div>
      <div className="controls">
        <button className='pay-pause-btn'>{'|>'}</button>
        <button className='lap-btn'>Lap</button>
      </div>
    </div>
  );
};

export default MasterMind;
