
Explain #4 in more detail.

--

Propose an algorithm or calculation that would implement the specification for #6.

--

#8: start() and finish() are meant to be abstractions that hide the differences between Events and Periods. Explain why you think there is a mismatch. 


--

Based on the feedback you gave above, implement your fixes to the spec and data model, with these clarifications:
1. Ignore the months and days for now, just use years consistently.
2. Use absolutePos consistently and remove the dateToNumber function.
3. Use the name `absolutePos` consistently.
4. In the algorithm, use a 15 em fixed width for Event items.
5. Compute the top based on row.
6. Add your proposed algorithm to the spec.
7. Use a fixed minimum display width.
8. Use start() consistently instead of begin.


--

Create a new subpage within App.jsx
- with route "/da-mantou-games/history-timeline"
- with element name `HistoryTimeline`

Follow the specification in `src/history/Spec.md`.
