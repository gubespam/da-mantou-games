import { useState, useEffect } from 'react';
import eventsData from '../history/resources/events.json';
import './HistoryTimeline.css';
import { createHistoryItem } from './Data.jsx';
import { schedule, plan, scaleTimelineToView, SCALE, ROW_HEIGHT, EM_PX } from './Planner.jsx';

const ITEM_TOP_OFFSET = 3 * EM_PX;

function EventView({ position, title }) {
  return (
    <div
      className="event"
      style={{
        left: `${position.left}px`,
        top: `${position.top + ITEM_TOP_OFFSET}px`,
        // width: `${position.width}px`,
        height: `${position.height}px`,
      }}
      title={title}
    >
      {title}
    </div>
  );
}

function PeriodView({ position, title }) {
  return (
    <div
      className="period"
      style={{
        left: `${position.left}px`,
        top: `${position.top + ITEM_TOP_OFFSET}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
      title={title}
    >
      {title}
    </div>
  );
}

function YearMarkers({ yearLines, minDatePos, yearsPerEm, height }) {
  if (!yearLines || yearLines.length === 0) return null;

  return (
    <div className="year-markers" style={{ height: `${height}px` }}>
      {yearLines.map((yearLine) => {
        const viewPos = scaleTimelineToView(yearLine.year - minDatePos, yearsPerEm);
        const pixelPos = SCALE * viewPos;
        return (
          <div
            key={yearLine.year}
            className="year-line"
            style={{
              left: `${pixelPos}px`,
            }}
          >
            <div className="year-label">{Math.abs(yearLine.year)} {yearLine.year < 0 ? 'BC' : 'AD'}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryTimeline() {
  const [compression, setCompression] = useState(50); // 1-100, where 50 = 1 em per year
  const [cycle, setCycle] = useState('cycle1');
  const [plannedData, setPlannedData] = useState({ items: [], yearLines: [], minDatePos: 0, maxRow: -1 });

  // Convert compression value (1-100) to yearsPerEm
  // compression=100 -> 1 em per 100 years (max compression)
  // compression=1 -> 1 em per 1 year (min compression)
  const yearsPerEm = compression;

  const yearMarkersHeight = SCALE * ((Math.max(plannedData.maxRow, 0) + 1) * ROW_HEIGHT) + ITEM_TOP_OFFSET;

  // Load and process data
  useEffect(() => {
    const rawItems = eventsData[cycle]
      .map(createHistoryItem)
      .filter(Boolean);
    const scheduledItems = schedule(rawItems, yearsPerEm);
    const planResult = plan(scheduledItems, yearsPerEm);
    setPlannedData(planResult);
  }, [cycle, yearsPerEm]);

  return (
    <div className="history-timeline-container">
      <div className="timeline-controls">
        <label htmlFor="cycle-select">Cycle: </label>
        <select
          id="cycle-select"
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
        >
          <option value="cycle1">Cycle 1</option>
          <option value="cycle2">Cycle 2</option>
          <option value="cycle3">Cycle 3</option>
        </select>

        <label htmlFor="zoom-slider">Zoom: </label>
        <input
          id="zoom-slider"
          type="range"
          min="1"
          max="100"
          value={compression}
          onChange={(e) => setCompression(parseInt(e.target.value))}
          className="zoom-slider"
        />
        <span className="zoom-value">{compression} years/em</span>
      </div>

      <div className="timeline-viewport">
        <YearMarkers
          yearLines={plannedData.yearLines}
          minDatePos={plannedData.minDatePos}
          yearsPerEm={yearsPerEm}
          height={yearMarkersHeight}
        />

        <div className="timeline-items">
          {plannedData.items.map((plannedItem, idx) => {
            const { item, position } = plannedItem;
            const { item: historyItem } = item;

            if (historyItem.type === 'event') {
              return (
                <EventView
                  key={idx}
                  position={position}
                  title={historyItem.title}
                />
              );
            } else {
              return (
                <PeriodView
                  key={idx}
                  position={position}
                  title={historyItem.title}
                />
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
