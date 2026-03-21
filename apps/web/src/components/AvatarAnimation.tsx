interface Props {
  state: 'idle' | 'listening' | 'speaking';
  name: string;
}

export default function AvatarAnimation({ state, name }: Props) {
  const colors = {
    idle: 'bg-blue-500',
    listening: 'bg-green-500',
    speaking: 'bg-purple-500',
  };

  const animations = {
    idle: 'animate-pulse',
    listening: 'animate-bounce',
    speaking: 'animate-ping',
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <div
          className={`absolute h-48 w-48 rounded-full opacity-30 ${colors[state]} ${animations[state]}`}
        />
        <div className={`h-36 w-36 rounded-full ${colors[state]} flex items-center justify-center shadow-2xl`}>
          <span className="text-6xl">🤖</span>
        </div>
      </div>
      <p className="text-kiosk-base text-gray-300">{name}</p>
    </div>
  );
}
