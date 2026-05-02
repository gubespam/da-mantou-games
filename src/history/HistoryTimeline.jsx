import { useState, useEffect } from 'react';
import { Event, Period, EventDate } from './model/model';
import eventsData from '../history/resources/events.json';
import './HistoryTimeline.css';

const SCALE = 16; // pixels per em
const ITEM_HEIGHT = 2; // em
const SCALED_ITEM_HEIGHT = ITEM_HEIGHT * SCALE;
const ROW_HEIGHT = ITEM_HEIGHT * 2; // em
const EVENT_FIXED_WIDTH = 15; // em
const MIN_DISPLAY_WIDTH = 2; // em
const EM_PX = 16;
const MIN_SPACING_EM = 10;
const MAX_SPACING_EM = 200;
const LINE_SPANS = [1, 5, 10, 50, 100, 500, 1000];

function createHistoryItem(data) {
  try {
    if (data.type === 'event') {
      // Handle events with date property
      if (data.date) {
        const date = new EventDate();
        date.year = data.date.year;
        date.epoch = data.date.epoch;
        const title = data.title || data.period || 'Untitled';
        return new Event(title, data.desc || '', date);
      }
    }
    
    // Handle periods and events with begin/end
    if (data.type === 'period' || (data.begin && data.end)) {
      const begin = new EventDate();
      begin.year = data.begin.year;
      begin.epoch = data.begin.epoch;
      const end = new EventDate();
      end.year = data.end.year;
      end.epoch = data.end.epoch;
      const title = data.title || data.period || 'Untitled';
      return new Period(title, data.desc || '', begin, end);
    }
  } catch (error) {
    console.error('Error creating history item:', error, data);
  }
  return null;
}

function filterValidItems(items) {
  return items.filter(item => item !== null);
}

function scaleViewToTimeline(viewWidthEm, yearsPerEm) {
  return viewWidthEm * yearsPerEm;
}

function scaleTimelineToView(years, yearsPerEm) {
  return years / yearsPerEm;
}

function chooseYearLineSpan(yearsPerEm) {
  const minYears = MIN_SPACING_EM * yearsPerEm;
  const maxYears = MAX_SPACING_EM * yearsPerEm;

  for (const span of LINE_SPANS) {
    if (span >= minYears && span <= maxYears) {
      return span;
    }
  }

  if (yearsPerEm > LINE_SPANS[LINE_SPANS.length - 1]) {
    return 1;
  } else {
    return 1000;
  }
}

function schedule(inputItems, yearsPerEm) {
  const SPACING = scaleViewToTimeline(2, yearsPerEm); // 2 em in timeline units
  const preprocessed = [];

  for (const item of inputItems) {
    const timelineWidth = item.width();
    let displayWidth = timelineWidth;

    if (item.type === 'event') {
      displayWidth = EVENT_FIXED_WIDTH;
    }

    if (displayWidth < MIN_DISPLAY_WIDTH) {
      continue; // hide item that's too small
    }

    preprocessed.push({
      item,
      timeWidth: timelineWidth,
      viewWidth: scaleTimelineToView(displayWidth, yearsPerEm),
    });
  }

  // Row-based bin packing
  const rows = [];
  const outputItems = [];

  for (const scheduledItem of preprocessed) {
    const itemStartPos = scaleTimelineToView(scheduledItem.item.start().absolutePos(), yearsPerEm);
    let assignedRow = -1;

    for (const row of rows) {
      if (itemStartPos >= row.rightEdge + SPACING) {
        assignedRow = row.row;
        break;
      }
    }

    if (assignedRow === -1) {
      assignedRow = rows.length;
      rows.push({ rightEdge: 0, row: assignedRow });
    }

    const itemRightEdge = itemStartPos + scheduledItem.viewWidth;
    rows[assignedRow].rightEdge = itemRightEdge;
    outputItems.push({ ...scheduledItem, row: assignedRow });
  }

  return outputItems;
}

function plan(inputItems, yearsPerEm) {
  const outputItems = [];
  const yearLines = [];

  if (inputItems.length === 0) {
    return { items: outputItems, yearLines };
  }

  // Find boundaries
  let minDatePos = Infinity;
  let maxDatePos = -Infinity;

  for (const item of inputItems) {
    minDatePos = Math.min(minDatePos, item.item.start().absolutePos());
    maxDatePos = Math.max(maxDatePos, item.item.finish().absolutePos());
  }

  // Determine year line span
  const yearLineSpan = chooseYearLineSpan(yearsPerEm);

  // Generate year lines
  const minYearLineDatePos = Math.floor(minDatePos / yearLineSpan);
  const maxYearLineDatePos = Math.ceil(maxDatePos / yearLineSpan) + 1;

  for (let yearLinePos = minYearLineDatePos; yearLinePos <= maxYearLineDatePos; yearLinePos++) {
    yearLines.push({ year: yearLinePos * yearLineSpan });
  }

  // Scale items
  for (const scheduledItem of inputItems) {
    const absoluteDatePos = scheduledItem.item.start().absolutePos() - minDatePos;
    const viewPos = scaleTimelineToView(absoluteDatePos, yearsPerEm);

    const plannedItem = {
      item: scheduledItem,
      position: {
        left: SCALE * viewPos,
        top: SCALE * (scheduledItem.row * ROW_HEIGHT),
        width: SCALE * scheduledItem.viewWidth,
        height: SCALED_ITEM_HEIGHT,
      },
    };
    outputItems.push(plannedItem);
  }

  return { items: outputItems, yearLines, minDatePos };
}

function EventView({ position, title }) {
  return (
    <div
      className="event"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${position.width}px`,
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
        top: `${position.top}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
      title={title}
    >
      {title}
    </div>
  );
}

function YearMarkers({ yearLines, minDatePos, yearsPerEm }) {
  if (!yearLines || yearLines.length === 0) return null;

  return (
    <div className="year-markers">
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
            <div className="year-label">{yearLine.year}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryTimeline() {
  const [compression, setCompression] = useState(50); // 1-100, where 50 = 1 em per year
  const [cycle, setCycle] = useState('cycle1');
  const [plannedData, setPlannedData] = useState({ items: [], yearLines: [], minDatePos: 0 });

  // Convert compression value (1-100) to yearsPerEm
  // compression=100 -> 1 em per 100 years (max compression)
  // compression=1 -> 1 em per 1 year (min compression)
  const yearsPerEm = compression;

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
