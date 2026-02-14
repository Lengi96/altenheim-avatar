/**
 * Avatar-Modul: SVG-Gesicht mit Animationen
 * Zustände: idle, listening, thinking, speaking
 * Phase 4.10: Smooth Blink + Phase 4.11: Idle-Mikro-Animationen
 */
const Avatar = (() => {
  let state = 'idle';
  let mouthAnimId = null;
  let blinkTimeoutId = null;
  let idleAnimId = null;
  let glowAnimId = null;
  let breathPhase = 0;
  let pupilPhase = 0;
  let initialized = false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SVG_TEMPLATE = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anni Avatar">
      <!-- Zustandsindikator (Leuchten) - hinter dem Kopf -->
      <circle id="state-glow" cx="100" cy="105" r="92" fill="none" stroke="transparent" stroke-width="4" opacity="0.6"/>

      <!-- Haare (hinter dem Kopf) -->
      <ellipse cx="100" cy="55" rx="75" ry="40" fill="#B0BEC5"/>
      <ellipse cx="55" cy="65" rx="25" ry="30" fill="#B0BEC5"/>
      <ellipse cx="145" cy="65" rx="25" ry="30" fill="#B0BEC5"/>
      <ellipse cx="100" cy="45" rx="60" ry="30" fill="#CFD8DC"/>

      <!-- Kopf -->
      <g id="avatar-head">
        <circle cx="100" cy="105" r="85" fill="#FFECD2" stroke="#F0D9B5" stroke-width="2"/>

        <!-- Wangen (Röte) — weich & warm -->
        <circle cx="58" cy="125" r="20" fill="#FFCDD2" opacity="0.45"/>
        <circle cx="142" cy="125" r="20" fill="#FFCDD2" opacity="0.45"/>

        <!-- Linkes Auge -->
        <g id="left-eye">
          <ellipse cx="72" cy="95" rx="14" ry="15" fill="#fff" stroke="#8D6E63" stroke-width="1.5"/>
          <circle cx="72" cy="97" r="9" fill="#8D6E63" id="left-iris"/>
          <circle cx="72" cy="96" r="5" fill="#4E342E" id="left-pupil"/>
          <circle cx="69" cy="92" r="3.5" fill="#fff" opacity="0.9"/>
          <circle cx="75" cy="99" r="1.5" fill="#fff" opacity="0.5"/>
        </g>

        <!-- Rechtes Auge -->
        <g id="right-eye">
          <ellipse cx="128" cy="95" rx="14" ry="15" fill="#fff" stroke="#8D6E63" stroke-width="1.5"/>
          <circle cx="128" cy="97" r="9" fill="#8D6E63" id="right-iris"/>
          <circle cx="128" cy="96" r="5" fill="#4E342E" id="right-pupil"/>
          <circle cx="125" cy="92" r="3.5" fill="#fff" opacity="0.9"/>
          <circle cx="131" cy="99" r="1.5" fill="#fff" opacity="0.5"/>
        </g>

        <!-- Augenbrauen — freundlich hochgezogen -->
        <path d="M55 78 Q72 70 88 78" fill="none" stroke="#9E9E9E" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M112 78 Q128 70 145 78" fill="none" stroke="#9E9E9E" stroke-width="2.5" stroke-linecap="round"/>

        <!-- Nase — kleine runde Nase -->
        <ellipse cx="100" cy="115" rx="4" ry="3.5" fill="#F0C8A0" opacity="0.7"/>

        <!-- Mund — sanftes Lächeln -->
        <path id="mouth" d="M80 138 Q100 152 120 138" fill="#F48FB1" stroke="#EC407A" stroke-width="1.5" stroke-linecap="round"/>

        <!-- Augenlider (für Blinzeln) — mit CSS Transition -->
        <rect id="left-lid" x="56" y="78" width="32" height="0" fill="#FFECD2" rx="2" style="transition: height 80ms ease-in-out"/>
        <rect id="right-lid" x="112" y="78" width="32" height="0" fill="#FFECD2" rx="2" style="transition: height 80ms ease-in-out"/>

        <!-- Brille (optional, freundlicher Look) -->
        <circle cx="72" cy="95" r="18" fill="none" stroke="#90A4AE" stroke-width="1.8" opacity="0.6"/>
        <circle cx="128" cy="95" r="18" fill="none" stroke="#90A4AE" stroke-width="1.8" opacity="0.6"/>
        <line x1="90" y1="95" x2="110" y2="95" stroke="#90A4AE" stroke-width="1.5" opacity="0.6"/>
      </g>
    </svg>
  `;

  function init(containerId) {
    if (initialized) return;
    initialized = true;

    const container = document.getElementById(containerId);
    container.innerHTML = SVG_TEMPLATE;

    if (!prefersReducedMotion) {
      startBlinking();
      startIdleAnimations();
    }
    setState('idle');
  }

  function setState(newState) {
    state = newState;
    const glow = document.getElementById('state-glow');

    // Alle laufenden Animationen stoppen
    if (mouthAnimId) {
      cancelAnimationFrame(mouthAnimId);
      mouthAnimId = null;
    }
    if (glowAnimId) {
      cancelAnimationFrame(glowAnimId);
      glowAnimId = null;
    }

    switch (state) {
      case 'idle':
        resetMouth();
        if (glow) glow.setAttribute('stroke', 'transparent');
        break;
      case 'listening':
        resetMouth();
        if (glow) {
          glow.setAttribute('stroke', '#d32f2f');
          glow.setAttribute('opacity', '0.6');
          pulseGlow(glow);
        }
        break;
      case 'thinking':
        setThinkingMouth();
        if (glow) {
          glow.setAttribute('stroke', '#FFB74D');
          glow.setAttribute('opacity', '0.4');
        }
        break;
      case 'speaking':
        if (glow) {
          glow.setAttribute('stroke', '#81C784');
          glow.setAttribute('opacity', '0.5');
        }
        animateMouth();
        break;
    }
  }

  function resetMouth() {
    const mouth = document.getElementById('mouth');
    if (mouth) {
      mouth.setAttribute('d', 'M80 138 Q100 152 120 138');
      mouth.setAttribute('fill', '#F48FB1');
    }
  }

  function setThinkingMouth() {
    const mouth = document.getElementById('mouth');
    if (mouth) {
      mouth.setAttribute('d', 'M90 142 Q100 148 110 142 Q100 146 90 142');
    }
  }

  function animateMouth() {
    const mouth = document.getElementById('mouth');
    if (!mouth) return;
    if (prefersReducedMotion) {
      mouth.setAttribute('d', 'M80 138 Q100 148 120 138');
      return;
    }

    let phase = 0;
    // Variierende Geschwindigkeit für natürlichere Bewegung
    let speed = 0.12;

    function frame() {
      phase += speed;
      // Variiere Geschwindigkeit leicht
      speed = 0.10 + Math.sin(phase * 0.3) * 0.04;
      const openAmount = Math.abs(Math.sin(phase)) * (7 + Math.sin(phase * 0.7) * 3);
      const y1 = 138 + openAmount;
      mouth.setAttribute('d', `M80 138 Q100 ${y1} 120 138`);

      if (state === 'speaking') {
        mouthAnimId = requestAnimationFrame(frame);
      } else {
        resetMouth();
      }
    }

    mouthAnimId = requestAnimationFrame(frame);
  }

  function pulseGlow(glow) {
    if (prefersReducedMotion) return;
    let phase = 0;
    function frame() {
      phase += 0.03;
      const opacity = 0.3 + Math.sin(phase) * 0.3;
      glow.setAttribute('opacity', String(Math.max(0, opacity)));

      if (state === 'listening') {
        glowAnimId = requestAnimationFrame(frame);
      } else {
        glow.setAttribute('opacity', '0.6');
      }
    }
    glowAnimId = requestAnimationFrame(frame);
  }

  // Phase 4.10: Smooth Blink (mit CSS Transition)
  function startBlinking() {
    function blink() {
      const leftLid = document.getElementById('left-lid');
      const rightLid = document.getElementById('right-lid');
      if (!leftLid || !rightLid) return;

      // CSS transition sorgt für smooth blink
      leftLid.setAttribute('height', '30');
      rightLid.setAttribute('height', '30');

      setTimeout(() => {
        leftLid.setAttribute('height', '0');
        rightLid.setAttribute('height', '0');
      }, 150);

      const nextBlink = 2000 + Math.random() * 4000;
      blinkTimeoutId = setTimeout(blink, nextBlink);
    }

    blinkTimeoutId = setTimeout(blink, 2000);
  }

  // Phase 4.11: Idle-Mikro-Animationen (Atmen + Pupillenbewegung)
  function startIdleAnimations() {
    const head = document.getElementById('avatar-head');
    const leftPupil = document.getElementById('left-pupil');
    const rightPupil = document.getElementById('right-pupil');
    const leftIris = document.getElementById('left-iris');
    const rightIris = document.getElementById('right-iris');

    function animate() {
      breathPhase += 0.012;
      pupilPhase += 0.006;

      // Leichtes Atmen (sehr subtil)
      if (head) {
        const breathOffset = Math.sin(breathPhase) * 0.3;
        head.setAttribute('transform', `translate(0, ${breathOffset})`);
      }

      // Gelegentliche Pupillenbewegung (dezenter als vorher)
      const pupilDrift = Math.sin(pupilPhase) * 0.8;
      if (leftPupil) leftPupil.setAttribute('cx', String(72 + pupilDrift));
      if (rightPupil) rightPupil.setAttribute('cx', String(128 + pupilDrift));
      if (leftIris) leftIris.setAttribute('cx', String(72 + pupilDrift));
      if (rightIris) rightIris.setAttribute('cx', String(128 + pupilDrift));

      idleAnimId = requestAnimationFrame(animate);
    }

    idleAnimId = requestAnimationFrame(animate);
  }

  function getState() {
    return state;
  }

  return { init, setState, getState };
})();
