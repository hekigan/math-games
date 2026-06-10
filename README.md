# MathiFun

MathiFun is a static browser game that helps primary school children practice arithmetic through short, playful math sessions. It runs as a simple HTML/CSS/JavaScript site using Vue from a CDN, with no backend server or build step.

## Purpose

The app is designed to make arithmetic practice approachable for children while keeping each player's progress separate. It supports multiple local player profiles, stores results in the browser, and offers several game modes for quick challenges or calmer practice.

<img width="1233" height="1563" alt="image" src="https://github.com/user-attachments/assets/dbdfa367-8ec2-4521-928b-fe0050e4d3a5" />


## Features

- Bilingual interface in English and French.
- Automatic first language selection from the browser locale:
  - French browser locales use French.
  - English and all other locales use English.
- Manual language selector on the profile page and game selection page.
- Local player creation, selection, and deletion.
- Separate score history and settings for each player.
- Arithmetic practice for addition, subtraction, multiplication, and division.
- Game modes:
  - Race against the clock
  - 10-question challenge
  - Perfect streak
  - Times tables boss
  - Calm practice
- Adjustable number ranges, time limits, and question counts depending on the selected mode.
- Mistake tracking so missed operations can be reviewed later.
- Responsive layout for desktop and mobile screens.

## Project Structure

- `index.html`: Main static page and Vue template.
- `style.css`: Responsive visual styling.
- `app.js`: Vue app logic, translations, game rules, IndexedDB storage, players, scores, and settings.
- `INSTRUCTIONS.md`: Additional project reference notes.

## Local Usage

Open `index.html` directly in a modern browser, or run a simple static server from the project folder:

```powershell
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

Vue is loaded from:

```text
https://unpkg.com/vue@3/dist/vue.global.prod.js
```

An internet connection is required unless the browser already has Vue cached.

## Data Storage

MathiFun stores data locally in IndexedDB using the `mathifun-db` database. It does not require user accounts, cookies, or a backend service.

Stored data includes:

- Player profiles
- Selected player state
- Per-player game settings
- Score history
- Mistakes to review
- Selected language

## GitHub Pages

The site uses relative asset paths for `style.css` and `app.js`, so it can be hosted from a GitHub Pages project path such as:

```text
https://hekigan.github.io/math-games/
```

No build command is required. The repository can be published directly as a static site.
