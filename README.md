# Missile Sky 2.0

🚀 **Modern Space Defense Game** - Built with HTML5, CSS3, and Vanilla JavaScript

## 🎮 Game Overview

Missile Sky 2.0 is an action-packed space defense game where you control a powerful turret at the bottom of the screen, defending Earth from waves of alien invaders. Launch missiles, collect power-ups, and survive as long as possible to achieve the highest score!

### Features
- ✅ Smooth HTML5 Canvas rendering
- ✅ Wave-based enemy system with increasing difficulty
- ✅ Multiple enemy types (Scouts, Fighters, Bosses)
- ✅ Power-ups (Rapid Fire, Shield, Nuke)
- ✅ Sound effects and visual feedback
- ✅ Responsive design for all screen sizes
- ✅ Score tracking and high score system
- ✅ Health system with visual indicators
- ✅ Pause/Resume functionality

## 📁 Project Structure

```
missile-sky-2.0/
├── index.html          # Main game page
├── style.css           # Game styling
├── game.js             # Core game logic
├── assets/
│   ├── sounds/
│   │   ├── explosion.mp3
│   │   ├── laser.mp3
│   │   ├── powerup.mp3
│   │   └── background.mp3
│   └── images/
│       ├── turret.png
│       ├── missile.png
│       ├── enemy1.png
│       ├── enemy2.png
│       ├── enemy3.png
│       ├── explosion.png
│       └── powerup.png
└── README.md
```

## 🚀 How to Play

### Controls
- **Mouse**: Aim and click to shoot
- **Touch**: Tap to shoot (mobile devices)
- **Keyboard**: 
  - **SPACE**: Fire missile
  - **P**: Pause game
  - **ESC**: Return to menu

### Game Rules
1. Destroy enemy ships before they reach the bottom
2. Each enemy destroyed earns points
3. Collect power-ups for special abilities
4. Survive waves to advance levels
5. Game ends when health reaches zero

### Power-Ups
- 🔥 **Rapid Fire**: Faster shooting for 10 seconds
- 🛡️ **Shield**: Temporary invincibility for 15 seconds
- 💥 **Nuke**: Instantly destroy all enemies on screen

## 📦 Installation & Running

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/s16404367-code/missile-sky-2.0.git
   cd missile-sky-2.0
   ```

2. Open `index.html` in your web browser

### GitHub Pages Deployment

1. Push to GitHub:
   ```bash
   git push origin main
   ```

2. Enable GitHub Pages in repository settings
3. Access at: `https://s16404367-code.github.io/missile-sky-2.0/`

## 🛠️ Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling and animations
- **JavaScript (ES6+)** - Game logic
- **HTML5 Canvas API** - Rendering
- **HTML5 Audio API** - Sound effects

## 🎨 Game Assets

All game assets are generated and included in the `assets/` directory.

## 📊 Scoring System

| Action | Points |
|--------|--------|
| Scout Enemy | 10 |
| Fighter Enemy | 25 |
| Boss Enemy | 100 |
| Wave Bonus | 500 |
| Power-up Collected | 50 |

## 🏆 High Scores

The game tracks your highest score using browser localStorage.

## 🔧 Configuration

Edit the following variables in `game.js` to customize:

```javascript
const CONFIG = {
  enemySpawnRate: 1000,
  missileSpeed: 10,
  enemySpeed: 2,
  health: 100,
  // ... and more
};
```

## 📝 Changelog

### v2.0 (Current)
- Complete rebuild with modern JavaScript
- Added wave system
- Added multiple enemy types
- Added power-ups
- Improved graphics and sound
- Responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📜 License

MIT License - Feel free to use, modify, and distribute.

## 📞 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ by Arena.ai Premium Agent**

🎮 **Play Now**: [Live Demo](https://s16404367-code.github.io/missile-sky-2.0/)
