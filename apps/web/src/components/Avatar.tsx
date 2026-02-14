import { useEffect, useRef } from 'react';

interface AvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: number;
}

export default function Avatar({ state, size = 150 }: AvatarProps) {
  const mouthRef = useRef<SVGPathElement>(null);
  const leftLidRef = useRef<SVGRectElement>(null);
  const rightLidRef = useRef<SVGRectElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const animRef = useRef<number>(0);
  const blinkRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Mund-Animation beim Sprechen
  useEffect(() => {
    if (state !== 'speaking') {
      // Mund zurücksetzen
      if (mouthRef.current) {
        mouthRef.current.setAttribute('d', 'M80 138 Q100 152 120 138');
      }
      return;
    }

    let phase = 0;
    let speed = 0.12;

    function frame() {
      phase += speed;
      speed = 0.1 + Math.sin(phase * 0.3) * 0.04;
      const openAmount = Math.abs(Math.sin(phase)) * (7 + Math.sin(phase * 0.7) * 3);
      const y1 = 138 + openAmount;
      mouthRef.current?.setAttribute('d', `M80 138 Q100 ${y1} 120 138`);
      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [state]);

  // Thinking-Mund
  useEffect(() => {
    if (state === 'thinking' && mouthRef.current) {
      mouthRef.current.setAttribute('d', 'M90 142 Q100 148 110 142 Q100 146 90 142');
    }
  }, [state]);

  // Blink-Animation
  useEffect(() => {
    function blink() {
      leftLidRef.current?.setAttribute('height', '30');
      rightLidRef.current?.setAttribute('height', '30');
      setTimeout(() => {
        leftLidRef.current?.setAttribute('height', '0');
        rightLidRef.current?.setAttribute('height', '0');
      }, 150);
      blinkRef.current = setTimeout(blink, 2000 + Math.random() * 4000);
    }
    blinkRef.current = setTimeout(blink, 2000);
    return () => clearTimeout(blinkRef.current);
  }, []);

  // Idle-Atmen
  useEffect(() => {
    let breathPhase = 0;
    let id: number;

    function animate() {
      breathPhase += 0.012;
      const offset = Math.sin(breathPhase) * 0.3;
      headRef.current?.setAttribute('transform', `translate(0, ${offset})`);
      id = requestAnimationFrame(animate);
    }

    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  // Glow basierend auf State
  const glowColor =
    state === 'listening'
      ? '#d32f2f'
      : state === 'thinking'
        ? '#FFB74D'
        : state === 'speaking'
          ? '#81C784'
          : 'transparent';

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={
        state === 'speaking'
          ? 'Anni Avatar - spricht'
          : state === 'thinking'
            ? 'Anni Avatar - denkt nach'
            : state === 'listening'
              ? 'Anni Avatar - hoert zu'
              : 'Anni Avatar'
      }
      width={size}
      height={size}
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
    >
      {/* Glow */}
      <circle
        ref={glowRef}
        cx="100"
        cy="105"
        r="92"
        fill="none"
        stroke={glowColor}
        strokeWidth="4"
        opacity="0.6"
      />

      {/* Haare */}
      <ellipse cx="100" cy="55" rx="75" ry="40" fill="#B0BEC5" />
      <ellipse cx="55" cy="65" rx="25" ry="30" fill="#B0BEC5" />
      <ellipse cx="145" cy="65" rx="25" ry="30" fill="#B0BEC5" />
      <ellipse cx="100" cy="45" rx="60" ry="30" fill="#CFD8DC" />

      {/* Kopf */}
      <g ref={headRef}>
        <circle cx="100" cy="105" r="85" fill="#FFECD2" stroke="#F0D9B5" strokeWidth="2" />

        {/* Wangen */}
        <circle cx="58" cy="125" r="20" fill="#FFCDD2" opacity="0.45" />
        <circle cx="142" cy="125" r="20" fill="#FFCDD2" opacity="0.45" />

        {/* Linkes Auge */}
        <ellipse cx="72" cy="95" rx="14" ry="15" fill="#fff" stroke="#8D6E63" strokeWidth="1.5" />
        <circle cx="72" cy="97" r="9" fill="#8D6E63" />
        <circle cx="72" cy="96" r="5" fill="#4E342E" />
        <circle cx="69" cy="92" r="3.5" fill="#fff" opacity="0.9" />

        {/* Rechtes Auge */}
        <ellipse cx="128" cy="95" rx="14" ry="15" fill="#fff" stroke="#8D6E63" strokeWidth="1.5" />
        <circle cx="128" cy="97" r="9" fill="#8D6E63" />
        <circle cx="128" cy="96" r="5" fill="#4E342E" />
        <circle cx="125" cy="92" r="3.5" fill="#fff" opacity="0.9" />

        {/* Augenbrauen */}
        <path d="M55 78 Q72 70 88 78" fill="none" stroke="#9E9E9E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M112 78 Q128 70 145 78" fill="none" stroke="#9E9E9E" strokeWidth="2.5" strokeLinecap="round" />

        {/* Nase */}
        <ellipse cx="100" cy="115" rx="4" ry="3.5" fill="#F0C8A0" opacity="0.7" />

        {/* Mund */}
        <path
          ref={mouthRef}
          d="M80 138 Q100 152 120 138"
          fill="#F48FB1"
          stroke="#EC407A"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Augenlider (Blink) */}
        <rect ref={leftLidRef} x="56" y="78" width="32" height="0" fill="#FFECD2" rx="2" style={{ transition: 'height 80ms ease-in-out' }} />
        <rect ref={rightLidRef} x="112" y="78" width="32" height="0" fill="#FFECD2" rx="2" style={{ transition: 'height 80ms ease-in-out' }} />

        {/* Brille */}
        <circle cx="72" cy="95" r="18" fill="none" stroke="#90A4AE" strokeWidth="1.8" opacity="0.6" />
        <circle cx="128" cy="95" r="18" fill="none" stroke="#90A4AE" strokeWidth="1.8" opacity="0.6" />
        <line x1="90" y1="95" x2="110" y2="95" stroke="#90A4AE" strokeWidth="1.5" opacity="0.6" />
      </g>
    </svg>
  );
}
