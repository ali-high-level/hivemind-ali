# Hivemind

A daily crowd-reading game for Reddit, built on Devvit Web for the Reddit Game of the Day Hackathon.

## How to play

Every day a new spectrum appears, for example "Pineapple on pizza: Crime against food <-> Culinary genius".

1. Your take: place the slider where you stand.
2. Read the crowd: guess where the average of every other player will land.
3. Reveal: see the live distribution of the whole community and your crowd-reading score.

The closer your guess is to the real crowd average, the higher your score: score = max(0, 100 - 2 x |guess - average|). Playing on consecutive days builds a streak.

## Made by the community

Every daily post includes a comment from the app explaining the format. Anyone can reply with one line:

    Title | Left end | Right end

When the next daily post is created, the app reads the previous post's comments, takes the top-voted valid reply, and uses it as the next spectrum with the author's username credited. If nobody suggests one, a built-in spectrum is used, so the game never runs out of content.

Each result screen also shows "Yesterday's hive": the previous spectrum and where the community landed.

## Tech

- Devvit Web (React 19, Tailwind, Vite client)
- Hono server routes, Redis for guesses, buckets, streaks and post numbering
- A Devvit scheduler task creates a new daily post at 00:00 UTC
- Player input is validated on the server (0-100 integers, one guess per user per post, link and length checks on suggested spectra)

## Development

    npm install
    npm run dev      # playtest in the dev subreddit
    npm run deploy   # type-check, lint, upload
