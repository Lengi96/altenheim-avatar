export interface TriviaQuestion {
  q: string;
  answers: string[];
  correct: number;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // Geografie
  { q: 'Was ist die Hauptstadt von Deutschland?', answers: ['Berlin', 'München', 'Hamburg', 'Frankfurt'], correct: 0 },
  { q: 'Welcher Fluss fließt durch Wien?', answers: ['Rhein', 'Elbe', 'Donau', 'Main'], correct: 2 },
  { q: 'In welchem Land liegt die Schweizer Stadt Zürich?', answers: ['Österreich', 'Deutschland', 'Schweiz', 'Liechtenstein'], correct: 2 },
  { q: 'Was ist die Hauptstadt von Österreich?', answers: ['Salzburg', 'Graz', 'Wien', 'Innsbruck'], correct: 2 },
  { q: 'Welches Gebirge liegt zwischen Deutschland und Österreich?', answers: ['Schwarzwald', 'Alpen', 'Harz', 'Erzgebirge'], correct: 1 },

  // Natur & Tiere
  { q: 'Was schwimmt auf dem Wasser?', answers: ['Stein', 'Holz', 'Eisen', 'Blei'], correct: 1 },
  { q: 'Welches Tier ist das größte Landsäugetier der Welt?', answers: ['Nilpferd', 'Nashorn', 'Elefant', 'Giraffe'], correct: 2 },
  { q: 'Wie viele Beine hat eine Spinne?', answers: ['6', '8', '10', '12'], correct: 1 },
  { q: 'Welches Tier legt Eier und ist ein Säugetier?', answers: ['Känguru', 'Schnabeltier', 'Fledermaus', 'Delphin'], correct: 1 },
  { q: 'Welche Farbe hat der Himmel bei gutem Wetter?', answers: ['Grün', 'Blau', 'Rot', 'Gelb'], correct: 1 },

  // Alltag & Wissen
  { q: 'Wie viele Monate hat ein Jahr?', answers: ['10', '11', '12', '13'], correct: 2 },
  { q: 'Wie viele Stunden hat ein Tag?', answers: ['20', '22', '24', '26'], correct: 2 },
  { q: 'In welchem Monat feiern wir Weihnachten?', answers: ['November', 'Dezember', 'Januar', 'Februar'], correct: 1 },
  { q: 'Was trinkt man traditionell zum Frühstück in Deutschland?', answers: ['Tee oder Kaffee', 'Saft oder Wasser', 'Milch oder Kakao', 'Alle Antworten stimmen'], correct: 3 },
  { q: 'Welches Instrument hat 88 Tasten?', answers: ['Gitarre', 'Geige', 'Klavier', 'Flöte'], correct: 2 },

  // Geschichte & Kultur
  { q: 'In welchem Jahr endete der Zweite Weltkrieg?', answers: ['1943', '1944', '1945', '1946'], correct: 2 },
  { q: 'Wer schrieb die Oper "Die Zauberflöte"?', answers: ['Beethoven', 'Bach', 'Mozart', 'Haydn'], correct: 2 },
  { q: 'Was war der Beruf von Ludwig van Beethoven?', answers: ['Maler', 'Dichter', 'Komponist', 'Bildhauer'], correct: 2 },
  { q: 'In welchem deutschen Bundesland liegt München?', answers: ['Baden-Württemberg', 'Hessen', 'Bayern', 'Sachsen'], correct: 2 },
  { q: 'Wie heißt der bekannteste Deutschen Weihnachtsmarkt (Stadt)?', answers: ['Frankfurt', 'Hamburg', 'Nürnberg', 'Dresden'], correct: 2 },
];

/** Returns a random sample of `count` questions from the full pool. */
export function sampleQuestions(count: number): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
