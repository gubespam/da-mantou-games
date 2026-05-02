type Epoch = 'AD' | 'BC';
type HistoryItemType = 'event' | 'period';

export class EventDate {
  year!: number;
  epoch!: Epoch;

  absolutePos(): number {
    return this.epoch === 'AD' ? this.year : -this.year + 1; // +1 because there is no year 0
  }
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
    return this.finish().absolutePos() - this.start().absolutePos();
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