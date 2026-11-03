# Dubai Open Breaking 2026

Desktop landing page for Dubai Open Breaking 2026, built with HTML, CSS and JavaScript.

## Local preview

Run `python3 -m http.server 5173` from the project directory and open http://localhost:5173.

The page uses Google Fonts (Poppins), a muted looping background video and an animated title. No build step is required.

## Competition pages

`/world-breaking-championships/` contains the responsive first screen, scroll-triggered header, navigation drawer and a registration-price drawer with all three pricing phases. The Schedule section includes all three days on desktop/tablet and animated day tabs on mobile. Judges and its navigation links are temporarily hidden; its scroll handlers are disabled while hidden. The preserved desktop Judges scene pins below the header while native page scrolling moves a finite nine-card track from the first centered judge to the ninth. The centered card expands automatically with synchronized spacing; each wheel or trackpad gesture advances one card. Arrow keys, Page Up/Down and Space also step through the gallery. It is hidden at tablet/mobile breakpoints until their designs are supplied. Competition format fills the visible viewport below the fixed header on desktop, tablet and mobile. Learn more opens a right-hand rules drawer (full-screen on mobile), with a fixed Close row and independently scrolling rules and tables. Prize money follows Competition format, with solo and crew payout tables and the same per-letter text reveals and line drawing as Schedule. Travel guide currently implements desktop Venue only: a static SVG map, a permanent central venue marker, hover/focus details with an external map link, and inactive Hotels/Transport/Food tabs. Its heading uses the shared per-letter mask reveal. Venue details appear only in the hover/focus tooltip; its map link shares the Menu button fill animation. The map has 24px viewport gutters and tabs sit 24px above its bottom edge. Travel guide is hidden at tablet/mobile breakpoints pending their designs. Other navigation targets await the remaining page content. The junior competition page is reserved for future work.
