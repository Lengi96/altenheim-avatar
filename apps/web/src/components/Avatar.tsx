import { useId } from 'react';
import type { AvatarStyle } from '../lib/avatarStyle';

interface AvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: number;
  variant?: AvatarStyle;
}

interface AvatarTheme {
  ring: string;
  hair: string;
  faceA: string;
  faceB: string;
  eye: string;
  mouth: string;
  cheek: string;
  bgA: string;
  bgB: string;
}

const THEMES: Record<AvatarStyle, AvatarTheme> = {
  classic: {
    ring: '#5f8fa3',
    hair: '#8ca7b4',
    faceA: '#ffe7c9',
    faceB: '#f8d8b2',
    eye: '#243746',
    mouth: '#b75b66',
    cheek: '#f4b8be',
    bgA: '#ffffff',
    bgB: '#edf4f8',
  },
  soft: {
    ring: '#8b7bb8',
    hair: '#b4a7d6',
    faceA: '#ffeddc',
    faceB: '#f8dcc7',
    eye: '#3e3356',
    mouth: '#b06a8f',
    cheek: '#f6c5d8',
    bgA: '#fffdfd',
    bgB: '#f4f0ff',
  },
  playful: {
    ring: '#3f9d7a',
    hair: '#59b89c',
    faceA: '#ffe6bf',
    faceB: '#f7d29f',
    eye: '#1f4738',
    mouth: '#b86a42',
    cheek: '#f8c39f',
    bgA: '#ffffff',
    bgB: '#ecfaf4',
  },
};

function getMouth(variant: AvatarStyle, state: AvatarProps['state']): string {
  const map: Record<AvatarStyle, Record<AvatarProps['state'], string>> = {
    classic: {
      idle: 'M72 126 Q100 144 128 126',
      listening: 'M76 127 Q100 140 124 127',
      thinking: 'M84 129 Q100 136 116 129',
      speaking: 'M88 122 Q100 136 112 122 Q100 132 88 122',
    },
    soft: {
      idle: 'M74 125 Q100 139 126 125',
      listening: 'M78 127 Q100 136 122 127',
      thinking: 'M86 129 Q100 134 114 129',
      speaking: 'M90 123 Q100 132 110 123 Q100 130 90 123',
    },
    playful: {
      idle: 'M70 124 Q100 148 130 124',
      listening: 'M74 126 Q100 144 126 126',
      thinking: 'M82 128 Q100 140 118 128',
      speaking: 'M84 120 Q100 140 116 120 Q100 136 84 120',
    },
  };
  return map[variant][state];
}

