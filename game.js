/**
 * Missile Sky 2.0 - Space Defense Game
 * Premium JavaScript Implementation
 * Built with HTML5 Canvas
 */

// ============================================
// GAME CONFIGURATION
// ============================================

const CONFIG = {
    // Canvas settings
    canvasWidth: 800,
    canvasHeight: 600,
    
    // Game settings
    initialHealth: 100,
    initialScore: 0,
    
    // Enemy settings
    enemySpawnRate: 1500, // ms
    enemySpeed: 2,
    enemySpawnOffset: 50, // pixels from edge
    
    // Missile settings
    missileSpeed: 12,
    missileWidth: 4,
    missileHeight: 15,
    missileColor: '#00d4ff',
    
    // Player (turret) settings
    turretWidth: 60,
    turretHeight: 60,
    turretColor: '#00d4ff',
    
    // Power-up settings
    powerupSpawnRate: 10000, // ms
    powerupSpeed: 1.5,
    powerupSize: 30,
    
    // Wave settings
    enemiesPerWave: 10,
    waveDelay: 3000, // ms between waves
    
    // Difficulty multipliers
    difficulty: {
        easy: { enemySpeed: 1.5, enemySpawnRate: 2000, health: 150 },
        medium: { enemySpeed: 2, enemySpawnRate: 1500, health: 100 },
        hard: { enemySpeed: 2.5, enemySpawnRate: 1000, health: 75 }
    }
};

// ============================================
// GAME STATE
// ============================================

const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    HOW_TO_PLAY: 'how_to_play',
    HIGH_SCORES: 'high_scores',
    SETTINGS: 'settings'
};

// ============================================
// GAME VARIABLES
// ============================================

let canvas, ctx;
let gameState = GameState.LOADING;
let lastTime = 0;
let deltaTime = 0;

// Game objects
let turret = null;
let missiles = [];
let enemies = [];
let powerups = [];
let explosions = [];

// Game stats
let score = 0;
let wave = 1;
let health = CONFIG.initialHealth;
let maxHealth = CONFIG.initialHealth;
let enemiesDestroyed = 0;
let currentDifficulty = 'medium';

// Power-up states
let rapidFireActive = false;
let rapidFireTimer = 0;
let shieldActive = false;
let shieldTimer = 0;

// Timers
let enemySpawnTimer = 0;
let powerupSpawnTimer = 0;
let waveTimer = 0;
let waveEnemyCount = 0;

// Settings
let soundEnabled = true;
let musicEnabled = true;
let volume = 0.7;

// Audio elements
let bgMusic, laserSound, explosionSound, powerupSound, gameOverSound;

// High scores
let highScores = [];

// ============================================
// ENEMY TYPES
// ============================================

const EnemyType = {
    SCOUT: { 
        width: 30, 
        height: 30, 
        color: '#4CAF50',
        points: 10,
        health: 1,
        speedMultiplier: 1
    },
    FIGHTER: { 
        width: 40, 
        height: 40, 
        color: '#FF9800',
        points: 25,
        health: 2,
        speedMultiplier: 1.2
    },
    BOSS: { 
        width: 60, 
        height: 60, 
        color: '#F44336',
        points: 100,
        health: 5,
        speedMultiplier: 0.8
    }
};

// ============================================
// POWER-UP TYPES
// ============================================

const PowerupType = {
    RAPID_FIRE: { 
        icon: '🔥', 
        duration: 10000, // 10 seconds
        color: '#FF9800'
    },
    SHIELD: { 
        icon: '🛡️', 
        duration: 15000, // 15 seconds
        color: '#2196F3'
    },
    NUKE: { 
        icon: '💥', 
        duration: 0,
        color: '#F44336'
    }
};

// ============================================
// HIGH SCORES MANAGEMENT
// ============================================

function loadHighScores() {
    const saved = localStorage.getItem('missileSkyHighScores');
    if (saved) {
        highScores = JSON.parse(saved);
    } else {
        // Default high scores
        highScores = [
            { name: 'PLAYER', score: 5000, date: new Date().toISOString() },
            { name: 'CHAMPION', score: 3000, date: new Date().toISOString() },
            { name: 'WARRIOR', score: 1500, date: new Date().toISOString() }
        ];
    }
    highScores.sort((a, b) => b.score - a.score);
}

