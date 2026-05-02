export const SCALE = 16; // pixels per em
const ITEM_HEIGHT = 2; // em
export const SCALED_ITEM_HEIGHT = ITEM_HEIGHT * SCALE;
export const ROW_HEIGHT = ITEM_HEIGHT * 2; // em
export const EVENT_FIXED_WIDTH = 15; // em
const MIN_DISPLAY_WIDTH = 2; // em
export const EM_PX = 16;
const MIN_SPACING_EM = 10;
const MAX_SPACING_EM = 200;
const LINE_SPANS = [1, 5, 10, 50, 100, 500, 1000];

export function scaleViewToTimeline(viewWidthEm, yearsPerEm) {
  return viewWidthEm * yearsPerEm;
}

export function scaleTimelineToView(years, yearsPerEm) {
  return years / yearsPerEm;
}

export function chooseYearLineSpan(yearsPerEm) {
  const minYears = MIN_SPACING_EM * yearsPerEm;
  const maxYears = MAX_SPACING_EM * yearsPerEm;

  for (const span of LINE_SPANS) {
    if (span >= minYears && span <= maxYears) {
      return span;
    }
  }

  if (yearsPerEm > LINE_SPANS[LINE_SPANS.length - 1]) {
    return 1;
  }
  return 1000;
}

export function schedule(inputItems, yearsPerEm) {
  const SPACING = scaleViewToTimeline(2, yearsPerEm);
  const preprocessed = [];

  for (const item of inputItems) {
    const timelineWidth = item.width();
    let displayWidth = timelineWidth;

    if (item.type === 'event') {
      displayWidth = EVENT_FIXED_WIDTH;
    }

    if (displayWidth < MIN_DISPLAY_WIDTH) {
      continue;
    }

    preprocessed.push({
      item,
      timeWidth: timelineWidth,
      viewWidth: scaleTimelineToView(displayWidth, yearsPerEm),
    });
  }

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

export function plan(inputItems, yearsPerEm) {
  const outputItems = [];
  const yearLines = [];

  if (inputItems.length === 0) {
    return { items: outputItems, yearLines, minDatePos: 0, maxRow: -1 };
  }

  let minDatePos = Infinity;
  let maxDatePos = -Infinity;
  let maxRow = -1;

  for (const item of inputItems) {
    minDatePos = Math.min(minDatePos, item.item.start().absolutePos());
    maxDatePos = Math.max(maxDatePos, item.item.finish().absolutePos());
    maxRow = Math.max(maxRow, item.row);
  }

  const yearLineSpan = chooseYearLineSpan(yearsPerEm);
  const minYearLineDatePos = Math.floor(minDatePos / yearLineSpan);
  const maxYearLineDatePos = Math.ceil(maxDatePos / yearLineSpan) + 1;

  for (let yearLinePos = minYearLineDatePos; yearLinePos <= maxYearLineDatePos; yearLinePos++) {
    yearLines.push({ year: yearLinePos * yearLineSpan });
  }

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

  return { items: outputItems, yearLines, minDatePos, maxRow };
}
