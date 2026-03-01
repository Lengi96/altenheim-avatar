import type { AvatarStyle } from '../lib/avatarStyle';
import { AVATAR_STYLE_OPTIONS } from '../lib/avatarStyle';

interface AvatarStylePickerProps {
  value: AvatarStyle;
  onChange: (style: AvatarStyle) => void;
  id?: string;
  compact?: boolean;
}

export default function AvatarStylePicker({
  value,
  onChange,
  id = 'avatar-style',
  compact = false,
}: AvatarStylePickerProps) {
  return (
    <div className={`avatar-style-picker ${compact ? 'compact' : ''}`}>
      <label htmlFor={id}>Avatar-Stil</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as AvatarStyle)}
        aria-label="Avatar-Stil waehlen"
      >
        {AVATAR_STYLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