function saveHighScores() {
    localStorage.setItem('missileSkyHighScores', JSON.stringify(highScores));
}

function addHighScore(name, score) {
    highScores.push({ name, score, date: new Date().toISOString() });
    highScores.sort((a, b) => b.score - a.score);
    if (highScores.length > 10) {
        highScores = highScores.slice(0, 10);
    }
    saveHighScores();
}

function isHighScore(score) {
    if (highScores.length < 10) return true;
    return score > highScores[highScores.length - 1].score;
}

// ============================================
// GAME OBJECT CLASSES
// ============================================

class Turret {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 50;
        this.width = CONFIG.turretWidth;
        this.height = CONFIG.turretHeight;
        this.color = CONFIG.turretColor;
        this.angle = 0;
        this.cooldown = 0;
        this.cooldownTime = 200; // ms
    }
    
    update(mouseX, mouseY) {
        // Calculate angle to mouse
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        this.angle = Math.atan2(dy, dx);
        
        // Update cooldown
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw turret base
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw turret barrel
        ctx.fillStyle = '#0099cc';
        ctx.beginPath();
        ctx.arc(0, -this.width / 2, this.width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw barrel extension
        ctx.fillStyle = '#006699';
        ctx.fillRect(-4, -this.width, 8, this.width / 2);
        
        ctx.restore();
    }
    
    canShoot() {
        return this.cooldown <= 0;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.cooldown = rapidFireActive ? this.cooldownTime / 3 : this.cooldownTime;
            
            // Calculate missile direction
            const missileX = this.x + Math.cos(this.angle) * (this.width / 2 + 10);
            const missileY = this.y + Math.sin(this.angle) * (this.width / 2 + 10);
            
            missiles.push(new Missile(missileX, missileY, this.angle));
            
            if (soundEnabled) {
                playSound(laserSound, volume);
            }
            
            return true;
        }
        return false;
    }
}

class Missile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = CONFIG.missileSpeed;
        this.width = CONFIG.missileWidth;
        this.height = CONFIG.missileHeight;
        this.color = CONFIG.missileColor;
        this.active = true;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Check if out of bounds
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw missile body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Draw missile tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw missile trail
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-this.width / 2, this.height / 2, this.width, this.height / 2);
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
}

class Enemy {
    constructor(type) {
        this.type = type;
        this.width = type.width;
        this.height = type.height;
        this.color = type.color;
        this.points = type.points;
        this.health = type.health;
        this.maxHealth = type.health;
        
        // Spawn at random position at top
        this.x = Math.random() * (canvas.width - this.width * 2) + this.width;
        this.y = -this.height - Math.random() * 100;
        
        // Random speed based on type
        this.speed = CONFIG.enemySpeed * type.speedMultiplier * 
                    (1 + Math.random() * 0.3);
        
        // Random movement pattern
        this.pattern = Math.random() > 0.5 ? 'zigzag' : 'straight';
        this.patternOffset = Math.random() * 100;
        this.patternFrequency = Math.random() * 0.02 + 0.01;
    }
    
    update() {
        this.y += this.speed;
        
        // Apply movement pattern
        if (this.pattern === 'zigzag') {
            this.x += Math.sin(Date.now() * this.patternFrequency + this.patternOffset) * 2;
        }
        
        // Check if reached bottom
        if (this.y > canvas.height + this.height) {
            return false; // Should be removed
        }
        
        return true;
    }
    
