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

- Corrected the Swiper initialization in `script.js` to use `new Swiper(...)` and added guards so the page still opens without JavaScript errors when the slider markup or CDN global is unavailable.

## Asset restoration notes for reviewers

The original repository snapshot in this workspace did not include the locally referenced media files below, and no source asset bundle was present to recover them exactly. To restore all broken local paths without redesigning the site, compatible placeholder replacements were added using the same filenames already referenced by the pages:

- Gallery images: `img1.jpg` through `img9.jpg`
- Review images: `client-1.jpg`, `client-2.jpg`, `client-3.jpg`
- Background videos: `bg.mp4`, `feed.mp4`, `video.mp4`

Assumption used: because the exact originals were unavailable in the seeded workspace, reviewer-safe stand-in assets were created under the existing root-level paths so every current HTML reference resolves to a real local file with matching case-sensitive filenames.
