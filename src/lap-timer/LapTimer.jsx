import React, { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import './LapTimer.css';

// View Modes
const AppModes = Object.freeze({
  SETTINGS: "settings",
  APP: "app",
});

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
  const formattedValue = Math.trunc(value * 100) / 100
  return <div className='distance-display'>
    <span className='value'>{formattedValue}</span>
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
    <ProgressBar value={durationMs} max={maxDurationMs}/>
    <TimeDisplay valueMs={pace} />
  </div>
}

function LapsPanel({laps, lapDistanceMiles}){
  const maxDurationMs = getMax(laps, lap => lap.maxDurationMs)
  return <div className="laps">
    {laps.map((lap, index) => (
      <LapRow key={index} index={index} 
        durationMs={lap.durationMs} maxDurationMs={maxDurationMs}
        lapDistanceMiles={lapDistanceMiles} />
    ))}
  </div>
}

const sampleLaps = [
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60,
  2 * 60,
  2.1 * 60,
  3.2 * 60
].map(value => ({durationMs: value * 1000}))

function LapTimer() {
  const [laps, setLaps] = useState(sampleLaps || [])
  const [appMode, setAppMode] = useState(AppModes.APP)
  const [lapDistanceMiles, setLapDistanceMiles] = useState(0.20)
  console.log(laps)

  // Object.entries({}).forEach(([key, value]) => {
  //   window[key] = value
  // })

  const totalDurationMs = getTotal(laps, lap => lap.durationMs)
  // console.log(`totalDurationMs = ${totalDurationMs}`)
  const totalDistanceMiles = laps.length > 0 ? 
    (laps.length - 1) * lapDistanceMiles : 0

  return (
    <div className="lap-timer-app">
      <BackButton />
      <div className="title">Lap Timer</div>
      <LapsPanel laps={laps} lapDistanceMiles={lapDistanceMiles} />
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

export default LapTimer;