export default function Avatar({ state, size = 150, variant = 'classic' }: AvatarProps) {
  const stateLabel: Record<AvatarProps['state'], string> = {
    idle: 'Anni Avatar',
    listening: 'Anni Avatar - hoert zu',
    thinking: 'Anni Avatar - denkt nach',
    speaking: 'Anni Avatar - spricht',
  };

  const theme = THEMES[variant];
  const gradientId = useId();
  const faceId = useId();
  const eyeY = state === 'thinking' ? 95 : 98;

  return (
    <div className={`avatar avatar-${state} avatar-${variant}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={stateLabel[state]}
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="44%" r="64%">
            <stop offset="0%" stopColor={theme.bgA} />
            <stop offset="100%" stopColor={theme.bgB} />
          </radialGradient>
          <linearGradient id={faceId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.faceA} />
            <stop offset="100%" stopColor={theme.faceB} />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="92" fill={`url(#${gradientId})`} />
        <circle cx="100" cy="100" r="88" fill="none" stroke={theme.ring} strokeWidth="5" opacity="0.42" />

        {variant === 'classic' && (
          <>
            <ellipse cx="100" cy="86" rx="56" ry="36" fill={theme.hair} />
            <ellipse cx="100" cy="104" rx="60" ry="66" fill={`url(#${faceId})`} />
          </>
        )}

        {variant === 'soft' && (
          <>
            <path d="M48 90 Q72 52 100 60 Q128 52 152 90 Q146 74 130 68 Q100 56 70 68 Q54 74 48 90" fill={theme.hair} />
            <circle cx="100" cy="106" r="58" fill={`url(#${faceId})`} />
            <circle cx="52" cy="92" r="10" fill={theme.hair} opacity="0.9" />
            <circle cx="148" cy="92" r="10" fill={theme.hair} opacity="0.9" />
          </>
        )}

        {variant === 'playful' && (
          <>
            <path d="M42 92 Q58 52 100 52 Q142 52 158 92 L158 102 Q136 82 100 82 Q64 82 42 102 Z" fill={theme.hair} />
            <path d="M60 92 Q100 64 140 92 Q144 132 100 154 Q56 132 60 92" fill={`url(#${faceId})`} />
            <path d="M100 46 L105 58 L118 58 L108 66 L112 78 L100 70 L88 78 L92 66 L82 58 L95 58 Z" fill="#ffd54f" stroke="#f9a825" strokeWidth="1.5" />
          </>
        )}

        {variant !== 'soft' && state === 'thinking' ? (
          <>
            <path d="M64 96 L72 90 L80 96" fill="none" stroke={theme.eye} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M120 96 L128 90 L136 96" fill="none" stroke={theme.eye} strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : variant === 'soft' ? (
          <>
            <path d="M63 100 Q72 92 81 100" fill="none" stroke={theme.eye} strokeWidth="3" strokeLinecap="round" />
            <path d="M119 100 Q128 92 137 100" fill="none" stroke={theme.eye} strokeWidth="3" strokeLinecap="round" />
            {state !== 'thinking' && (
              <>
                <circle cx="72" cy="100" r="2" fill={theme.eye} />
                <circle cx="128" cy="100" r="2" fill={theme.eye} />
              </>
            )}
          </>
        ) : variant === 'playful' ? (
          <>
            <circle cx="72" cy={eyeY} r="9" fill="#fff" />
            <circle cx="128" cy={eyeY} r="9" fill="#fff" />
            <circle cx="72" cy={eyeY + 1} r="5.5" fill={theme.eye} />
            <circle cx="128" cy={eyeY + 1} r="5.5" fill={theme.eye} />
            <circle cx="70" cy={eyeY - 1} r="1.8" fill="#fff" />
            <circle cx="126" cy={eyeY - 1} r="1.8" fill="#fff" />
          </>
        ) : (
          <>
            <circle cx="72" cy={eyeY} r="6.5" fill={theme.eye} />
            <circle cx="128" cy={eyeY} r="6.5" fill={theme.eye} />
          </>
        )}

        {variant === 'playful' && <circle cx="100" cy="114" r="2.4" fill="#d09a73" />}

        <path d={getMouth(variant, state)} fill="none" stroke={theme.mouth} strokeWidth={variant === 'soft' ? 3.2 : 4} strokeLinecap="round" />

        <circle cx="56" cy="120" r={variant === 'playful' ? 12 : 10} fill={theme.cheek} opacity="0.38" />
        <circle cx="144" cy="120" r={variant === 'playful' ? 12 : 10} fill={theme.cheek} opacity="0.38" />

        {variant === 'playful' && (
          <>
            <circle cx="64" cy="120" r="1.5" fill="#d59f7c" opacity="0.7" />
            <circle cx="136" cy="120" r="1.5" fill="#d59f7c" opacity="0.7" />
          </>
        )}

        {state === 'listening' && (
          <>
            <path d="M32 92 Q42 100 32 108" fill="none" stroke={theme.ring} strokeWidth="3" strokeLinecap="round" />
            <path d="M168 92 Q158 100 168 108" fill="none" stroke={theme.ring} strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {state === 'thinking' && (
          <>
            <circle cx="147" cy="50" r="4" fill={theme.ring} opacity="0.8" />
            <circle cx="156" cy="41" r="6" fill={theme.ring} opacity="0.68" />
            <circle cx="168" cy="29" r="8" fill={theme.ring} opacity="0.56" />
          </>
        )}
      </svg>
    </div>
  );
}
