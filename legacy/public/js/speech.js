/**
 * Speech-Modul: Web Speech API für STT und TTS (Deutsch)
 * Phase 1.4: isCancelling Flag für sauberen Stop
 * Phase 1.5: speechSynthesis Existenz-Check
 * Phase 4.4: Fehler-Callbacks
 * Phase 4.5: Chrome TTS 15s-Bug Workaround
 */
const Speech = (() => {
  let recognition = null;
  let isListening = false;
  let selectedVoice = null;
  let isCancelling = false;
  let resumeInterval = null;

  // Phase 1.5: TTS Verfügbarkeit prüfen
  const hasTTS = typeof speechSynthesis !== 'undefined';

  // Chrome-Erkennung (für TTS 15s-Bug Workaround)
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);

  // Einstellungen (Phase 4.9)
  let speechRate = parseFloat(localStorage.getItem('anni-speech-rate')) || 0.85;
  let speechVolume = parseFloat(localStorage.getItem('anni-speech-volume')) || 1.0;

  // Callbacks
  let onResult = null;
  let onListenStart = null;
  let onListenEnd = null;
  let onListenError = null;
  let onSpeakStart = null;
  let onSpeakEnd = null;

  function init(callbacks = {}) {
    onResult = callbacks.onResult || null;
    onListenStart = callbacks.onListenStart || null;
    onListenEnd = callbacks.onListenEnd || null;
    onListenError = callbacks.onListenError || null;
    onSpeakStart = callbacks.onSpeakStart || null;
    onSpeakEnd = callbacks.onSpeakEnd || null;

    initRecognition();
    if (hasTTS) loadVoices();
  }

  // ---- Speech-to-Text ----

  function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition wird von diesem Browser nicht unterstützt.');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true; // Phase 4: Langsame Sprecher nicht abschneiden
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      if (onListenStart) onListenStart();
    };

    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }

      if (onResult) onResult(transcript, isFinal);
    };

    // Phase 4.4: Detaillierte Fehlerbehandlung
    recognition.onerror = (event) => {
      console.warn('Spracherkennung Fehler:', event.error);
      isListening = false;

      const errorMessages = {
        'not-allowed': 'Bitte erlaube das Mikrofon in deinem Browser.',
        'no-speech': 'Ich konnte nichts hören. Bitte sprich nochmal.',
        'network': 'Es gibt ein Netzwerk-Problem. Bitte prüfe deine Verbindung.',
        'audio-capture': 'Kein Mikrofon gefunden. Bitte schließe eines an.',
        'aborted': null, // Stille Behandlung bei Abbruch
      };

      const message = errorMessages[event.error];
      if (message && onListenError) {
        onListenError(message);
      }

      if (onListenEnd) onListenEnd();
    };

    recognition.onend = () => {
      isListening = false;
      if (onListenEnd) onListenEnd();
    };
  }

  async function startListening() {
    if (!recognition) {
      console.warn('Spracherkennung nicht verfügbar.');
      if (onListenError) onListenError('Spracherkennung wird von diesem Browser nicht unterstützt.');
      return false;
    }

    // HTTPS-Check (Speech API braucht HTTPS außer auf localhost)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      if (onListenError) onListenError('Spracherkennung braucht eine sichere Verbindung (HTTPS).');
      return false;
    }

    // Mikrofon-Berechtigung explizit anfordern
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      console.warn('Mikrofon-Berechtigung verweigert:', permErr);
      if (onListenError) onListenError('Bitte erlaube das Mikrofon in deinem Browser.');
      return false;
    }

    // TTS stoppen falls aktiv
    stopSpeaking();

    try {
      recognition.start();
      return true;
    } catch (e) {
      console.warn('Spracherkennung konnte nicht gestartet werden:', e);
      if (onListenError) onListenError('Spracherkennung konnte nicht gestartet werden. Bitte versuche es nochmal.');
      return false;
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      recognition.stop();
    }
  }

  function getIsListening() {
    return isListening;
  }

  function hasRecognition() {
    return recognition !== null;
  }

  // ---- Text-to-Speech ----

  function loadVoices() {
    if (!hasTTS) return;

    function setVoice() {
      const voices = speechSynthesis.getVoices();
      selectedVoice =
        voices.find(v => v.lang === 'de-DE' && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang === 'de-DE') ||
        voices.find(v => v.lang.startsWith('de')) ||
        null;
    }

    setVoice();
    // addEventListener statt property assignment (robuster)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.addEventListener('voiceschanged', setVoice);
    }
  }

  /**
   * Text vorlesen. Lange Texte werden in Sätze aufgeteilt.
   */
  function speak(text) {
    if (!text || !hasTTS) {
      // Ohne TTS: Callbacks trotzdem feuern damit UI-Flow weitergeht
      if (!hasTTS) {
        if (onSpeakStart) onSpeakStart();
        setTimeout(() => { if (onSpeakEnd) onSpeakEnd(); }, 100);
      }
      return;
    }

    stopSpeaking();
    isCancelling = false;

    const sentences = splitIntoSentences(text);
    if (onSpeakStart) onSpeakStart();

    let index = 0;

    // Phase 4.5: Chrome TTS 15s-Bug Workaround (nur Chrome)
    if (isChrome) {
      resumeInterval = setInterval(() => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause();
          speechSynthesis.resume();
        }
      }, 10000);
    }

    function speakNext() {
      if (index >= sentences.length) {
        clearResumeInterval();
        if (onSpeakEnd) onSpeakEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.lang = 'de-DE';
      utterance.rate = speechRate;
      utterance.pitch = 1.05;
      utterance.volume = speechVolume;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        index++;
        speakNext();
      };

      // Phase 1.4: isCancelling-Check in onerror
      utterance.onerror = (e) => {
        if (isCancelling) return;
        console.warn('TTS Fehler:', e);
        index++;
        speakNext();
      };

      speechSynthesis.speak(utterance);
    }

    speakNext();
  }

  // Phase 1.4: Sauberer Stop mit isCancelling Flag
  function stopSpeaking() {
    if (!hasTTS) return;

    clearResumeInterval();

    if (speechSynthesis.speaking || speechSynthesis.pending) {
      isCancelling = true;
      speechSynthesis.cancel();
      isCancelling = false;
      if (onSpeakEnd) onSpeakEnd();
    }
  }

  function clearResumeInterval() {
    if (resumeInterval) {
      clearInterval(resumeInterval);
      resumeInterval = null;
    }
  }

  function isSpeaking() {
    if (!hasTTS) return false;
    return speechSynthesis.speaking;
  }

  // Phase 4.9: Sprechgeschwindigkeit / Lautstärke ändern
  function setRate(rate) {
    speechRate = Math.max(0.5, Math.min(1.5, rate));
    localStorage.setItem('anni-speech-rate', String(speechRate));
  }

  function getRate() {
    return speechRate;
  }

  function setVolume(vol) {
    speechVolume = Math.max(0.3, Math.min(1.0, vol));
    localStorage.setItem('anni-speech-volume', String(speechVolume));
  }

  function getVolume() {
    return speechVolume;
  }

  /**
   * Text in Sätze/Chunks aufteilen (max ~180 Zeichen pro Chunk)
   */
  function splitIntoSentences(text) {
    const raw = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks = [];

    for (const sentence of raw) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if (trimmed.length <= 180) {
        chunks.push(trimmed);
      } else {
        const parts = trimmed.split(/,\s*/);
        let current = '';
        for (const part of parts) {
          if ((current + ', ' + part).length > 180 && current) {
            chunks.push(current.trim());
            current = part;
          } else {
            current = current ? current + ', ' + part : part;
          }
        }
        if (current.trim()) chunks.push(current.trim());
      }
    }

    return chunks.length > 0 ? chunks : [text];
  }

  return {
    init,
    startListening,
    stopListening,
    getIsListening,
    hasRecognition,
    speak,
    stopSpeaking,
    isSpeaking,
    setRate,
    getRate,
    setVolume,
    getVolume,
  };
})();