    draw() {
        ctx.save();
        
        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Different shapes for different enemy types
        if (this.type === EnemyType.BOSS) {
            // Draw boss (hexagon)
            const size = this.width / 2;
            ctx.moveTo(this.x + size, this.y);
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                ctx.lineTo(
                    this.x + size + Math.cos(angle) * size * 0.8,
                    this.y + Math.sin(angle) * size * 0.8
                );
            }
        } else {
            // Draw regular enemy (triangle pointing down)
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x - this.width / 2, this.y + this.height);
            ctx.closePath();
        }
        
        ctx.fill();
        
        // Draw health bar for bosses
        if (this.type === EnemyType.BOSS && this.health < this.maxHealth) {
            const barWidth = this.width * 1.5;
            const barHeight = 5;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 10;
            
            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health fill
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
        
        ctx.restore();
    }
    
    hit(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

class Powerup {
    constructor(type) {
        this.type = type;
        this.icon = type.icon;
        this.color = type.color;
        this.size = CONFIG.powerupSize;
        this.x = Math.random() * (canvas.width - this.size * 2) + this.size;
        this.y = -this.size - Math.random() * 50;
        this.speed = CONFIG.powerupSpeed;
    }
    
    update() {
        this.y += this.speed;
        
        if (this.y > canvas.height + this.size) {
            return false;
        }
        return true;
    }
    
    draw() {
        ctx.save();
        
        // Draw power-up circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glow effect
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2 + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Draw icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.size / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
        
        // Draw pulsing animation
        const pulse = Math.sin(Date.now() * 0.01) * 3 + 3;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
}

class Explosion {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size || 30;
        this.color = color || '#ff0000';
        this.particles = [];
        this.lifetime = 500; // ms
        this.age = 0;
        
        // Create particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 5 + 2,
                lifetime: Math.random() * 400 + 100
            });
        }
    }
    
    update() {
        this.age += deltaTime;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.lifetime -= deltaTime;
            
            if (p.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.age < this.lifetime || this.particles.length > 0;
    }
    
    draw() {
        // Draw main explosion
        const progress = this.age / this.lifetime;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Draw particles
        for (const p of this.particles) {
            const particleAlpha = Math.min(1, p.lifetime / 100);
            ctx.save();
            ctx.globalAlpha = particleAlpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.restore();
    }
}

// ============================================
// SOUND MANAGEMENT
// ============================================

function playSound(sound, vol) {
    if (!sound || !soundEnabled) return;
    
    const clone = sound.cloneNode();
    clone.volume = vol * volume;
    clone.play();
}

function stopAllSounds() {
    if (bgMusic) bgMusic.pause();
}

// ============================================
// GAME INITIALIZATION
// ============================================

function initCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth, 1200);
    const maxHeight = Math.min(window.innerHeight, 800);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    CONFIG.canvasWidth = canvas.width;
    CONFIG.canvasHeight = canvas.height;
    
    // Recreate turret if it exists
    if (turret) {
        turret.x = canvas.width / 2;
        turret.y = canvas.height - 50;
    }
}

function initAudio() {
    bgMusic = document.getElementById('bg-music');
    laserSound = document.getElementById('laser-sound');
    explosionSound = document.getElementById('explosion-sound');
    powerupSound = document.getElementById('powerup-sound');
    gameOverSound = document.getElementById('game-over-sound');
    
    bgMusic.volume = volume * 0.5;
    bgMusic.loop = true;
}

function initEventListeners() {
    // Mouse events
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    // Touch events
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    
    // Button events
    document.getElementById('play-btn').addEventListener('click', startGame);
    document.getElementById('how-to-play-btn').addEventListener('click', () => {
        showScreen(GameState.HOW_TO_PLAY);
    });
    document.getElementById('high-scores-btn').addEventListener('click', () => {
        updateHighScoresDisplay();
        showScreen(GameState.HIGH_SCORES);
    });
    document.getElementById('settings-btn').addEventListener('click', () => {
        showScreen(GameState.SETTINGS);
    });
    
    // Back buttons
    document.getElementById('back-from-how-to-play').addEventListener('click', () => {
        showScreen(GameState.MENU);
    });
    document.getElementById('back-from-high-scores').addEventListener('click', () => {
        showScreen(GameState.MENU);
    });
    document.getElementById('back-from-settings').addEventListener('click', () => {
        saveSettings();
        showScreen(GameState.MENU);
    });
    
    // Game over buttons
    document.getElementById('replay-btn').addEventListener('click', startGame);
    document.getElementById('menu-from-game-over').addEventListener('click', () => {
        showScreen(GameState.MENU);
    });
    
    // Pause buttons
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('menu-from-pause').addEventListener('click', () => {
        showScreen(GameState.MENU);
    });
    
    // Settings toggles
    document.getElementById('sound-toggle').addEventListener('change', function() {
        soundEnabled = this.checked;
    });
    document.getElementById('music-toggle').addEventListener('change', function() {
        musicEnabled = this.checked;
        if (musicEnabled && gameState === GameState.PLAYING) {
            bgMusic.play().catch(e => console.log('Audio play failed:', e));
        } else {
            bgMusic.pause();
        }
    });
    document.getElementById('volume-slider').addEventListener('input', function() {
        volume = this.value / 100;
        bgMusic.volume = volume * 0.5;
    });
    document.getElementById('difficulty-select').addEventListener('change', function() {
        currentDifficulty = this.value;
    });
}

