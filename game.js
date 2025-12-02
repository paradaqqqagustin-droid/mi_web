// 3v3 Football Game Engine - Possession & Stun Edition
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startGameBtn');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');

// Add power bar to DOM
const powerBarContainer = document.createElement('div');
powerBarContainer.className = 'power-bar-container';
const powerBarFill = document.createElement('div');
powerBarFill.className = 'power-bar-fill';
powerBarContainer.appendChild(powerBarFill);
document.querySelector('.controls-info').insertBefore(powerBarContainer, startBtn);

// Kaiser Flow UI Elements
const flowBarContainer = document.getElementById('flowBarContainer');
const flowBarFill = document.getElementById('flowBarFill');
const flowAlert = document.getElementById('flowAlert');

// Update controls info text
document.querySelector('.controls-info p').innerHTML = '<strong>WASD</strong>: Moverse | <strong>Click Izq</strong>: Disparo | <strong>Click Der</strong>: Pase | <strong>Q/E</strong>: Efecto (Mantener) | <strong>R</strong>: Pedir Pase | <strong>K/M</strong>: Tácticas (Atacar/Defender)';

// Sound Manager using Web Audio API
class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.flowAudio = new Audio('kaiser_flow.mp3');
        this.flowAudio.volume = 0.6;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 0.1) {
        if (!this.ctx || this.isMuted) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playKick() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playDribble() {
        // Soft noise click
        this.playNoise(0.05, 0.05);
    }

    playTackle() {
        // Longer noise burst
        this.playNoise(0.3, 0.2);
    }

    playGoal() {
        if (!this.ctx || this.isMuted) return;
        // Whistle
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.setValueAtTime(2500, now + 0.1);
        osc.frequency.setValueAtTime(2000, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.5);

        // Crowd Cheer (Pink Noise approximation)
        this.playNoise(2.0, 0.1);
    }

    playKaiserSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Powerful Impact Bass
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.5);

        // High Energy Flash
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.frequency.setValueAtTime(500, now);
        osc2.frequency.linearRampToValueAtTime(1500, now + 0.2);
        osc2.type = 'square';

        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.2);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start();
        osc2.stop(now + 0.2);
    }

    playFlowIntro() {
        if (this.isMuted) return;

        // Play external audio file
        this.flowAudio.currentTime = 0;
        this.flowAudio.play().catch(e => console.log("Audio play failed:", e));
    }

    stopFlowAudio() {
        if (this.flowAudio) {
            this.flowAudio.pause();
            this.flowAudio.currentTime = 0;
        }
    }

    playMagnusVoice() {
        if (this.isMuted) return;
        const audio = new Audio('magnus impact.mp3');
        audio.currentTime = 40; // Start at 40s
        audio.volume = 1.0;
        audio.play().catch(e => console.log("Audio play failed", e));

        // Stop after 2 seconds (40s to 42s)
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, 2500); // 2.5s to be safe
    }
}

const soundManager = new SoundManager();

// Game Constants
const FIELD_WIDTH = 1200;
const FIELD_HEIGHT = 800;
const PLAYER_RADIUS = 10;
const BALL_RADIUS = 6;
const GOAL_HEIGHT = 160;
const GOAL_POST_RADIUS = 8;
const PENALTY_AREA_WIDTH = 120;
const PENALTY_AREA_HEIGHT = 220;
const FRICTION = 0.97;
const PLAYER_SPEED = 3.5;
const SPRINT_SPEED = 6;
const SHOOT_POWER_MAX = 18;
const PASS_POWER = 12;
const STUN_DURATION = 90; // 1.5 seconds at 60fps
const CELEBRATION_DURATION = 300; // 5 seconds at 60fps
const FLOW_DURATION = 3600; // 60 seconds at 60fps
const FLOW_ENERGY_MAX = 100;

const GOAL_POSTS = [
    { x: 0, y: FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2 },
    { x: 0, y: FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2 },
    { x: FIELD_WIDTH, y: FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2 },
    { x: FIELD_WIDTH, y: FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2 }
];

let gameRunning = false;
let score = { blue: 0, red: 0 };
let isGoalScored = false;
let celebrationTimer = 0;

let confettiParticles = [];
let teamStrategy = 'NEUTRAL'; // NEUTRAL, ATTACK, DEFEND
let chargeType = 'SHOOT'; // SHOOT, PASS

// Kaiser Impact State
let impactFrameTimer = 0;
let kaiserEffectActive = false;

// Kaiser Flow State
let isFlowActive = false;
let flowTimer = 0;
let isCinematicActive = false;
let cinematicTimer = 0;
let isBeinschussActive = false;
let beinschussTimer = 0;

// Input State
const keys = {
    w: false, a: false, s: false, d: false,
    q: false, e: false, r: false,
    k: false, m: false, i: false, g: false, u: false
};

let shootCharge = 0;
let isCharging = false;
let mouseX = 0;
let mouseY = 0;

