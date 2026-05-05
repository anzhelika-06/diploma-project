import { useEffect, useRef, useState, useCallback } from 'react';
import ecoinsImage from '../assets/images/ecoins.png';
import '../styles/components/PetGame.css';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const GROUND_Y = 230;
const PET_X = 60;
const PET_W = 48;
const PET_H = 48;
const GRAVITY = 1.2;
const JUMP_V = -11.5;
const INITIAL_SPEED = 6;
const W = 620;
const H = 270;

// Obstacle definitions - trees, rocks, flowers, bushes
const OBS_TYPES = [
  { type: 'tree', w: 32, h: 40 },
  { type: 'rock', w: 36, h: 26 },
  { type: 'flower', w: 30, h: 28 },
  { type: 'bush', w: 38, h: 28 },
];

function drawTree(ctx, x) {
  const h = 40;
  // trunk
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x + 12, GROUND_Y - 10, 8, 10);
  // tree layers (3 triangles)
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(x + 16, GROUND_Y - h);
  ctx.lineTo(x + 4, GROUND_Y - h + 13);
  ctx.lineTo(x + 28, GROUND_Y - h + 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.moveTo(x + 16, GROUND_Y - h + 11);
  ctx.lineTo(x + 2, GROUND_Y - h + 24);
  ctx.lineTo(x + 30, GROUND_Y - h + 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#43a047';
  ctx.beginPath();
  ctx.moveTo(x + 16, GROUND_Y - h + 22);
  ctx.lineTo(x, GROUND_Y - 10);
  ctx.lineTo(x + 32, GROUND_Y - 10);
  ctx.closePath();
  ctx.fill();
}

function drawRock(ctx, x) {
  const h = 26;
  // main rock shape
  ctx.fillStyle = '#78909c';
  ctx.beginPath();
  ctx.moveTo(x + 4, GROUND_Y);
  ctx.lineTo(x, GROUND_Y - h * 0.6);
  ctx.lineTo(x + 8, GROUND_Y - h);
  ctx.lineTo(x + 24, GROUND_Y - h + 3);
  ctx.lineTo(x + 34, GROUND_Y - h * 0.5);
  ctx.lineTo(x + 36, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // highlight
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.ellipse(x + 14, GROUND_Y - h + 6, 8, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // shadow
  ctx.fillStyle = '#546e7a';
  ctx.beginPath();
  ctx.ellipse(x + 26, GROUND_Y - h * 0.3, 6, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x) {
  const h = 28;
  // Стебель
  ctx.strokeStyle = '#558b2f';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 15, GROUND_Y);
  ctx.quadraticCurveTo(x + 13, GROUND_Y - h * 0.5, x + 15, GROUND_Y - h + 6);
  ctx.stroke();
  
  // Листья
  ctx.fillStyle = '#7cb342';
  ctx.beginPath();
  ctx.ellipse(x + 8, GROUND_Y - h * 0.4, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 20, GROUND_Y - h * 0.6, 6, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Центр цветка
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.arc(x + 15, GROUND_Y - h + 6, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Семечки в центре
  ctx.fillStyle = '#3e2723';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px = x + 15 + Math.cos(angle) * 2.5;
    const py = GROUND_Y - h + 6 + Math.sin(angle) * 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Лепестки подсолнуха (8 лепестков)
  ctx.fillStyle = '#ffd54f';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(x + 15, GROUND_Y - h + 6);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -7.5, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Светлые блики на лепестках
  ctx.fillStyle = '#ffeb3b';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(x + 15, GROUND_Y - h + 6);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -7.5, 1.8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBush(ctx, x) {
  const h = 28;
  // main bush body
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.ellipse(x + 19, GROUND_Y - h * 0.5, 19, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // left side
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.ellipse(x + 10, GROUND_Y - h * 0.65, 13, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // right side
  ctx.beginPath();
  ctx.ellipse(x + 28, GROUND_Y - h * 0.6, 12, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // top highlight
  ctx.fillStyle = '#43a047';
  ctx.beginPath();
  ctx.ellipse(x + 19, GROUND_Y - h, 10, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // small details
  ctx.fillStyle = '#66bb6a';
  ctx.beginPath();
  ctx.ellipse(x + 14, GROUND_Y - h * 0.7, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 24, GROUND_Y - h * 0.8, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Draw pet on canvas — using proper SVG coordinates
function drawCat(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  const s = 0.3; ctx.scale(s, s);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.ellipse(80, 150, 38, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.ellipse(80, 118, 38, 32, 0, 0, Math.PI * 2); ctx.fill();
  // Belly
  ctx.fillStyle = '#c8956a';
  ctx.beginPath(); ctx.ellipse(80, 122, 22, 19, 0, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.fillStyle = '#6a4220';
  ctx.beginPath(); ctx.ellipse(56, 140, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(104, 140, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.ellipse(56, 138, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(104, 138, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Arms
  ctx.save();
  ctx.translate(42, 118); ctx.rotate(-0.349);
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(118, 118); ctx.rotate(0.349);
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Head
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.ellipse(80, 82, 32, 30, 0, 0, Math.PI * 2); ctx.fill();
  // Ears
  ctx.beginPath(); ctx.arc(52, 62, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(108, 62, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8956a';
  ctx.beginPath(); ctx.arc(52, 62, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(108, 62, 5.5, 0, Math.PI * 2); ctx.fill();
  // Face
  ctx.fillStyle = '#c8956a';
  ctx.beginPath(); ctx.ellipse(80, 90, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#1a1008';
  ctx.beginPath(); ctx.ellipse(66, 80, 5.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(94, 80, 5.5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(64.5, 77.5, 2.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(92.5, 77.5, 2.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0a0804';
  ctx.beginPath(); ctx.ellipse(66, 81, 1.6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(94, 81, 1.6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(65, 78, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(93, 78, 1, 0, Math.PI * 2); ctx.fill();
  // Snout
  ctx.fillStyle = '#b07848';
  ctx.beginPath(); ctx.ellipse(80, 92, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#1a1008';
  ctx.beginPath(); ctx.ellipse(80, 88, 5.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath(); ctx.ellipse(79, 87, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  // Mouth
  ctx.strokeStyle = '#6a3818'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(74, 94); ctx.quadraticCurveTo(80, 100, 86, 94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(80, 92); ctx.lineTo(80, 95); ctx.stroke();
  ctx.restore();
}

function drawFox(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  const s = 0.3; ctx.scale(s, s);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.ellipse(78, 148, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Tail
  ctx.strokeStyle = '#c84010'; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(112, 132); ctx.quadraticCurveTo(148, 114, 142, 84); ctx.quadraticCurveTo(136, 60, 122, 72); ctx.stroke();
  ctx.strokeStyle = '#e06030'; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(112, 132); ctx.quadraticCurveTo(148, 114, 142, 84); ctx.quadraticCurveTo(136, 60, 122, 72); ctx.stroke();
  ctx.strokeStyle = '#e8722a'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(112, 132); ctx.quadraticCurveTo(148, 114, 142, 84); ctx.quadraticCurveTo(136, 60, 122, 72); ctx.stroke();
  // Tail tip
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(122, 72, 10, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5f0e8';
  ctx.beginPath(); ctx.ellipse(122, 72, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body
  ctx.fillStyle = '#e06030';
  ctx.beginPath(); ctx.ellipse(78, 118, 34, 28, 0, 0, Math.PI * 2); ctx.fill();
  // Belly
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath(); ctx.ellipse(78, 122, 19, 16, 0, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.fillStyle = '#c84010';
  ctx.beginPath(); ctx.ellipse(58, 138, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(98, 138, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e06030';
  ctx.beginPath(); ctx.ellipse(58, 136, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(98, 136, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#e06030';
  ctx.beginPath(); ctx.ellipse(78, 80, 30, 28, 0, 0, Math.PI * 2); ctx.fill();
  // Ears
  ctx.fillStyle = '#e06030';
  ctx.beginPath(); ctx.moveTo(54, 66); ctx.lineTo(46, 32); ctx.lineTo(68, 58); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(102, 66); ctx.lineTo(110, 32); ctx.lineTo(88, 58); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.moveTo(55, 64); ctx.lineTo(49, 36); ctx.lineTo(66, 58); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(101, 64); ctx.lineTo(107, 36); ctx.lineTo(90, 58); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(224,96,48,0.3)';
  ctx.beginPath(); ctx.moveTo(56, 63); ctx.lineTo(51, 40); ctx.lineTo(65, 58); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(100, 63); ctx.lineTo(105, 40); ctx.lineTo(91, 58); ctx.closePath(); ctx.fill();
  // Eyes
  ctx.fillStyle = '#2a1a0a';
  ctx.beginPath(); ctx.ellipse(66, 76, 7, 7.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, 76, 7, 7.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(64, 73, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(88, 73, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(66, 77, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, 77, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(65, 74, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(89, 74, 1.2, 0, Math.PI * 2); ctx.fill();
  // Muzzle
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath(); ctx.ellipse(78, 88, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(78, 84, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath(); ctx.ellipse(77, 83, 1.5, 1, 0, 0, Math.PI * 2); ctx.fill();
  // Mouth
  ctx.strokeStyle = '#c84010'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(73, 89); ctx.quadraticCurveTo(78, 94, 83, 89); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(78, 87); ctx.lineTo(78, 90); ctx.stroke();
  // Whiskers
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(44, 86); ctx.lineTo(66, 88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44, 91); ctx.lineTo(66, 91); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(112, 86); ctx.lineTo(90, 88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(112, 91); ctx.lineTo(90, 91); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTurtle(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  const s = 0.3; ctx.scale(s, s);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.ellipse(80, 152, 34, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Tail
  ctx.fillStyle = '#e8e0f0';
  ctx.beginPath(); ctx.arc(112, 128, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5f0ff';
  ctx.beginPath(); ctx.arc(112, 128, 7, 0, Math.PI * 2); ctx.fill();
  // Body
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(78, 118, 36, 28, 0, 0, Math.PI * 2); ctx.fill();
  // Belly
  ctx.fillStyle = '#f0eaf8';
  ctx.beginPath(); ctx.ellipse(76, 122, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.fillStyle = '#c8b8dc';
  ctx.beginPath(); ctx.ellipse(56, 140, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(96, 140, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(56, 138, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(96, 138, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Paws
  ctx.fillStyle = '#c0aed4';
  ctx.beginPath(); ctx.ellipse(50, 143, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, 143, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Arms
  ctx.save();
  ctx.translate(44, 116); ctx.rotate(-0.349);
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(112, 112); ctx.rotate(0.349);
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Neck
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(78, 90, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(78, 76, 26, 24, 0, 0, Math.PI * 2); ctx.fill();
  // Head highlight
  ctx.fillStyle = 'rgba(232,224,244,0.5)';
  ctx.beginPath(); ctx.ellipse(72, 68, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Ears
  ctx.fillStyle = '#d8cce8';
  ctx.beginPath(); ctx.ellipse(62, 42, 9, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(94, 42, 9, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f0a0b8';
  ctx.beginPath(); ctx.ellipse(62, 42, 5, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(94, 42, 5, 22, 0, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#3a1a2a';
  ctx.beginPath(); ctx.ellipse(66, 74, 6, 6.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, 74, 6, 6.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(64.5, 71.5, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(88.5, 71.5, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0a1a';
  ctx.beginPath(); ctx.ellipse(66, 75, 1.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, 75, 1.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(65, 72, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(89, 72, 1.1, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#f08090';
  ctx.beginPath(); ctx.ellipse(78, 82, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  // Mouth
  ctx.strokeStyle = '#d06070'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(74, 85); ctx.quadraticCurveTo(78, 89, 82, 85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(78, 85); ctx.lineTo(78, 82); ctx.stroke();
  // Whiskers
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(46, 80); ctx.lineTo(68, 83); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(46, 84); ctx.lineTo(68, 85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(110, 80); ctx.lineTo(88, 83); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(110, 84); ctx.lineTo(88, 85); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function PetGame({ petType, onClose, onScoreSaved, t }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const ecoImgRef = useRef(null);

  const [phase, setPhase] = useState('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(null);
  const [saving, setSaving] = useState(false);

  // preload ecoins image
  useEffect(() => {
    const img = new Image();
    img.src = ecoinsImage;
    ecoImgRef.current = img;
  }, []);

  const initState = useCallback(() => ({
    petY: GROUND_Y - PET_H,
    velY: 0,
    onGround: true,
    obstacles: [],
    score: 0,
    speed: INITIAL_SPEED,
    frame: 0,
    spawnTimer: 70,
    clouds: [
      { x: 100, y: 28, w: 60 },
      { x: 320, y: 50, w: 80 },
      { x: 530, y: 22, w: 50 },
    ],
  }), []);

  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const saveScore = useCallback(async (finalScore) => {
    if (finalScore < 1) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pet/game/score', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore }),
      });
      const data = await res.json();
      if (data.success) {
        setBestScore(data.best_score);
        setCoinsEarned(data.coins_earned);
        if (onScoreSaved) onScoreSaved(data.eco_coins);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }, [onScoreSaved]);

  const jump = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'idle') {
      stateRef.current = initState();
      setPhase('playing');
      setScore(0);
      setCoinsEarned(null);
      return;
    }
    if (p === 'playing' && stateRef.current?.onGround) {
      stateRef.current.velY = JUMP_V;
      stateRef.current.onGround = false;
    }
    if (p === 'dead') {
      stateRef.current = initState();
      setPhase('playing');
      setScore(0);
      setCoinsEarned(null);
    }
  }, [initState]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

  const drawPet = useCallback((ctx, x, y, frame) => {
    const bounce = phaseRef.current === 'playing' ? Math.sin(frame * 0.25) * 1.5 : 0;
    if (petType === 'fox') drawFox(ctx, x, y + bounce);
    else if (petType === 'turtle') drawTurtle(ctx, x, y + bounce);
    else drawCat(ctx, x, y + bounce);
  }, [petType]);

  const drawObs = useCallback((ctx, obs) => {
    if (obs.type === 'tree') drawTree(ctx, obs.x);
    else if (obs.type === 'rock') drawRock(ctx, obs.x);
    else if (obs.type === 'flower') drawFlower(ctx, obs.x);
    else drawBush(ctx, obs.x);
  }, []);

  // game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const s = stateRef.current;
      const p = phaseRef.current;
      if (!s) { rafRef.current = requestAnimationFrame(loop); return; }

      ctx.clearRect(0, 0, W, H);

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#b3e5fc');
      sky.addColorStop(1, '#e8f5e9');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // clouds
      s.clouds.forEach(c => {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x - 18, c.y + 6, c.w / 3, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x + 18, c.y + 6, c.w / 3, 10, 0, 0, Math.PI * 2); ctx.fill();
      });

      // ground
      ctx.fillStyle = '#8bc34a'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = '#558b2f'; ctx.fillRect(0, GROUND_Y, W, 4);

      // score
      ctx.fillStyle = '#2e7d32';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.floor(s.score)), W - 16, 26);
      ctx.textAlign = 'left';

      if (p === 'idle') {
        drawPet(ctx, PET_X, s.petY, s.frame);
        ctx.fillStyle = '#1b5e20';
        ctx.font = 'bold 19px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t ? t('petGameStart') : 'Нажми пробел или тапни чтобы начать', W / 2, 115);
        ctx.font = '14px sans-serif';
        ctx.fillText(t ? t('petGameHint') : 'Прыгай через препятствия!', W / 2, 140);
        ctx.textAlign = 'left';
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (p === 'playing') {
        s.frame++;
        // score grows over time
        s.score += 0.15 * (s.speed / INITIAL_SPEED);
        // speed increases gradually
        s.speed = INITIAL_SPEED + Math.floor(s.score / 15) * 0.25;
        setScore(Math.floor(s.score));

        // clouds scroll
        s.clouds.forEach(c => { c.x -= 0.8; if (c.x < -80) c.x = W + 80; });

        // gravity
        s.velY += GRAVITY;
        s.petY += s.velY;
        if (s.petY >= GROUND_Y - PET_H) {
          s.petY = GROUND_Y - PET_H;
          s.velY = 0;
          s.onGround = true;
        }

        // spawn
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          const def = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
          s.obstacles.push({ ...def, x: W + 10 });
          const minGap = Math.max(28, 50 - Math.floor(s.speed * 2.2));
          s.spawnTimer = minGap + Math.floor(Math.random() * 32);
        }

        // move obstacles + collision
        s.obstacles = s.obstacles.filter(o => o.x > -60);
        let hit = false;
        s.obstacles.forEach(o => {
          o.x -= s.speed;
          drawObs(ctx, o);
          if (hit) return;
          // hitbox
          const px = PET_X + 10, py = s.petY + 8, pw = PET_W - 20, ph = PET_H - 12;
          const ox = o.x + 5, oy = GROUND_Y - o.h + 5, ow = o.w - 10, oh = o.h - 5;
          if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
            hit = true;
          }
        });

        drawPet(ctx, PET_X, s.petY, s.frame);

        if (hit) {
          const finalScore = Math.floor(s.score);
          setPhase('dead');
          saveScore(finalScore);
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (p === 'dead') {
        drawPet(ctx, PET_X, s.petY, 0);
        s.obstacles.forEach(o => drawObs(ctx, o));

        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t ? t('petGameOver') : 'Игра окончена!', W / 2, 82);

        ctx.font = '17px sans-serif';
        ctx.fillText(`${t ? t('petGameScore') : 'Счёт'}: ${Math.floor(s.score)}`, W / 2, 112);
        if (bestScore > 0) {
          ctx.fillText(`${t ? t('petGameBest') : 'Рекорд'}: ${bestScore}`, W / 2, 136);
        }

        if (coinsEarned !== null) {
          const ecoImg = ecoImgRef.current;
          const label = coinsEarned > 0
            ? `+${coinsEarned} ${t ? t('petGameCoinsEarned') : 'экоинов получено!'}`
            : (t ? t('petGameCoinsAlready') : 'Экоины уже получены сегодня');
          ctx.fillStyle = coinsEarned > 0 ? '#ffd600' : '#bbb';
          ctx.font = '15px sans-serif';
          if (coinsEarned > 0 && ecoImg?.complete) {
            const tw = ctx.measureText(label).width;
            const startX = W / 2 - tw / 2 - 12;
            ctx.fillText(label, W / 2 + 12, 162);
            ctx.drawImage(ecoImg, startX, 148, 20, 20);
          } else {
            ctx.fillText(label, W / 2, 162);
          }
        }

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '13px sans-serif';
        ctx.fillText(t ? t('petGameRestart') : 'Нажми пробел или тапни для рестарта', W / 2, 210);
        ctx.textAlign = 'left';
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawPet, drawObs, saveScore, bestScore, coinsEarned, t]);

  return (
    <div className="pet-game-wrap">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="pet-game-canvas"
        onClick={jump}
        onTouchStart={(e) => { e.preventDefault(); jump(); }}
      />
      {saving && <div className="pet-game-saving">...</div>}
    </div>
  );
}
