import { useState } from 'react';
import { sampleQuestions } from './triviaQuestions';

const QUESTIONS_PER_ROUND = 6;

export default function TriviaGame() {
  const [questions] = useState(() => sampleQuestions(QUESTIONS_PER_ROUND));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const question = questions[current];

  const handleAnswer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setAnswered(null);
      }
    }, 1800);
  };

  const handleRestart = () => {
    // Re-sample a fresh random set of questions
    const fresh = sampleQuestions(QUESTIONS_PER_ROUND);
    questions.splice(0, questions.length, ...fresh);
    setCurrent(0);
    setScore(0);
    setAnswered(null);
    setDone(false);
  };

  if (done) {
    const perfect = score === questions.length;
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-kiosk-2xl">{perfect ? '🎉 Perfekt!' : 'Quiz beendet!'}</p>
        <p className="text-kiosk-xl text-yellow-400">
          {score} / {questions.length} richtig 🏆
        </p>
        {!perfect && (
          <p className="text-kiosk-base text-gray-400">
            {score >= questions.length / 2 ? 'Gut gemacht!' : 'Weiter üben!'}
          </p>
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
    <div className="flex flex-col gap-6 py-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <p className="text-kiosk-base text-gray-400">
          Frage {current + 1} / {questions.length}
        </p>
        <p className="text-kiosk-base text-green-400">✅ {score} richtig</p>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${(current / questions.length) * 100}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={questions.length}
        />
      </div>

      <p className="text-kiosk-lg font-semibold text-white">{question.q}</p>

      <div className="grid grid-cols-2 gap-3">
        {question.answers.map((a, i) => {
          const isCorrect = i === question.correct;
          const isSelected = i === answered;
          let bg = 'bg-gray-700 active:bg-gray-600';
          let icon = '';
          if (answered !== null) {
            if (isCorrect) { bg = 'bg-green-600'; icon = ' ✅'; }
            else if (isSelected) { bg = 'bg-red-600'; icon = ' ❌'; }
          }
          return (
            <button
              key={i}
              aria-label={a}
              aria-pressed={isSelected ? true : undefined}
              disabled={answered !== null}
              className={`min-h-touch rounded-xl p-4 text-kiosk-base text-white transition-colors ${bg} disabled:cursor-default`}
              onClick={() => handleAnswer(i)}
            >
              {a}{icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