// Entities
class Entity {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.mass = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Boundaries
        if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -0.5; }
        if (this.x + this.radius > FIELD_WIDTH) { this.x = FIELD_WIDTH - this.radius; this.vx *= -0.5; }
        if (this.y - this.radius < 0) { this.y = this.radius; this.vy *= -0.5; }
        if (this.y + this.radius > FIELD_HEIGHT) { this.y = FIELD_HEIGHT - this.radius; this.vy *= -0.5; }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 100 + Math.random() * 100;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.size = Math.random() * 5 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Player extends Entity {
    constructor(x, y, team, isHuman = false, isGoalkeeper = false) {
        super(x, y, PLAYER_RADIUS, '#fff');

        this.team = team;
        this.isHuman = isHuman;
        this.isGoalkeeper = isGoalkeeper;
        this.outline = team === 'blue' ? '#06b6d4' : '#ff0000';
        if (this.isGoalkeeper) this.outline = '#ffff00'; // Yellow for GK

        this.sliding = false;
        this.slideTimer = 0;
        this.mass = 5;

        // New Mechanics
        this.stunTimer = 0;
        this.isDribbling = false;
        this.invulnerableTimer = 0; // IFrames

        // Kaiser Flow
        this.flowEnergy = 0;
        if (this.isHuman) {
            this.flowEnergy = 0; // Start with 0
            this.passives = ['PREDATOR_EYE', 'METAVISION']; // Kaiser's Passives
        } else {
            this.passives = [];
        }

        // GK Mechanics
        this.isDiving = false;
        this.diveTimer = 0;

        // AI State
        this.role = isGoalkeeper ? 'GK' : 'IDLE';
        this.targetX = x;
        this.targetY = y;
        this.lastPos = { x: x, y: y };
        this.stuckCounter = 0;
        this.unstickTimer = 0;
        this.unstickDir = { x: 0, y: 0 };
        this.callingForPass = false;

        // Visuals
        this.trail = []; // For Ghost Trails
        this.speechBubble = null; // { text, timer, color }

        // Stats
        this.stats = { passSuccess: 0, passFail: 0, dribbleSuccess: 0, dribbleFail: 0, shotsTaken: 0, goalsScored: 0, saves: 0, goalsConceded: 0 };
    }

    update(ball, allPlayers) {
        // Handle Stun
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx *= 0.8;
            this.vy *= 0.8;
            super.update();
            super.update();
            return; // Cannot act while stunned
        }

        // Update Speech Bubble
        if (this.speechBubble) {
            this.speechBubble.timer--;
            if (this.speechBubble.timer <= 0) this.speechBubble = null;
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }

        if (this.isDiving) {
            this.diveTimer--;
            this.vx *= 0.9;
            this.vy *= 0.9;
            if (this.diveTimer <= 0) this.isDiving = false;
            super.update();
            return;
        }

        if (this.isHuman) {
            this.handleInput(ball, allPlayers);
            this.updateFlow();
        } else {
            this.aiBehavior(ball, allPlayers);
        }

        if (this.sliding) {
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.slideTimer--;
            if (this.slideTimer <= 0) this.sliding = false;
        }

        // Update Trail
        if (this.vx !== 0 || this.vy !== 0) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
            if (this.trail.length > 10) this.trail.shift();
        }
        this.trail.forEach(t => t.alpha -= 0.1);
        this.trail = this.trail.filter(t => t.alpha > 0);

        // Beinschuss Activation Check
        if (this.isHuman && isFlowActive && ball.holder === this) {
            const distToGoal = Math.abs(FIELD_WIDTH - this.x); // Assuming attacking right
            if (distToGoal < 300) { // Near penalty area
                // Check for tackle
                const tackler = allPlayers.find(p => p.team !== this.team && p.sliding && Math.hypot(p.x - this.x, p.y - this.y) < 40);
                if (tackler && !isBeinschussActive) {
                    this.performBeinschuss(FIELD_WIDTH, FIELD_HEIGHT / 2); // Target goal
                }
            }
        }

        super.update();
    }

    updateFlow() {
        if (!this.isHuman) return;

        // Energy Accumulation Logic is handled in actions (dribble, pass, shoot)

        // Cap Energy
        if (this.flowEnergy > FLOW_ENERGY_MAX) this.flowEnergy = FLOW_ENERGY_MAX;

        // Update UI
        if (flowBarFill) {
            flowBarFill.style.width = `${(this.flowEnergy / FLOW_ENERGY_MAX) * 100}%`;
        }

        if (this.flowEnergy >= FLOW_ENERGY_MAX && !isFlowActive) {
            if (flowAlert) flowAlert.style.display = 'block';
        } else {
            if (flowAlert) flowAlert.style.display = 'none';
        }
    }

    handleInput(ball, allPlayers) {
        if (this.sliding || this.isDiving) return;

        let speed = PLAYER_SPEED;

        // Apply Flow Buffs (Speed & Agility)
        if (isFlowActive && this.isHuman) {
            speed *= 1.25; // +25% Speed
        }

        // Call for Pass (R)
        if (keys.r) {
            this.callingForPass = true;
            // Visual feedback handled in draw
        } else {
            this.callingForPass = false;
        }

        // Dribble Mode (E)
        this.isDribbling = keys.e;
        if (this.isDribbling) {
            speed *= 0.8; // Slower while dribbling
            if (Math.random() < 0.1) soundManager.playDribble(); // Random dribble sound

            // Energy for Dribbling (Increased)
            if (this.isHuman && ball.holder === this && Math.random() < 0.1) { // 10% chance (was 5%)
                this.flowEnergy += 1; // +1 (was 0.5)
            }
        }

        // Sprinting Energy (New)
        if (this.isHuman && !ball.holder && (Math.abs(this.vx) > PLAYER_SPEED || Math.abs(this.vy) > PLAYER_SPEED)) {
            if (Math.random() < 0.05) this.flowEnergy += 0.2;
        }

        // Action (Q): Dive (if GK in area) or Tackle
        if (keys.q && !this.sliding && !this.isDribbling) {
            const inPenaltyArea = (this.team === 'blue' && this.x < PENALTY_AREA_WIDTH) ||
                (this.team === 'red' && this.x > FIELD_WIDTH - PENALTY_AREA_WIDTH);

            if (this.isGoalkeeper && inPenaltyArea) {
                // Dive Logic
                this.isDiving = true;
                this.diveTimer = 40;
                soundManager.playTackle(); // Dive sound
                speed = SPRINT_SPEED * 2.5;

                // Dive direction controlled by W/S
                let diveY = 0;
                if (keys.w) diveY = -1;
                if (keys.s) diveY = 1;

                this.vy = diveY * speed;
                this.vx = 10; // Slight forward momentum
                if (this.team === 'red') this.vx = -10;

                return;
            } else {
                // Normal Tackle
                this.sliding = true;
                this.slideTimer = 20;
                soundManager.playTackle(); // Tackle Sound
                speed = SPRINT_SPEED * 2;

                // Auto-Track Tackle (Metavision)
                let autoTracked = false;
                if (this.passives.includes('METAVISION') && ball.holder && ball.holder.team !== this.team) {
                    const dist = Math.hypot(ball.holder.x - this.x, ball.holder.y - this.y);
                    if (dist < 80) { // Slightly larger range for auto-track
                        const angle = Math.atan2(ball.holder.y - this.y, ball.holder.x - this.x);
                        this.vx = Math.cos(angle) * speed;
                        this.vy = Math.sin(angle) * speed;
                        autoTracked = true;
                        // Visual Flare for Perfect Steal
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.fill();
                        ctx.restore();
                    }
                }

                if (!autoTracked) {
                    const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (mag > 0) {
                        this.vx = (this.vx / mag) * speed;
                        this.vy = (this.vy / mag) * speed;
                    } else {
                        this.vx = speed;
                    }
                }

                // Energy for Tackle Attempt (New)
                if (this.isHuman) this.flowEnergy += 2;

                return;
            }
        }

        // Movement
        if (keys.w) this.vy -= 0.5;
        if (keys.s) this.vy += 0.5;
        if (keys.a) this.vx -= 0.5;
        if (keys.d) this.vx += 0.5;

        // Cap speed
        const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (mag > speed) {
            this.vx = (this.vx / mag) * speed;
            this.vy = (this.vy / mag) * speed;
        }
    }

    passToTeammate(ball, allPlayers, targetX, targetY, power = PASS_POWER, curve = 0) {
        if (ball.holder !== this) return;

        // Find teammate closest to click/target
        const myTeam = allPlayers.filter(p => p.team === this.team && p !== this);
        let bestTeammate = null;
        let minAngle = Infinity;

        myTeam.forEach(p => {
            const angleToClick = Math.atan2(targetY - this.y, targetX - this.x);
            const angleToTeammate = Math.atan2(p.y - this.y, p.x - this.x);
            const diff = Math.abs(angleToClick - angleToTeammate);
            if (diff < minAngle) {
                minAngle = diff;
                bestTeammate = p;
            }
        });

        if (bestTeammate && minAngle < 1.0) { // Within ~60 degrees
            this.shoot(ball, bestTeammate.x, bestTeammate.y, power, curve);
            // Energy for Accurate Pass (Increased)
            if (this.isHuman) this.flowEnergy += 10; // +10 (was 5)
        } else {
            // Pass into space
            this.shoot(ball, targetX, targetY, power, curve);
        }
    }


    aiBehavior(ball, allPlayers) {
        if (this.sliding || this.isDiving) return;

        // Unstick
        if (this.unstickTimer > 0) {
            this.vx += this.unstickDir.x * 0.5;
            this.vy += this.unstickDir.y * 0.5;
            this.unstickTimer--;
            return;
        }
        this.checkStuck();

        const myTeam = allPlayers.filter(p => p.team === this.team);
        const oppTeam = allPlayers.filter(p => p.team !== this.team);
        const distToBall = Math.hypot(ball.x - this.x, ball.y - this.y);
        const goalX = this.team === 'blue' ? FIELD_WIDTH : 0;

        // Goalkeeper Logic
        if (this.isGoalkeeper) {
            const myGoalX = this.team === 'blue' ? 0 : FIELD_WIDTH;
            const idealX = this.team === 'blue' ? 30 : FIELD_WIDTH - 30;

            // Stay in front of ball Y, clamped to goal
            let targetY = ball.y;
            if (targetY < FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2) targetY = FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2;
            if (targetY > FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2) targetY = FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2;

            // Move to position
            const dx = idealX - this.x;
            const dy = targetY - this.y;
            this.vx += dx * 0.1;
            this.vy += dy * 0.1;

            // Dive if ball is close and moving fast towards goal
            if (distToBall < 100 && Math.abs(ball.vx) > 5) {
                const ballHeadingToGoal = (this.team === 'blue' && ball.vx < 0) || (this.team === 'red' && ball.vx > 0);
                if (ballHeadingToGoal) {
                    this.isDiving = true;
                    this.diveTimer = 30;
                    soundManager.playTackle();
                    // Dive towards ball
                    const angle = Math.atan2(ball.y - this.y, ball.x - this.x);
                    this.vx = Math.cos(angle) * 8;
                    this.vy = Math.sin(angle) * 8;
                }
            }
            return;
        }

        // AI Dribble Logic
        if (ball.holder === this) {
            let nearestOpp = null;
            let minDist = Infinity;
            oppTeam.forEach(p => {
                const d = Math.hypot(this.x - p.x, this.y - p.y);
                if (d < minDist) { minDist = d; nearestOpp = p; }
            });

            if (minDist < 40 && Math.random() < 0.1) {
                this.isDribbling = true;
                if (Math.random() < 0.1) soundManager.playDribble();
            } else {
                this.isDribbling = false;
            }
        } else {
            this.isDribbling = false;
        }

        // Determine Role
        if (ball.holder === this) {
            this.handleBallHolder(ball, goalX, myTeam, oppTeam);
        } else if (ball.holder && ball.holder.team === this.team) {
            // Support
            this.role = 'SUPPORT';

            // Strategy Adjustment
            let stratOffsetX = 0;
            if (teamStrategy === 'ATTACK') stratOffsetX = 50;
            if (teamStrategy === 'DEFEND') stratOffsetX = -50;
            if (this.team === 'red') stratOffsetX *= -1;

            const index = myTeam.indexOf(this);
            const yOffset = (index % 2 === 0) ? -100 : 100;
            this.moveTo(ball.x + (this.team === 'blue' ? -50 : 50) + stratOffsetX, ball.y + yOffset, PLAYER_SPEED);
        } else {
            // Defense / Chase
            if (distToBall < 100 || ball.holder === null) {
                this.moveTo(ball.x, ball.y, SPRINT_SPEED);
                if (ball.holder && ball.holder.team !== this.team && distToBall < 60 && Math.random() < 0.03) {
                    this.sliding = true;
                    this.slideTimer = 15;
                    soundManager.playTackle();
                    const angle = Math.atan2(ball.y - this.y, ball.x - this.x);
                    this.vx = Math.cos(angle) * SPRINT_SPEED * 1.5;
                    this.vy = Math.sin(angle) * SPRINT_SPEED * 1.5;
                }
            } else {
                // Mark
                this.role = 'DEFEND';
                let stratOffsetX = 0;
                if (teamStrategy === 'ATTACK') stratOffsetX = 100; // Press high
                if (teamStrategy === 'DEFEND') stratOffsetX = -100; // Park the bus
                if (this.team === 'red') stratOffsetX *= -1;

                const targetX = (ball.x + (this.team === 'blue' ? 0 : FIELD_WIDTH)) / 2 + stratOffsetX;
                this.moveTo(targetX, ball.y, PLAYER_SPEED);
            }
        }
    }


    handleBallHolder(ball, goalX, myTeam, oppTeam) {
        const distToGoal = Math.abs(goalX - this.x);

        // Check for Pass Call
        const caller = myTeam.find(p => p.callingForPass); // Check if anyone is calling
        if (caller && Math.random() < 0.1) { // 10% chance per frame to notice
            this.shoot(ball, caller.x, caller.y, PASS_POWER);
            return;
        }

        // Shoot
        if (distToGoal < 250 && Math.random() < 0.1) {
            this.shoot(ball, goalX, FIELD_HEIGHT / 2);
            return;
        }

        // Pass
        let passProb = 0.05;
        if (this.stats.passFail > this.stats.passSuccess) passProb = 0.02;
        if (Math.random() < passProb) {
            const teammate = myTeam.find(p => p !== this && Math.abs(p.x - goalX) < Math.abs(this.x - goalX));
            if (teammate) {
                this.shoot(ball, teammate.x, teammate.y, PASS_POWER);
                return;
            }
        }

        // Dribble Move
        this.moveTo(goalX, FIELD_HEIGHT / 2, PLAYER_SPEED);
    }

    moveTo(tx, ty, speed) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * 0.5;
        this.vy += Math.sin(angle) * 0.5;

        const mag = Math.hypot(this.vx, this.vy);
        if (mag > speed) {
            this.vx = (this.vx / mag) * speed;
            this.vy = (this.vy / mag) * speed;
        }
    }

    shoot(ball, tx, ty, power = SHOOT_POWER_MAX, curve = 0) {
        // Fix for backwards shooting: Use player position as origin if holding ball
        let originX = ball.x;
        let originY = ball.y;

        if (ball.holder === this) {
            originX = this.x;
            originY = this.y;
            ball.holder = null; // Release ball

            // Spawn ball slightly in front to avoid immediate collision/stuck
            const angle = Math.atan2(ty - originY, tx - originX);
            ball.x = this.x + Math.cos(angle) * (this.radius + ball.radius + 5);
            ball.y = this.y + Math.sin(angle) * (this.radius + ball.radius + 5);
        } else {
            ball.holder = null;
        }

        soundManager.playKick(); // Kick Sound
        let angle = Math.atan2(ty - originY, tx - originX);

        // Auto-Compensate for Curve: Launch slightly opposite to curve direction
        if (curve !== 0) {
            const compensation = curve * 0.2; // 1.5 * 0.2 = 0.3 radians (~17 degrees)
            angle -= compensation;
            power *= 1.2; // Boost power
        }

        let spread = (Math.random() - 0.5) * 0.2;

        // Apply Flow Buffs (Accuracy)
        if (isFlowActive && this.isHuman) {
            spread *= 0.8; // +20% Accuracy (Reduced spread)
        }

        ball.vx = Math.cos(angle + spread) * power;
        ball.vy = Math.sin(angle + spread) * power;
        ball.curve = curve;
        this.stats.shotsTaken++;

        // Energy for Shooting (Increased)
        if (this.isHuman && power > SHOOT_POWER_MAX * 0.8) {
            this.flowEnergy += 15; // +15 (was 10)
        }
    }

    say(text, duration = 60) {
        this.speechBubble = { text: text, timer: duration };
    }

    performKaiserImpact(ball, tx, ty) {
        this.invulnerableTimer = 60; // 1 second of invulnerability

        // Visuals & Sound
        soundManager.playKaiserSound();
        kaiserEffectActive = true;
        setTimeout(() => kaiserEffectActive = false, 500); // Effect lasts 0.5s

        // Speech Bubble (No Pause)
        this.say("Kaiser Impact", 90);

        // Shoot Logic (Modified for Kaiser)
        if (ball.holder === this) {
            ball.holder = null;
            const angle = Math.atan2(ty - this.y, tx - this.x);
            ball.x = this.x + Math.cos(angle) * (this.radius + ball.radius + 10);
            ball.y = this.y + Math.sin(angle) * (this.radius + ball.radius + 10);

            // Kaiser Stats
            const power = SHOOT_POWER_MAX * 3.5; // 3.5x Power
            ball.vx = Math.cos(angle) * power; // Perfectly straight
            ball.vy = Math.sin(angle) * power;
            ball.curve = 0; // No curve

            this.stats.shotsTaken++;
        }
    }

    performMagnusImpact(ball, tx, ty) {
        ball.holder = null; // Release ball
        this.invulnerableTimer = 60;

        // Calculate distance to target
        const dist = Math.hypot(tx - this.x, ty - this.y);

        // Auto-Aim Offset Logic
        // We want the ball to curve INTO the target.
        // If curve is positive (Right Turn), we must aim Left (Negative Offset).
        // Offset roughly proportional to distance and curve strength.
        // Heuristic: offset = -curve * distance * constant
        const curveStrength = 1.5;
        const offset = -curveStrength * (dist / 1000); // e.g., dist 500 -> -0.75 rad (~45 deg)

        const angle = Math.atan2(ty - this.y, tx - this.x) + offset;

        ball.x = this.x + Math.cos(angle) * (this.radius + ball.radius + 10);
        ball.y = this.y + Math.sin(angle) * (this.radius + ball.radius + 10);

        // Magnus Stats
        const power = SHOOT_POWER_MAX * 3.5;
        ball.vx = Math.cos(angle) * power;
        ball.vy = Math.sin(angle) * power;
        ball.curve = curveStrength; // Positive = Right Turn (Down)
        ball.isMagnus = true;

        this.say("Magnus Effect", 90);
        soundManager.playMagnusVoice();
        this.stats.shotsTaken++;
    }

    performBeinschuss(tx, ty) {
        isBeinschussActive = true;
        beinschussTimer = 180; // 3 seconds of slow motion cinematic

        // Speech Bubble
        this.say("Eat this losers", 120);
    }

    checkStuck() {
        const distMoved = Math.hypot(this.x - this.lastPos.x, this.y - this.lastPos.y);
        if (distMoved < 0.5) this.stuckCounter++;
        else this.stuckCounter = 0;

        if (Math.random() < 0.05) this.lastPos = { x: this.x, y: this.y };

        if (this.stuckCounter > 60) {
            this.unstickTimer = 40;
            const angle = Math.random() * Math.PI * 2;
            this.unstickDir = { x: Math.cos(angle), y: Math.sin(angle) };
            this.stuckCounter = 0;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.stunTimer > 0 ? '#555' : (this.isGoalkeeper ? '#ffeb3b' : '#fff'); // Yellow for GK
        ctx.fill();
        ctx.strokeStyle = this.outline;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (this.sliding) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.stroke();
        }

        if (this.isDiving) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius + 10, this.radius, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.isDribbling) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; // Gold aura
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (this.invulnerableTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(6, 182, 212, ${this.invulnerableTimer / 60})`; // Blue fading aura
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        if (this.stunTimer > 0) {
            ctx.fillStyle = 'yellow';
            ctx.fillText('💫', this.x - 5, this.y - 15);
        }

        if (this.callingForPass) {
            ctx.fillStyle = 'white';
            ctx.fillText('✋', this.x - 5, this.y - 25);
        }
    }
}

class Ball extends Entity {
    constructor() {
        super(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, BALL_RADIUS, '#fff');
        this.mass = 1;
        this.holder = null;
        this.lastTouchedBy = null;
        this.curve = 0; // Spin: positive = left curve, negative = right curve
    }

    update() {
        if (this.holder) {
            this.x = this.holder.x + this.holder.vx * 2;
            this.y = this.holder.y + this.holder.vy * 2;
            this.vx = this.holder.vx;
            this.vy = this.holder.vy;
            this.curve = 0; // Reset curve when held

            if (this.holder.stunTimer > 0) {
                this.holder = null;
            }
        } else {
            // Magnus Effect
            if (Math.abs(this.curve) > 0.01) {
                // Force perpendicular to velocity
                // Fx = -curve * Vy, Fy = curve * Vx
                const mag = Math.hypot(this.vx, this.vy);
                if (mag > 0.5) {
                    // Increased multiplier for Magnus Effect
                    const multiplier = this.isMagnus ? 0.12 : 0.035;
                    this.vx += -this.curve * this.vy * multiplier;
                    this.vy += this.curve * this.vx * multiplier;
                    this.curve *= 0.99; // Slower decay
                }
            }
            super.update();
        }

        // Goal check
        if (this.x <= this.radius && this.y > FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2 && this.y < FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2) {
            score.red++;
            aiScoreEl.textContent = score.red;
            startCelebration();
        }
        if (this.x >= FIELD_WIDTH - this.radius && this.y > FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2 && this.y < FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2) {
            score.blue++;
            playerScoreEl.textContent = score.blue;
            startCelebration();
        }
    }

    reset() {
        this.x = FIELD_WIDTH / 2;
        this.y = FIELD_HEIGHT / 2;
        this.vx = 0;
        this.vy = 0;
        this.curve = 0;
        this.isMagnus = false; // Reset Magnus flag
        this.holder = null;
        this.lastTouchedBy = null;
        initTeams();
    }
}

let ball;
let players = [];

function initTeams() {
    players = [];
    // Blue Team (Human + 2 AI + 1 GK)
    players.push(new Player(150, FIELD_HEIGHT / 2, 'blue', true));
    players.push(new Player(100, FIELD_HEIGHT / 3, 'blue'));
    players.push(new Player(100, FIELD_HEIGHT * 2 / 3, 'blue'));
    players.push(new Player(30, FIELD_HEIGHT / 2, 'blue', false, true)); // GK

    // Red Team (3 AI + 1 GK)
    players.push(new Player(FIELD_WIDTH - 150, FIELD_HEIGHT / 2, 'red'));
    players.push(new Player(FIELD_WIDTH - 100, FIELD_HEIGHT / 3, 'red'));
    players.push(new Player(FIELD_WIDTH - 100, FIELD_HEIGHT * 2 / 3, 'red'));
    players.push(new Player(FIELD_WIDTH - 30, FIELD_HEIGHT / 2, 'red', false, true)); // GK
}

function startCelebration() {
    isGoalScored = true;
    celebrationTimer = CELEBRATION_DURATION;
    soundManager.playGoal(); // Goal Sound
    // Spawn confetti
    for (let i = 0; i < 100; i++) {
        confettiParticles.push(new Particle(FIELD_WIDTH / 2, FIELD_HEIGHT / 2));
    }
}

function checkCollisions() {
    // Ball - Goal Post Collision
    GOAL_POSTS.forEach(post => {
        const dx = ball.x - post.x;
        const dy = ball.y - post.y;
        const dist = Math.hypot(dx, dy);
        const minDist = ball.radius + GOAL_POST_RADIUS;

        if (dist < minDist) {
            // Normalize collision vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate ball from post
            const overlap = minDist - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            // Reflect velocity (Elastic Collision)
            // V_new = V - 2(V . N)N
            const dotProduct = ball.vx * nx + ball.vy * ny;
            ball.vx = ball.vx - 2 * dotProduct * nx;
            ball.vy = ball.vy - 2 * dotProduct * ny;

            // Add some energy loss
            ball.vx *= 0.8;
            ball.vy *= 0.8;

            // Play sound (using kick sound for now as impact)
            soundManager.playKick();
        }
    });

    players.forEach(p => {
        if (p.stunTimer > 0) return;

        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < p.radius + ball.radius + 5) {
            if (!ball.holder) {
                ball.holder = p;
                ball.lastTouchedBy = p;
                soundManager.playDribble(); // Touch sound
            }
        }
    });

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const p1 = players[i];
            const p2 = players[j];

            if (p1.stunTimer > 0 || p2.stunTimer > 0) continue;
            // IFrames check
            if (p1.invulnerableTimer > 0 || p2.invulnerableTimer > 0) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);

            if (dist < p1.radius + p2.radius + 5) {
                if (p1.sliding && ball.holder === p2) {
                    resolveTackle(p1, p2);
                }
                else if (p2.sliding && ball.holder === p1) {
                    resolveTackle(p2, p1);
                }
                else {
                    const angle = Math.atan2(dy, dx);
                    const overlap = (p1.radius + p2.radius - dist) / 2;
                    p1.x -= Math.cos(angle) * overlap;
                    p1.y -= Math.sin(angle) * overlap;
                    p2.x += Math.cos(angle) * overlap;
                    p2.y += Math.sin(angle) * overlap;
                }
            }
        }
    }
}

function resolveTackle(tackler, victim) {
    if (victim.isDribbling) {
        tackler.stunTimer = STUN_DURATION;
        tackler.sliding = false;
        soundManager.playTackle(); // Stun sound
    } else {
        victim.stunTimer = STUN_DURATION;
        ball.holder = tackler;
        ball.lastTouchedBy = tackler;
        soundManager.playTackle(); // Steal sound
    }
}

function drawField() {
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(FIELD_WIDTH / 2, 0);
    ctx.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty Areas
    ctx.strokeRect(0, FIELD_HEIGHT / 2 - PENALTY_AREA_HEIGHT / 2, PENALTY_AREA_WIDTH, PENALTY_AREA_HEIGHT);
    ctx.strokeRect(FIELD_WIDTH - PENALTY_AREA_WIDTH, FIELD_HEIGHT / 2 - PENALTY_AREA_HEIGHT / 2, PENALTY_AREA_WIDTH, PENALTY_AREA_HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2, 20, GOAL_HEIGHT);
    ctx.fillRect(FIELD_WIDTH - 20, FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2, 20, GOAL_HEIGHT);

    // Draw Goal Posts
    ctx.fillStyle = 'white';
    GOAL_POSTS.forEach(post => {
        ctx.beginPath();
        ctx.arc(post.x, post.y, GOAL_POST_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
    });
}

function updateGame() {
    if (!gameRunning) return;

    if (impactFrameTimer > 0) {
        impactFrameTimer--;
    }

    // Beinschuss Logic (Slow Motion & Cutscene)
    if (isBeinschussActive) {
        beinschussTimer--;

        // Slow Motion: Only update game logic every 5 frames (0.2x speed)
        if (beinschussTimer % 5 !== 0) {
            return;
        }

        if (beinschussTimer <= 0) {
            isBeinschussActive = false;
            // Teleport ball to goal and score
            if (ball) {
                ball.holder = null;
                ball.x = FIELD_WIDTH - 10; // Inside goal
                ball.y = FIELD_HEIGHT / 2;
                ball.vx = 20; // High speed into net
                ball.vy = 0;
            }
        }
    }

    // Cinematic Freeze
    if (isCinematicActive) {
        cinematicTimer--;
        if (cinematicTimer <= 0) {
            isCinematicActive = false;
            isFlowActive = true;
            flowTimer = FLOW_DURATION;
        }
        return;
    }

    // Flow Logic
    if (isFlowActive) {
        flowTimer--;
        if (flowTimer <= 0 || isGoalScored) {
            isFlowActive = false;
            soundManager.stopFlowAudio(); // Stop audio when Flow ends
            // Reset Energy ONLY if Flow was active and ended naturally or by goal
            const human = players.find(p => p.isHuman);
            if (human) human.flowEnergy = 0;
        }
    }

    if (isGoalScored) {
        celebrationTimer--;
        confettiParticles.forEach((p, index) => {
            p.update();
            if (p.life <= 0) confettiParticles.splice(index, 1);
        });

        if (celebrationTimer <= 0) {
            isGoalScored = false;
            confettiParticles = [];
            ball.reset();
        }
        return; // Pause game physics
    }

    if (isCharging && ball.holder && ball.holder.isHuman) {
        if (shootCharge < 100) shootCharge += 2;
        powerBarFill.style.width = shootCharge + '%';

        // Check for Kaiser Impact Activation
        if (keys.i) {
            const human = ball.holder;
            impactFrameTimer = 15; // Freeze for 15 frames (~250ms)

            // Calculate Aim
            const rect = canvas.getBoundingClientRect();
            const aimX = mouseX - rect.left;
            const aimY = mouseY - rect.top;

            human.performKaiserImpact(ball, aimX, aimY);

            // Reset Charge UI
            isCharging = false;
            shootCharge = 0;
            powerBarContainer.style.display = 'none';
            return;
        }

        // Check for Magnus Impact Activation (U)
        if (keys.u && isFlowActive) {
            const human = ball.holder;
            // Calculate Aim
            const rect = canvas.getBoundingClientRect();
            const aimX = mouseX - rect.left;
            const aimY = mouseY - rect.top;

            human.performMagnusImpact(ball, aimX, aimY);

            // Reset Charge UI
            isCharging = false;
            shootCharge = 0;
            powerBarContainer.style.display = 'none';
            return;
        }
    }

    // Check for Flow Activation
    const human = players.find(p => p.isHuman);
    if (human && keys.g && human.flowEnergy >= FLOW_ENERGY_MAX && !isFlowActive && !isCinematicActive) {
        isCinematicActive = true;
        cinematicTimer = 90; // 1.5 seconds
        soundManager.playFlowIntro();
    }

    // Strategy Toggles
    if (keys.k) teamStrategy = 'ATTACK';
    if (keys.m) teamStrategy = 'DEFEND';

    players.forEach(p => p.update(ball, players));
    ball.update();
    checkCollisions();
}

function drawGame() {
    // Beinschuss Camera Zoom
    if (isBeinschussActive) {
        const player = players.find(p => p.isHuman);
        if (player) {
            ctx.save();
            ctx.translate(FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
            ctx.scale(1.5, 1.5); // Zoom 1.5x
            ctx.translate(-player.x, -player.y);
        }
    }

    // Cinematic Rendering
    if (isCinematicActive) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

        const human = players.find(p => p.isHuman);
        if (human) {
            ctx.save();
            // Zoom effect
            ctx.translate(FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
            ctx.scale(2, 2);
            ctx.translate(-human.x, -human.y);

            // Draw Aura
            ctx.beginPath();
            ctx.arc(human.x, human.y, human.radius + 20, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
            ctx.fill();

            // Fractal-like effect (simplified)
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(human.x, human.y, human.radius + 10 + i * 5, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(6, 182, 212, ${0.5 - i * 0.1})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            human.draw();
            ctx.restore();

            // Text
            ctx.fillStyle = '#06b6d4';
            ctx.font = 'bold 40px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText("KAISER FLOW", FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 100);
        }
        return;
    }

    drawField();

    // Draw Aura if Flow is Active
    if (isFlowActive) {
        const human = players.find(p => p.isHuman);
        if (human) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const pulse = Math.sin(Date.now() / 100) * 5;
            ctx.beginPath();
            ctx.arc(human.x, human.y, human.radius + 15 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    // Metavision Visuals (Defensive)
    const human = players.find(p => p.isHuman);
    if (human && human.passives.includes('METAVISION') && ball.holder !== human) {
        drawMetavisionVisuals(human);
    }

    // Draw Beinschuss Cut Effect
    if (isBeinschussActive) {
        ctx.save();
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 5;
        ctx.beginPath();
        // Random "Cut" lines near the player
        const p = players.find(p => p.isHuman);
        if (p) {
            ctx.moveTo(p.x - 50, p.y - 50);
            ctx.lineTo(p.x + 50, p.y + 50);
            ctx.moveTo(p.x + 50, p.y - 50);
            ctx.lineTo(p.x - 50, p.y + 50);
        }
        ctx.stroke();
        ctx.restore();
    }

    players.forEach(p => p.draw());
    ball.draw();

    // Restore Camera Zoom from Beinschuss
    if (isBeinschussActive) {
        ctx.restore();
    }

    if (isGoalScored) {
        confettiParticles.forEach(p => p.draw());

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, FIELD_HEIGHT / 2 - 50, FIELD_WIDTH, 100);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¡GOL!', FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeText('¡GOL!', FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
    }

    // Draw Strategy Indicator
    ctx.fillStyle = 'white';
    ctx.font = '16px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText(`Estrategia: ${teamStrategy}`, 10, 20);

    if (isCharging && ball.holder && ball.holder.isHuman) {
        const human = players[0];
        const rect = canvas.getBoundingClientRect();
        const aimX = mouseX - rect.left;
        const aimY = mouseY - rect.top;

        // Curve Visualization - STRAIGHT LINE pointing to destination
        let curveColor = `rgba(255, 255, 0, ${shootCharge / 100})`; // Yellow default
        if (keys.q) curveColor = `rgba(0, 255, 255, ${shootCharge / 100})`; // Cyan Left
        if (keys.e) curveColor = `rgba(138, 43, 226, ${shootCharge / 100})`; // Purple Right

        // Predator Eye Logic
        let isPredatorPath = false;
        if (human.passives.includes('PREDATOR_EYE')) {
            // Check for obstructions
            const dist = Math.hypot(aimX - human.x, aimY - human.y);
            const angle = Math.atan2(aimY - human.y, aimX - human.x);
            let blocked = false;

            // Check opponents
            const opponents = players.filter(p => p.team !== human.team);
            for (let opp of opponents) {
                // Simple line-circle intersection check
                // Project opponent onto the line
                const dx = opp.x - human.x;
                const dy = opp.y - human.y;
                const t = (dx * Math.cos(angle) + dy * Math.sin(angle));

                if (t > 0 && t < dist) {
                    const closestX = human.x + t * Math.cos(angle);
                    const closestY = human.y + t * Math.sin(angle);
                    const distToLine = Math.hypot(opp.x - closestX, opp.y - closestY);

                    if (distToLine < opp.radius + 5) { // +5 buffer
                        blocked = true;
                        break;
                    }
                }
            }

            if (!blocked) {
                isPredatorPath = true;
                curveColor = `rgba(255, 215, 0, ${0.5 + shootCharge / 200})`; // Gold
            }
        }

        // Draw Straight Aim Line
        ctx.beginPath();
        ctx.moveTo(human.x, human.y);
        ctx.lineTo(aimX, aimY);
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = isPredatorPath ? 4 : 2;
        ctx.setLineDash(isPredatorPath ? [] : [5, 5]);
        ctx.stroke();

        // Predator Eye Glow
        if (isPredatorPath) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset
        }

        ctx.setLineDash([]);
    }

    // Kaiser Impact Visuals
    if (impactFrameTimer > 0 || kaiserEffectActive) {
        // Blue Flash Overlay
        ctx.fillStyle = `rgba(6, 182, 212, ${impactFrameTimer > 0 ? 0.3 : 0.1})`;
        ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

        // Impact Text
        if (impactFrameTimer > 0) {
            ctx.save();
            ctx.translate(FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
            ctx.rotate(-0.1);
            ctx.fillStyle = '#fff';
            ctx.font = 'italic 900 60px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 20;
            ctx.fillText('KAISER IMPACT', 0, 0);
            ctx.restore();
        }
    }
}



function drawMetavisionVisuals(human) {
    // 1. Grid Aura
    ctx.save();
    ctx.translate(human.x, human.y);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    const step = 20;

    // Draw Grid
    ctx.beginPath();
    for (let i = -gridSize; i <= gridSize; i += step) {
        ctx.moveTo(i, -gridSize);
        ctx.lineTo(i, gridSize);
        ctx.moveTo(-gridSize, i);
        ctx.lineTo(gridSize, i);
    }
    ctx.stroke();

    // Rotating Ring
    ctx.rotate(Date.now() / 1000);
    ctx.beginPath();
    ctx.arc(0, 0, gridSize, 0, Math.PI * 2);
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.restore();

    // 2. Metavision Eye
    ctx.save();
    ctx.translate(human.x, human.y - 40);
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); // Eye shape
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2); // Pupil
    ctx.fill();
    ctx.restore();

    // 3. Tackle Indicator
    if (ball.holder && ball.holder.team !== human.team) {
        const dist = Math.hypot(ball.holder.x - human.x, ball.holder.y - human.y);
        if (dist < 60) { // Tackle Range
            ctx.save();
            ctx.translate(ball.holder.x, ball.holder.y + 20);
            ctx.scale(1, 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 0, ${Math.abs(Math.sin(Date.now() / 200))})`; // Blinking Red
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    // 4. Shot Blocking Lines
    const goalX = human.team === 'blue' ? 0 : FIELD_WIDTH; // Defending Goal
    const postTop = { x: goalX, y: FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2 };
    const postBottom = { x: goalX, y: FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2 };

    [postTop, postBottom].forEach(post => {
        // Check intersection
        const angle = Math.atan2(post.y - ball.y, post.x - ball.x);
        const distToPost = Math.hypot(post.x - ball.x, post.y - ball.y);

        // Project human onto line
        const dx = human.x - ball.x;
        const dy = human.y - ball.y;
        const t = (dx * Math.cos(angle) + dy * Math.sin(angle));

        let isBlocking = false;
        if (t > 0 && t < distToPost) {
            const closestX = ball.x + t * Math.cos(angle);
            const closestY = ball.y + t * Math.sin(angle);
            const distToLine = Math.hypot(human.x - closestX, human.y - closestY);
            if (distToLine < human.radius + 5) isBlocking = true;
        }

        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(post.x, post.y);
        ctx.strokeStyle = isBlocking ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.1)'; // Green if blocking, faint red otherwise
        ctx.lineWidth = isBlocking ? 3 : 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // 5. Ghost Trails (Opponents)
    const opponents = players.filter(p => p.team !== human.team);
    opponents.forEach(opp => {
        if (opp.trail.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(opp.trail[0].x, opp.trail[0].y);
            for (let i = 1; i < opp.trail.length; i++) {
                ctx.lineTo(opp.trail[i].x, opp.trail[i].y);
            }
            ctx.strokeStyle = `rgba(255, 0, 0, 0.3)`; // Faint Red Trail
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    });

    // 6. Speech Bubbles
    players.forEach(p => {
        if (p.speechBubble) {
            ctx.save();
            ctx.font = 'bold 16px Outfit';
            const textWidth = ctx.measureText(p.speechBubble.text).width;
            const bubbleWidth = textWidth + 20;
            const bubbleHeight = 30;
            const x = p.x - bubbleWidth / 2;
            const y = p.y - p.radius - 40;

            // Bubble Background
            ctx.fillStyle = '#0f172a'; // Dark Blue
            ctx.beginPath();
            ctx.roundRect(x, y, bubbleWidth, bubbleHeight, 10);
            ctx.fill();
            ctx.strokeStyle = '#06b6d4'; // Cyan Border
            ctx.lineWidth = 2;
            ctx.stroke();

            // Triangle Tail
            ctx.beginPath();
            ctx.moveTo(p.x - 5, y + bubbleHeight);
            ctx.lineTo(p.x + 5, y + bubbleHeight);
            ctx.lineTo(p.x, y + bubbleHeight + 5);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.strokeStyle = '#06b6d4';
            // ctx.stroke(); // Skip tail border for cleaner look

            // Text
            ctx.fillStyle = '#06b6d4'; // Cyan Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.speechBubble.text, p.x, y + bubbleHeight / 2);
            ctx.restore();
        }
    });
}

function loop() {
    updateGame();
    drawGame();
    requestAnimationFrame(loop);
}

// Input Listeners
window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

// Mouse Listeners for Shooting and Passing
canvas.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('mousedown', e => {
    if (gameRunning) {
        if (ball.holder && ball.holder.isHuman) {
            if (e.button === 0) { // Left click (Shoot)
                isCharging = true;
                chargeType = 'SHOOT';
                shootCharge = 0;
                powerBarContainer.style.display = 'block';
            } else if (e.button === 2) { // Right click (Pass)
                isCharging = true;
                chargeType = 'PASS';
                shootCharge = 0;
                powerBarContainer.style.display = 'block';
            }
        }
    }
});

// Prevent context menu on right click
canvas.addEventListener('contextmenu', event => event.preventDefault());

window.addEventListener('mouseup', e => {
    if (isCharging && gameRunning) {
        if (ball.holder && ball.holder.isHuman) {
            // Release shot/pass
            const human = ball.holder;
            const rect = canvas.getBoundingClientRect();
            const aimX = e.clientX - rect.left;
            const aimY = e.clientY - rect.top;

            // Determine Curve
            let curve = 0;
            if (keys.q) curve = 1.5; // Left Curve
            if (keys.e) curve = -1.5; // Right Curve

            if (chargeType === 'SHOOT') {
                const power = (shootCharge / 100) * SHOOT_POWER_MAX;
                human.shoot(ball, aimX, aimY, power, curve);
            } else if (chargeType === 'PASS') {
                const power = (shootCharge / 100) * PASS_POWER * 1.5; // Up to 1.5x normal pass power
                human.passToTeammate(ball, players, aimX, aimY, power, curve);
            }
        }

        isCharging = false;
        shootCharge = 0;
        powerBarContainer.style.display = 'none';
    }
});

// Start Game
startBtn.addEventListener('click', () => {
    soundManager.init(); // Initialize Audio Context
    if (!gameRunning) {
        gameRunning = true;
        startBtn.textContent = "Reiniciar Partido";
        score = { blue: 0, red: 0 };
        playerScoreEl.textContent = 0;
        aiScoreEl.textContent = 0;
        ball = new Ball();
        initTeams();

        // Show Flow UI
        if (flowBarContainer) flowBarContainer.style.display = 'block';

        loop();
    } else {
        score = { blue: 0, red: 0 };
        playerScoreEl.textContent = 0;
        aiScoreEl.textContent = 0;
        ball = new Ball();
        initTeams();
    }
});

// Initial render
ball = new Ball();
initTeams();
drawGame();
