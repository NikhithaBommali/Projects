# Event Management

Static event-management website built with HTML, CSS, and JavaScript.

## Prerequisites

- A modern web browser.
- Optional: a local static server if you prefer not to open `index.html` directly.

## Setup

1. Clone the repository and switch to the `event-management` branch.
2. Open `index.html` in a browser, or serve the folder with a static server.

Example local server command:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Runtime notes

- The page loads external assets from Font Awesome and Swiper CDN URLs.
- The home slider initialization expects the global `Swiper` constructor provided by the Swiper CDN script.

## Build verification

There is no project build tool or package manifest in this repository. Verification is done by loading the site locally and confirming the browser opens the entry page without JavaScript errors.

## Minimal fix applied

- Corrected the Swiper initialization in `script.js` to use `new Swiper(...)` so the page starts without a runtime reference error.
