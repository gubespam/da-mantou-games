# Goal
* Create a website that lets you browse and visualize history as an interactive timeline
# View
![[View-Example.png]]

The view is a series of (invisible) rows, each containing one or more history items.
* Event items are blue diamonds that occur at a position that corresponds to the event's date.
	* The title text for events appears to the right of the blue diamond
	* The position of the center of the diamond is at the date of the event
	* Event items have a fixed display width of 15 em
* Period items are rectangles whose width corresponds to the relative span of time for that period (start to end). The left position corresponds to the period's start date.
	* The title text for periods appears inside the rectangle, left-justified
	* The background color for these rectangles is #fcbe58 and the text is black. The rectangle's border is #ba842d
	* The rectangle's left edge is at the period's start date and the right edge is at the period's end date.
	* If the text for a period is too long to display within the rectangle, it is abbreviated with an ellipsis (...).

In the background, behind the history items, the view has periodic vertical lines that mark specific years, with the year for each line centered above it.
* The lines are evenly spaced apart horizontally.
* The lines are the same color as the year text above them: 50% grey

See a prototype of the view in `TimelinePrototype.jsx`

The view is scrollable horizontally and vertically.
## Compression
At the top of the screen is a floating slider that allows the user to control the amount of compression. The slider has a label to the left "Zoom". Compression changes the factor that maps event years to pixel positions on the screen. The higher the compression, the closer together years are in the view. The lower the compression, the more spread out they are.
### Range of compression
* Min compression
	* 1 em per 1 year
* Max compression
	* 1 em per 100 years
### Year Marker Line Spacing
* The number of year lines shown and the spacing between the lines depend on the current compression level.
* The spacing should be one of the following, such that the spacing (yearLineSpacing) is no less than 10 em and no more than 200 em: 1, 5, 10, 50, 100, 500, 1000 years (yearLineSpan). If multiple spacing options are valid, choose the smallest that fits this criteria. Assume 16 pixels per 1 em.
	* yearLineSpacing = space between lines, in pixels
	* yearLineSpan = number of years per line

### Year Line Span Selection Algorithm
```
chooseYearLineSpan(yearsPerEm)
	EM_PX = 16
	MIN_SPACING_EM = 10
	MAX_SPACING_EM = 200
	LINE_SPANS = [1, 5, 10, 50, 100, 500, 1000]
	
	minYears = MIN_SPACING_EM * yearsPerEm
	maxYears = MAX_SPACING_EM * yearsPerEm
	
	for each span in LINE_SPANS
		if span >= minYears and span <= maxYears
			return span
	
	// fallback: if all spans are too large, use smallest; if all too small, use largest
	if yearsPerEm > LINE_SPANS[last] then
		return 1
	else
		return 1000
```

# Data and rendering pipeline
```
raw data
 ->
function: scheduler
 ->
scheduled data
 ->
function: planner
 ->
planned data
 ->
function: renderer
 ->
DOM elements
```
## Scheduler
* Orders events into rows and sets their relative positions
* Hides elements too small to view at current compression level (too small means width less than 2 em)
### Algorithm
```
scaleViewToTimeline(viewWidthEm, yearsPerEm: float)
	years = viewWidthEm * yearsPerEm
	return years

scaleTimelineToView(years, yearsPerEm: float)
	viewWidthEm = years / yearsPerEm
	return viewWidthEm

schedule(inputItems, yearsPerEm)
	inputItems: array of HistoryItems
	outputItems: array of ScheduledItems
	
	MIN_DISPLAY_WIDTH = 2  // em
	EVENT_FIXED_WIDTH = 15  // em
	SPACING = scaleViewToTimeline(2, yearsPerEm)  // 2 em in timeline units
	HIDE_THRESHOLD = scaleViewToTimeline(MIN_DISPLAY_WIDTH, yearsPerEm)
	
	preprocessed: array of ScheduledItems
	for each item in inputItems
		timelineWidth = item.width()
		displayWidth = timelineWidth
		
		if item.type == "event"
			displayWidth = EVENT_FIXED_WIDTH
		
		if displayWidth < MIN_DISPLAY_WIDTH
			continue  // hide item that's too small
		
		outItem = {
			item: item, 
			timeWidth: timelineWidth, 
			viewWidth: scaleTimelineToView(displayWidth, yearsPerEm)
		}
		preprocessed.add(outItem)
	
	// Row-based bin packing: assign each item to first non-overlapping row
	rows: array of {rightEdge: number, row: number}  // track the rightmost edge of each row
	
	for each item in preprocessed
		itemStartPos = scaleTimelineToView(item.item.start().absolutePos(), yearsPerEm)
		assignedRow = -1
		
		for each row in rows
			if itemStartPos >= (row.rightEdge + SPACING)
				assignedRow = row.row
				break
		
		if assignedRow == -1
			// no available row, create new one
			assignedRow = rows.length
			rows.add({rightEdge: 0, row: assignedRow})
		
		outItem = {item: item, row: assignedRow}
		itemRightEdge = itemStartPos + item.viewWidth
		rows[assignedRow].rightEdge = itemRightEdge
		outputItems.add(outItem)
	
	return outputItems
```
## Planner
* Handles compression and converts relative positions to absolute positions
### Algorithm
```
SCALE = 16 // pixels per em
ITEM_HEIGHT = 2
SCALED_ITEM_HEIGHT = ITEM_HEIGHT * SCALE
ROW_HEIGHT = ITEM_HEIGHT * 2

plan(inputItems, yearsPerEm)
	inputItems: array of ScheduledItem
	outputItems: array of PlannedItem
	yearLines: array of YearLine
	
	// find boundaries among all items
	minDatePos = inputItems.minimum(item -> item.item.start().absolutePos())
	maxDatePos = inputItems.maximum(item -> item.item.finish().absolutePos())
	
	// determine year line span
	yearLineSpan = chooseYearLineSpan(yearsPerEm)
	
	// generate and scale year lines
	minYearLineDatePos = floor(minDatePos / yearLineSpan)
	maxYearLineDatePos = ceil(maxDatePos / yearLineSpan) + 1
	for(yearLinePos = minYearLineDatePos; yearLinePos <= maxYearLineDatePos; yearLinePos++){
		yearLines.add({year: yearLinePos * yearLineSpan})
	}
	
	// scale items
	for item in inputItems
		absoluteDatePos = item.item.start().absolutePos() - minDatePos
		viewPos = scaleTimelineToView(absoluteDatePos, yearsPerEm)
		
		outItem = {
			item: item,
			position: {
				left: SCALE * viewPos,
				top: SCALE * (item.row * ROW_HEIGHT),
				width: SCALE * item.viewWidth,
				height: SCALED_ITEM_HEIGHT
			}
		}
		outputItems.add(outItem)
	
	return outputItems, yearLines
```
## Renderer
Creates DOM items based on the output of the planner.
* See View-Example.png and TimelinePrototype.jsx
* Items all use absolute positioning and appear in front of timeline year lines
```
render(inputItems, yearLines) {
	inputItems: array of PlannedItem
	
	// render background (year labels)
	for yearLine in yearLines
		render td(text=yearLine.year, colspan=2)
		
	// render background (year lines)
	render left offset (colspan=1)
	for yearLine in yearLines
		render td(colspan=2)
	render right offset (colspan=1)
	
	// render items
	for item in inputItems
		if item.item.item.type == 'event'
			render EventView(position)
		else
			render PeriodView(position)
}
```
