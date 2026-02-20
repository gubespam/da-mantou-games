**Decision: Render approach (DOM+SVG vs Canvas)**

- **DOM + SVG — Pros:**
  - Easier to use existing React/JSX components and CSS for layout and transforms.
  - Vector graphics scale cleanly to different resolutions; text remains selectable/accessible.
  - Simpler to animate individual elements (car rotation, barrier position) with CSS transitions or SVG transforms.
  - Easier to integrate images, accessibility attributes, and layering with DOM elements.

- **DOM + SVG — Cons:**
  - May be less performant for many rapidly changing objects, though this game has few elements (one car, one barrier pair).
  - Hit-testing and pixel-level effects require more work than canvas shaders.

- **Canvas — Pros:**
  - High-performance for large numbers of objects or pixel effects.
  - Single drawing surface gives precise control of every frame and visual effect.

- **Canvas — Cons:**
  - Harder to mix DOM text and controls; accessibility and responsiveness for text must be handled manually.
  - Animations/hit regions need manual bookkeeping; layering requires extra logic.
  - More boilerplate for incremental updates; tighter coupling between render loop and game state.

Recommendation: use DOM + SVG (or DOM elements + CSS transforms) for simplicity, accessibility, and ease of future changes. Performance should be fine because the scene is small (one car + a pair of barriers).

Confirmed: Use DOM + SVG + CSS transforms, with requestAnimationFrame where needed.