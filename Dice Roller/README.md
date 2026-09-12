# Dice Royale

Dice Royale is a premium futuristic dice battle arena built with lightweight browser technologies. Roll against the arena AI or challenge a local contender for the highest score.

## Features

- Player vs Computer and 1 vs 1 Local modes
- Real turn-based local play with locked dice and visible turn indicators
- Delayed computer response with an AI rolling state
- Male and female character selection with an assigned AI robot
- CSS-built dice with animated rolls and realistic lighting
- Futuristic casino and esports arena atmosphere
- Persistent scoreboard and scrollable roll history
- LocalStorage save and reset support
- Space to roll and R to reset keyboard shortcuts
- Responsive desktop and mobile layout
- Reduced-motion accessibility support

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript

## How to Run

Clone the repository, open the project folder, and open `index.html` in a modern browser. No build step or external dependency is required.

## Game Modes

**Player vs Computer** assigns the second contender to the arena robot.

**1 vs 1 Local** enables a second name and independent character selection for two people sharing one device.

## Character System

Human avatars are built from CSS shapes and update dynamically from the character controls. The computer uses a distinct CSS robot avatar.

## Keyboard Controls

- `Space` -> Roll
- `R` -> Reset

## Project Structure

```text
dice-royale/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── screenshot.png
```

## Future Improvements

- Online multiplayer
- More characters and customization
- Sound effects
- Global leaderboards
- Achievements
- Tournament mode

## License

MIT License.

## Author

Built as a portfolio-ready vanilla web game. Replace this line with your name and profile link when publishing.
