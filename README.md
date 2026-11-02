# Dubai Open Breaking 2026

Desktop landing page for Dubai Open Breaking 2026, built with HTML, CSS and JavaScript.

## Local preview

Run `python3 -m http.server 5173` from the project directory and open http://localhost:5173.

The page uses Google Fonts (Poppins), a muted looping background video and an animated title. No build step is required.

## Competition pages

`/world-breaking-championships/` contains the responsive first screen, scroll-triggered header, navigation drawer and an empty registration-price drawer. The Schedule section includes all three days on desktop/tablet and animated day tabs on mobile. Judges and its navigation links are temporarily hidden; its scroll handlers are disabled while hidden. The preserved desktop Judges scene pins below the header while native page scrolling moves a finite nine-card track from the first centered judge to the ninth. The centered card expands automatically with synchronized spacing; each wheel or trackpad gesture advances one card. Arrow keys, Page Up/Down and Space also step through the gallery. It is hidden at tablet/mobile breakpoints until their designs are supplied. Other navigation targets await the remaining page content. The junior competition page is reserved for future work.
