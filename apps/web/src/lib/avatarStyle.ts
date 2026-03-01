export type AvatarStyle = 'classic' | 'soft' | 'playful';

export const AVATAR_STYLE_OPTIONS: Array<{ value: AvatarStyle; label: string }> = [
  { value: 'classic', label: 'Klassisch' },
  { value: 'soft', label: 'Sanft' },
  { value: 'playful', label: 'Verspielt' },
];

const STORAGE_KEY = 'anni-avatar-style';

function isAvatarStyle(value: string): value is AvatarStyle {
  return AVATAR_STYLE_OPTIONS.some((option) => option.value === value);
}

export function getAvatarStyle(): AvatarStyle {
  if (typeof window === 'undefined') return 'classic';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && isAvatarStyle(saved)) {
    return saved;
  }
  return 'classic';
}

export function setAvatarStyle(style: AvatarStyle): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, style);
}
