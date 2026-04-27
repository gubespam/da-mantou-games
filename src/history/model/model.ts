type Epoch = 'AD' | 'BC';
type HistoryItemType = 'event' | 'period';

export interface EventDate {
  year: number;
  month?: number;
  day?: number;
  epoch: Epoch;
}

export abstract class HistoryItem {
  abstract readonly type: HistoryItemType;
  title: string;
  desc: string;

  constructor(title: string, desc: string) {
    this.title = title;
    this.desc = desc;
  }

  abstract start(): EventDate;
  abstract finish(): EventDate;

  width(): number {
    return dateToNumber(this.finish()) - dateToNumber(this.start());
  }
}

export class Event extends HistoryItem {
  readonly type: 'event' = 'event';
  date: EventDate;

  constructor(title: string, desc: string, date: EventDate) {
    super(title, desc);
    this.date = date;
  }

  start(): EventDate {
    return this.date;
  }

  finish(): EventDate {
    return this.date;
  }
}

export class Period extends HistoryItem {
  readonly type: 'period' = 'period';
  begin: EventDate;
  end: EventDate;

  constructor(title: string, desc: string, begin: EventDate, end: EventDate) {
    super(title, desc);
    this.begin = begin;
    this.end = end;
  }

  start(): EventDate {
    return this.begin;
  }

  finish(): EventDate {
    return this.end;
  }
}

export interface ScheduledItem {
  item: HistoryItem;
  row: number;
  viewWidth: number;
  timeWidth: number;
}

export interface Position {
  left: number;
  top: number;
  height: number;
  width: number;
}

export interface PlannedItem {
  item: ScheduledItem;
  position: Position;
}

// Helper function to convert EventDate to a numeric value for calculations
function dateToNumber(date: EventDate): number {
  const y = date.epoch === 'AD' ? date.year : -date.year;
  const m = date.month || 0;
  const d = date.day || 0;
  // Approximate conversion: year * 365 + month * 30 + day
  return y * 365 + m * 30 + d;
}