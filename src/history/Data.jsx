import { Event, Period, EventDate } from './model/model';

export function createHistoryItem(data) {
  try {
    if (data.type === 'event') {
      if (data.date) {
        const date = new EventDate();
        date.year = data.date.year;
        date.epoch = data.date.epoch;
        const title = data.title || data.period || 'Untitled';
        return new Event(title, data.desc || '', date);
      }
    }

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

export function filterValidItems(items) {
  return items.filter((item) => item !== null);
}