function handleMouseMove(e) {
    if (gameState !== GameState.PLAYING) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (turret) {
        turret.update(mouseX, mouseY);
    }
}

function handleClick(e) {
    if (gameState !== GameState.PLAYING) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (turret && turret.canShoot()) {
        turret.shoot();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (gameState !== GameState.PLAYING) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    
    if (turret) {
        turret.update(mouseX, mouseY);
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    if (gameState !== GameState.PLAYING) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    
    if (turret && turret.canShoot()) {
        turret.shoot();
    }
}

function handleKeyDown(e) {
    switch (e.code) {
        case 'Space':
            if (gameState === GameState.PLAYING && turret && turret.canShoot()) {
                e.preventDefault();
                turret.shoot();
            }
            break;
        case 'KeyP':
            if (gameState === GameState.PLAYING) {
                pauseGame();
            }
            break;
        case 'Escape':
            if (gameState === GameState.PLAYING) {
                pauseGame();
            } else if (gameState === GameState.PAUSED) {
                resumeGame();
            } else if (gameState === GameState.HOW_TO_PLAY || 
                       gameState === GameState.HIGH_SCORES || 
                       gameState === GameState.SETTINGS) {
                showScreen(GameState.MENU);
            }
            break;
    }
}

// ============================================
// GAME STATE MANAGEMENT
// ============================================

function showScreen(state) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show the requested screen
    gameState = state;
    
    switch (state) {
        case GameState.LOADING:
            document.getElementById('loading-screen').classList.remove('hidden');
            break;
        case GameState.MENU:
            document.getElementById('menu-screen').classList.remove('hidden');
            break;
        case GameState.PLAYING:
            document.getElementById('game-screen').classList.remove('hidden');
            break;
        case GameState.PAUSED:
            document.getElementById('pause-screen').classList.remove('hidden');
            break;
        case GameState.GAME_OVER:
            document.getElementById('game-over-screen').classList.remove('hidden');
            break;
        case GameState.HOW_TO_PLAY:
            document.getElementById('how-to-play-screen').classList.remove('hidden');
            break;
        case GameState.HIGH_SCORES:
            document.getElementById('high-scores-screen').classList.remove('hidden');
            break;
        case GameState.SETTINGS:
            document.getElementById('settings-screen').classList.remove('hidden');
            loadSettings();
            break;
    }
}

function loadSettings() {
    const savedSettings = localStorage.getItem('missileSkySettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        soundEnabled = settings.soundEnabled !== false;
        musicEnabled = settings.musicEnabled !== false;
        volume = settings.volume || 0.7;
        currentDifficulty = settings.difficulty || 'medium';
    }
    
    // Update UI
    document.getElementById('sound-toggle').checked = soundEnabled;
    document.getElementById('music-toggle').checked = musicEnabled;
    document.getElementById('volume-slider').value = volume * 100;
    document.getElementById('difficulty-select').value = currentDifficulty;
}

function saveSettings() {
    const settings = {
        soundEnabled,
        musicEnabled,
        volume,
        difficulty: currentDifficulty
    };
    localStorage.setItem('missileSkySettings', JSON.stringify(settings));
}

function updateHighScoresDisplay() {
    const container = document.getElementById('high-scores-list');
    container.innerHTML = '';
    
    highScores.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'high-score-item';
        item.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
            <span class="date">${new Date(entry.date).toLocaleDateString()}</span>
        `;
        container.appendChild(item);
    });
}

// ============================================
// GAME LIFECYCLE
// ============================================

function startGame() {
    // Reset game state
    score = 0;
    wave = 1;
    health = CONFIG.difficulty[currentDifficulty].health || CONFIG.initialHealth;
    maxHealth = health;
    enemiesDestroyed = 0;
    
    // Clear game objects
    missiles = [];
    enemies = [];
    powerups = [];
    explosions = [];
    
    // Reset power-ups
    rapidFireActive = false;
    rapidFireTimer = 0;
    shieldActive = false;
    shieldTimer = 0;
    
    // Reset timers
    enemySpawnTimer = 0;
    powerupSpawnTimer = 0;
    waveTimer = 0;
    waveEnemyCount = 0;
    
    // Create turret
    turret = new Turret();
    
    // Update difficulty settings
    CONFIG.enemySpeed = CONFIG.difficulty[currentDifficulty].enemySpeed;
    CONFIG.enemySpawnRate = CONFIG.difficulty[currentDifficulty].enemySpawnRate;
    
    // Update HUD
    updateHUD();
    
    // Show game screen
    showScreen(GameState.PLAYING);
    
    // Start background music
    if (musicEnabled) {
        bgMusic.volume = volume * 0.5;
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Start game loop
    lastTime = performance.now();
    gameLoop();
}

function pauseGame() {
    if (gameState !== GameState.PLAYING) return;
    
    gameState = GameState.PAUSED;
    document.getElementById('pause-screen').classList.remove('hidden');
    
    if (musicEnabled) {
        bgMusic.pause();
    }
}

function resumeGame() {
    if (gameState !== GameState.PAUSED) return;
    
    gameState = GameState.PLAYING;
    document.getElementById('pause-screen').classList.add('hidden');
    
    if (musicEnabled) {
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
    }
}

function gameOver() {
    gameState = GameState.GAME_OVER;
    
    // Stop background music
    bgMusic.pause();
    
    // Play game over sound
    if (soundEnabled) {
        playSound(gameOverSound, volume);
    }
    
    // Update game over screen
    document.getElementById('final-score').textContent = `Score: ${score}`;
    document.getElementById('final-wave').textContent = `Wave: ${wave}`;
    
    // Check for high score
    const isNewHighScore = isHighScore(score);
    if (isNewHighScore) {
        document.getElementById('new-high-score').classList.remove('hidden');
        
        // Prompt for name (simple implementation)
        const name = prompt('New High Score! Enter your name:', 'PLAYER');
        if (name && name.trim()) {
            addHighScore(name.trim(), score);
        }
    } else {
        document.getElementById('new-high-score').classList.add('hidden');
    }
    
    showScreen(GameState.GAME_OVER);
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(timestamp = 0) {
    if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) {
        return;
    }
    
    // Calculate delta time
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Cap delta time to prevent issues
    if (deltaTime > 100) deltaTime = 100;
    
    // Only update if playing
    if (gameState === GameState.PLAYING) {
        update(deltaTime);
    }
    
    // Always render
    render();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Update turret (if exists)
    if (turret) {
        // For now, turret follows mouse which is handled in event listeners
        // Just update cooldown
        turret.update(turret.x, turret.y);
    }
    
    // Update missiles
    for (let i = missiles.length - 1; i >= 0; i--) {
        missiles[i].update();
        if (!missiles[i].active) {
            missiles.splice(i, 1);
        }
    }
    
    // Update enemies and check collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const stillAlive = enemy.update();
        
        if (!stillAlive) {
            // Enemy reached bottom
            enemies.splice(i, 1);
            takeDamage(10);
            continue;
        }
        
        // Check collision with turret
        if (!shieldActive && checkCollision(enemy, turret)) {
            enemies.splice(i, 1);
            takeDamage(20);
            createExplosion(enemy.x, enemy.y, 40, enemy.color);
            if (soundEnabled) {
                playSound(explosionSound, volume);
            }
            continue;
        }
        
        // Check collision with missiles
        for (let j = missiles.length - 1; j >= 0; j--) {
            if (checkCollision(enemy, missiles[j])) {
                missiles[j].active = false;
                missiles.splice(j, 1);
                
                const destroyed = enemy.hit(1);
                if (destroyed) {
                    enemies.splice(i, 1);
                    addScore(enemy.points);
                    enemiesDestroyed++;
                    
                    // Random chance to spawn power-up
                    if (Math.random() < 0.1) {
                        spawnPowerup();
                    }
                }
                
                createExplosion(enemy.x, enemy.y, 30, enemy.color);
                if (soundEnabled) {
                    playSound(explosionSound, volume * 0.5);
                }
                break;
            }
        }
    }
    
    // Update power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const stillAlive = powerup.update();
        
        if (!stillAlive) {
            powerups.splice(i, 1);
            continue;
        }
        
        // Check collision with turret
        if (checkCollision(powerup, turret)) {
            powerups.splice(i, 1);
            activatePowerup(powerup.type);
            addScore(50);
            if (soundEnabled) {
                playSound(powerupSound, volume);
            }
        }
    }
    
    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const stillAlive = explosions[i].update();
        if (!stillAlive) {
            explosions.splice(i, 1);
        }
    }
    
    // Update power-up timers
    if (rapidFireActive) {
        rapidFireTimer -= deltaTime;
        if (rapidFireTimer <= 0) {
            rapidFireActive = false;
            updateHUD();
        }
    }
    
    if (shieldActive) {
        shieldTimer -= deltaTime;
        if (shieldTimer <= 0) {
            shieldActive = false;
            updateHUD();
        }
    }
    
    // Spawn enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= CONFIG.enemySpawnRate && waveEnemyCount < CONFIG.enemiesPerWave * wave) {
        spawnEnemy();
        enemySpawnTimer = 0;
        waveEnemyCount++;
    }
    
    // Spawn power-ups
    powerupSpawnTimer += deltaTime;
    if (powerupSpawnTimer >= CONFIG.powerupSpawnRate && powerups.length < 3) {
        spawnPowerup();
        powerupSpawnTimer = 0;
    }
    
    // Check wave completion
    if (waveEnemyCount >= CONFIG.enemiesPerWave * wave && enemies.length === 0) {
        waveTimer += deltaTime;
        if (waveTimer >= CONFIG.waveDelay) {
            wave++;
            waveEnemyCount = 0;
            waveTimer = 0;
            addScore(500 * wave); // Wave bonus
            
            // Increase difficulty slightly
            CONFIG.enemySpeed += 0.1;
            CONFIG.enemySpawnRate = Math.max(500, CONFIG.enemySpawnRate - 50);
        }
    }
    
    // Update HUD
    updateHUD();
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw starfield background
    drawStarfield();
    
    // Draw game objects
    if (turret) turret.draw();
    
    for (const missile of missiles) {
        missile.draw();
    }
    
    for (const enemy of enemies) {
        enemy.draw();
    }
    
    for (const powerup of powerups) {
        powerup.draw();
    }
    
    for (const explosion of explosions) {
        explosion.draw();
    }
}

function drawStarfield() {
    // Draw stars
    ctx.fillStyle = '#fff';
    const starCount = Math.floor(canvas.width * canvas.height / 5000);
    
    for (let i = 0; i < starCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.5;
        const alpha = Math.random() * 0.8 + 0.2;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 0.5;
    
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// ============================================
// SPAWNING FUNCTIONS
// ============================================

function spawnEnemy() {
    const types = [EnemyType.SCOUT, EnemyType.FIGHTER, EnemyType.FIGHTER, EnemyType.SCOUT];
    
    // Boss enemy every 5 waves
    if (wave % 5 === 0 && Math.random() < 0.3) {
        enemies.push(new Enemy(EnemyType.BOSS));
    } else {
        const randomType = types[Math.floor(Math.random() * types.length)];
        enemies.push(new Enemy(randomType));
    }
}

function spawnPowerup() {
    const types = [PowerupType.RAPID_FIRE, PowerupType.SHIELD, PowerupType.NUKE];
    const randomType = types[Math.floor(Math.random() * types.length)];
    powerups.push(new Powerup(randomType));
}

function createExplosion(x, y, size, color) {
    explosions.push(new Explosion(x, y, size, color));
}

// ============================================
// COLLISION DETECTION
// ============================================

function checkCollision(obj1, obj2) {
    // Simple AABB collision for now
    // For circular objects, we'll use a simpler check
    
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const radius1 = obj1.width ? obj1.width / 2 : obj1.size / 2;
    const radius2 = obj2.width ? obj2.width / 2 : obj2.size / 2;
    
    return distance < radius1 + radius2;
}

// ============================================
// GAME STATS MANAGEMENT
// ============================================

function addScore(points) {
    score += points;
    updateHUD();
}

function takeDamage(amount) {
    if (shieldActive) return;
    
    health -= amount;
    maxHealth = Math.max(maxHealth, CONFIG.difficulty[currentDifficulty].health);
    
    if (health <= 0) {
        health = 0;
        gameOver();
    }
    
    updateHUD();
}

function activatePowerup(type) {
    if (type === PowerupType.RAPID_FIRE) {
        rapidFireActive = true;
        rapidFireTimer = type.duration;
    } else if (type === PowerupType.SHIELD) {
        shieldActive = true;
        shieldTimer = type.duration;
    } else if (type === PowerupType.NUKE) {
        // Nuke effect: destroy all enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            addScore(enemies[i].points);
            createExplosion(enemies[i].x, enemies[i].y, 30, enemies[i].color);
        }
        enemies = [];
    }
    
    updateHUD();
}

function updateHUD() {
    // Update score
    document.getElementById('score-value').textContent = score.toLocaleString();
    
    // Update wave
    document.getElementById('wave-value').textContent = wave;
    
    // Update health bar
    const healthBar = document.querySelector('.health-fill');
    const healthPercent = (health / maxHealth) * 100;
    healthBar.style.width = `${healthPercent}%`;
    healthBar.style.setProperty('--health-percent', `${healthPercent}%`);
    
    // Update power-up indicators
    const rapidFireIndicator = document.getElementById('rapid-fire-indicator');
    const shieldIndicator = document.getElementById('shield-indicator');
    const powerupTimer = document.getElementById('powerup-timer');
    
    if (rapidFireActive) {
        rapidFireIndicator.classList.remove('hidden');
        powerupTimer.textContent = formatTime(rapidFireTimer);
    } else {
        rapidFireIndicator.classList.add('hidden');
    }
    
    if (shieldActive) {
        shieldIndicator.classList.remove('hidden');
        powerupTimer.textContent = formatTime(shieldTimer);
    } else if (!rapidFireActive) {
        powerupTimer.textContent = '';
    }
}

function formatTime(ms) {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
}

// ============================================
// LOADING MANAGEMENT
// ============================================

function simulateLoading() {
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');
    
    let progress = 0;
    const intervals = ['Loading Assets...', 'Initializing Game...', 'Preparing Levels...', 'Almost Ready...'];
    
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;
        
        loadingProgress.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            loadingText.textContent = 'Ready to Play!';
            
            setTimeout(() => {
                showScreen(GameState.MENU);
                loadHighScores();
            }, 500);
        } else {
            loadingText.textContent = intervals[Math.floor(progress / 25)] || 'Loading...';
        }
    }, 200);
}

// ============================================
// INITIALIZE GAME
// ============================================

function init() {
    console.log('🚀 Missile Sky 2.0 - Initializing...');
    
    // Initialize canvas
    initCanvas();
    
    // Initialize audio
    initAudio();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load high scores
    loadHighScores();
    
    // Start loading simulation
    simulateLoading();
    
    console.log('✅ Missile Sky 2.0 - Ready!');
}

// Start the game when DOM is loaded
window.addEventListener('DOMContentLoaded', init);
