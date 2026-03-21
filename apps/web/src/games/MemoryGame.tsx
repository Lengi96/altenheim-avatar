import { useState, useCallback } from 'react';

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
        setMoves(m => m + 1);
        const [a, b] = newSelected;
        if (newCards[a].emoji === newCards[b].emoji) {
          const matched = newCards.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          setSelected([]);
          if (matched.every(c => c.matched)) setWon(true);
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
    [cards, selected]
  );

  if (won) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-kiosk-2xl">🎉 Gewonnen!</p>
        <p className="text-kiosk-lg text-gray-300">{moves} Züge</p>
        <button
          className="min-h-touch rounded-2xl bg-blue-600 px-8 py-4 text-kiosk-lg text-white"
          onClick={() => { setCards(makeCards()); setSelected([]); setMoves(0); setWon(false); }}
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-kiosk-base text-gray-400">Züge: {moves}</p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <button
            key={card.id}
            className={`h-20 w-20 rounded-xl text-4xl shadow-md transition-all ${
              card.flipped || card.matched ? 'bg-blue-600' : 'bg-gray-700'
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
