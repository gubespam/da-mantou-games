# Data Model
## Raw Data
Polymorphic `HistoryItem` class has two subclasses: `Event` and `Period`.

Supporting class `HDate` that represents dates of items.
### EventDate
`EventDate`
```json
{
  "year": "{YYYY}", # integer
  "month": "{MM}", # integer, optional
  "day": "{DD}", # integer, optional
  "epoch": "{AD | BC}", # enum
  "absolutePos()": epoch == 'AD' ? this.year : -this.year + 1
}
```
### HistoryItem
`HistoryItem`
```json
{
  "type": "{event | period}",
  "title": "{brief name of event}",
  "desc": "{longer description of event}"
}
```
This class includes accessor member functions:
* `start()` that returns `this.type == "event" ? this.date : this.begin`
* `finish()` that returns `this.type == "event" ? this.date : this.end`
* `width()` that returns `this.finish() - this.start()`
### Event
`Event`: Subclass of HistoryItem
```json
{
  "type": "event",
  "date": "...", # EventDate
}
```
### Period
`Period`: Subclass of HistoryItem
```json
{
  "type": "period",
  "begin": "...", # EventDate
  "end": "...", # EventDate
}
```
## Scheduled
`ScheduledItem`: Output of scheduler and input to planner
```json
{
  "item": "...", # HistoryItem
  "row": 0, # integer
  "viewWidth": 0, # float
  "timeWidth": 0 # integer
}
```
## Planned
### Position
`Position`
```json
{
	"left": float,
	"top": float,
	"height": float,
	"width": float
}
```
### PlannedItem
`PlannedItem`: Output of planner and input to renderer.
```json
{
  "item": "...", # ScheduledItem
  "position": "..." # Position
}
```


