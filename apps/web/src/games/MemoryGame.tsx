import { useState, useCallback, useEffect, useRef } from 'react';

const EMOJIS = ['🌸', '🌺', '🌼', '🌻', '🍎', '🍊', '🍋', '🍇'];

function makeCards() {
  return [...EMOJIS, ...EMOJIS]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(makeCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleFlip = useCallback(
    (idx: number) => {
      if (selected.length === 2) return;
      const card = cards[idx];
      if (card.flipped || card.matched) return;

      const newCards = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
      const newSelected = [...selected, idx];
      setCards(newCards);
      setSelected(newSelected);

      if (newSelected.length === 2) {
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        const [a, b] = newSelected;
        if (newCards[a].emoji === newCards[b].emoji) {
          const matched = newCards.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          setSelected([]);
          if (matched.every(c => c.matched)) {
            if (timerRef.current) clearInterval(timerRef.current);
            setWon(true);
            setBestMoves(prev => prev === null || nextMoves < prev ? nextMoves : prev);
          }
        } else {
          setTimeout(() => {
            setCards(prev =>
              prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c))
            );
            setSelected([]);
          }, 1000);
        }
      }
    },
    [cards, selected, moves]
  );

  const handleRestart = () => {
    setCards(makeCards());
    setSelected([]);
    setMoves(0);
    setWon(false);
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (won) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-kiosk-2xl">🎉 Gewonnen!</p>
        <p className="text-kiosk-xl text-green-400">{moves} Züge · {formatTime(seconds)}</p>
        {bestMoves !== null && (
          <p className="text-kiosk-base text-yellow-400">🏆 Bestleistung: {bestMoves} Züge</p>
        )}
        <button
          className="min-h-touch rounded-2xl bg-blue-600 px-8 py-4 text-kiosk-lg text-white active:bg-blue-700"
          onClick={handleRestart}
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-sm items-center justify-between text-kiosk-base text-gray-400">
        <span>Züge: <strong className="text-white">{moves}</strong></span>
        <span>⏱ {formatTime(seconds)}</span>
        {bestMoves !== null && <span className="text-yellow-400">🏆 {bestMoves}</span>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <button
            key={card.id}
            aria-label={card.flipped || card.matched ? card.emoji : 'Verdeckte Karte'}
            aria-pressed={card.flipped || card.matched}
            disabled={card.matched || selected.length === 2}
            className={`h-24 w-24 rounded-xl text-5xl shadow-md transition-all duration-200 disabled:cursor-default ${
              card.matched
                ? 'bg-green-700 opacity-60'
                : card.flipped
                ? 'bg-blue-600 scale-105'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => handleFlip(i)}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
