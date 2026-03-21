import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'Was ist die Hauptstadt von Deutschland?',
    answers: ['Berlin', 'München', 'Hamburg', 'Frankfurt'],
    correct: 0,
  },
  {
    q: 'Wie viele Monate hat ein Jahr?',
    answers: ['10', '11', '12', '13'],
    correct: 2,
  },
  {
    q: 'Welche Farbe hat der Himmel bei gutem Wetter?',
    answers: ['Grün', 'Blau', 'Rot', 'Gelb'],
    correct: 1,
  },
  {
    q: 'Was schwimmt auf dem Wasser?',
    answers: ['Stein', 'Holz', 'Eisen', 'Blei'],
    correct: 1,
  },
];

export default function TriviaGame() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const question = QUESTIONS[current];

  const handleAnswer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= QUESTIONS.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setAnswered(null);
      }
    }, 1500);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-kiosk-2xl">Quiz beendet!</p>
        <p className="text-kiosk-xl text-yellow-400">{score} / {QUESTIONS.length} richtig 🏆</p>
        <button
          className="min-h-touch rounded-2xl bg-blue-600 px-8 py-4 text-kiosk-lg text-white"
          onClick={() => { setCurrent(0); setScore(0); setAnswered(null); setDone(false); }}
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <p className="text-kiosk-sm text-gray-400">Frage {current + 1} / {QUESTIONS.length}</p>
      <p className="text-kiosk-lg font-semibold text-white">{question.q}</p>
      <div className="grid grid-cols-2 gap-3">
        {question.answers.map((a, i) => {
          const isCorrect = i === question.correct;
          const isSelected = i === answered;
          let bg = 'bg-gray-700 active:bg-gray-600';
          if (answered !== null) {
            if (isCorrect) bg = 'bg-green-600';
            else if (isSelected) bg = 'bg-red-600';
          }
          return (
            <button
              key={i}
              className={`min-h-touch rounded-xl p-4 text-kiosk-base text-white ${bg}`}
              onClick={() => handleAnswer(i)}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}
