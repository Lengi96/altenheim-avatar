/**
 * Haupt-App: Verbindet Avatar, Speech und Chat
 * Alle Phasen: Bugfixes, UX, Streaming, Session-Persistenz, Offline
 */
(function () {
  // DOM-Elemente
  const chatArea = document.getElementById('chat-area');
  const textInput = document.getElementById('text-input');
  const btnSend = document.getElementById('btn-send');
  const btnMic = document.getElementById('btn-mic');
  const btnStop = document.getElementById('btn-stop');
  const btnRepeat = document.getElementById('btn-repeat');
  const statusText = document.getElementById('status-text');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const welcomeStartBtn = document.getElementById('welcome-start-btn');
  const btnHelp = document.getElementById('btn-help');
  const helpOverlay = document.getElementById('help-overlay');
  const helpCloseBtn = document.getElementById('help-close-btn');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const modeSwitcher = document.getElementById('mode-switcher');
  const offlineBanner = document.getElementById('offline-banner');
  const avatarContainer = document.getElementById('avatar-container');

  // Settings buttons
  const btnFontDown = document.getElementById('btn-font-down');
  const btnFontUp = document.getElementById('btn-font-up');
  const btnSpeedDown = document.getElementById('btn-speed-down');
  const btnSpeedUp = document.getElementById('btn-speed-up');

  // Zustand
  let currentMode = 'bewohner';
  let chatHistory = [];
  let isProcessing = false;
  let lastBotReply = '';
  let speechSendTimeout = null;
  let inactivityTimer = null;
  let pendingModeSwitch = null;
  const MAX_HISTORY = 40;      // Phase 7.6: Begrenzung
  const INACTIVITY_MS = 5 * 60 * 1000; // Phase 4.8: 5 Minuten

  // ---- Initialisierung ----

  function init() {
    // Welcome-Overlay für wiederkehrende Nutzer überspringen
    if (localStorage.getItem('anni-welcome-done')) {
      welcomeOverlay.style.display = 'none';
    }

    Avatar.init('avatar-container');

    Speech.init({
      onResult: handleSpeechResult,
      onListenStart: () => {
        Avatar.setState('listening');
        btnMic.classList.add('listening');
        btnMic.setAttribute('aria-label', 'Spracheingabe stoppen');
        setStatus('Ich höre zu...');
      },
      onListenEnd: () => {
        btnMic.classList.remove('listening');
        btnMic.setAttribute('aria-label', 'Spracheingabe starten');
        if (!isProcessing) {
          Avatar.setState('idle');
          setStatus(getIdleStatus());
        }
      },
      // Phase 4.4: Mikrofon-Fehler anzeigen
      onListenError: (message) => {
        setStatus(message);
        addBotMessage(message);
      },
      onSpeakStart: () => {
        Avatar.setState('speaking');
        btnStop.style.display = 'flex';
        btnRepeat.style.display = 'none';
      },
      onSpeakEnd: () => {
        btnStop.style.display = 'none';
        if (lastBotReply) btnRepeat.style.display = 'flex';
        if (!isProcessing) {
          Avatar.setState('idle');
          setStatus(getIdleStatus());
        }
      },
    });

    // Mikrofon-Button ausblenden wenn nicht unterstützt oder kein HTTPS
    const isSecureContext = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!Speech.hasRecognition() || !isSecureContext) {
      btnMic.style.display = 'none';
    }

    setupEventListeners();
    restoreSession();        // Phase 6.1
    applyFontSize();         // Phase 4.9
    setupOfflineDetection(); // Phase 6.2
    resetInactivityTimer();  // Phase 4.8

    // Phase 4.7: Tageszeitabhängige Begrüßung
    if (chatHistory.length === 0) {
      addBotMessage(getTimeGreeting());
    }

    setStatus(getIdleStatus());
  }

  // ---- Phase 4.1: Willkommens-Overlay ----

  function handleWelcomeStart() {
    welcomeOverlay.style.display = 'none';
    localStorage.setItem('anni-welcome-done', '1');

    // Jetzt TTS erlaubt (User Interaction geschehen)
    if (chatHistory.length === 0) {
      Speech.speak(getTimeGreeting());
    }
  }

  // ---- Event Listener ----

  function setupEventListeners() {
    // Willkommens-Overlay
    welcomeStartBtn.addEventListener('click', handleWelcomeStart);

    // Senden-Button
    btnSend.addEventListener('click', handleSend);

    // Enter zum Senden
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Mikrofon-Button
    btnMic.addEventListener('click', handleMicToggle);

    // Stopp-Button
    btnStop.addEventListener('click', () => {
      Speech.stopSpeaking();
    });

    // Phase 4.3: Wiederholen-Button
    btnRepeat.addEventListener('click', () => {
      if (lastBotReply) {
        Speech.speak(lastBotReply);
      }
    });

    // Phase 6.3: Hilfe-Button
    btnHelp.addEventListener('click', () => {
      helpOverlay.style.display = 'flex';
      // Hier könnte ein reales Benachrichtigungssystem integriert werden
    });
    helpCloseBtn.addEventListener('click', () => {
      helpOverlay.style.display = 'none';
    });

    // Phase 4.2: Modus-Umschalter (versteckt, Long-Press auf Avatar)
    let longPressTimer = null;
    avatarContainer.addEventListener('pointerdown', () => {
      longPressTimer = setTimeout(() => {
        modeSwitcher.style.display = 'flex';
      }, 3000);
    });
    avatarContainer.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    avatarContainer.addEventListener('pointerleave', () => clearTimeout(longPressTimer));

    // Modus-Umschaltung mit Bestätigungsdialog
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === currentMode) return;

        pendingModeSwitch = mode;
        confirmOverlay.style.display = 'flex';
      });
    });

    confirmYes.addEventListener('click', () => {
      confirmOverlay.style.display = 'none';
      if (pendingModeSwitch) {
        switchMode(pendingModeSwitch);
        pendingModeSwitch = null;
      }
    });

    confirmNo.addEventListener('click', () => {
      confirmOverlay.style.display = 'none';
      pendingModeSwitch = null;
    });

    // Phase 4.9: Einstellungen
    btnFontUp.addEventListener('click', () => changeFontSize(1));
    btnFontDown.addEventListener('click', () => changeFontSize(-1));
    btnSpeedDown.addEventListener('click', () => {
      Speech.setRate(Speech.getRate() - 0.1);
      setStatus(`Sprechtempo: ${Math.round(Speech.getRate() * 100)}%`);
      setTimeout(() => setStatus(getIdleStatus()), 2000);
    });
    btnSpeedUp.addEventListener('click', () => {
      Speech.setRate(Speech.getRate() + 0.1);
      setStatus(`Sprechtempo: ${Math.round(Speech.getRate() * 100)}%`);
      setTimeout(() => setStatus(getIdleStatus()), 2000);
    });

    // Jede Interaktion resettet den Inactivity-Timer
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('keydown', resetInactivityTimer);
  }

  // ---- Modus-Wechsel ----

  function switchMode(mode) {
    currentMode = mode;
    document.body.dataset.mode = mode;

    modeButtons.forEach((b) => {
      const isActive = b.dataset.mode === mode;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });

    chatArea.innerHTML = '';
    chatHistory = [];
    clearSession();

    const greeting = mode === 'bewohner'
      ? 'Hallo! Ich bin Anni. Erzähl mir, wie es dir geht!'
      : 'Pfleger-Modus aktiv. Wie kann ich Ihnen helfen?';

    addBotMessage(greeting);
    Speech.speak(greeting);
    setStatus(getIdleStatus());
  }

  // ---- Senden ----

  function handleSend() {
    const text = textInput.value.trim();
    if (!text || isProcessing) return;

    textInput.value = '';
    sendMessage(text);
  }

  // Phase 7.1: Streaming-fähiger Sende-Mechanismus
  async function sendMessage(text) {
    isProcessing = true;
    btnSend.disabled = true;
    resetInactivityTimer();

    addUserMessage(text);
    Avatar.setState('thinking');
    setStatus('Anni denkt nach...');
    const typingEl = showTypingIndicator();

    // Phase 1.3: AbortController mit Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode: currentMode,
          history: chatHistory.slice(-20),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      removeTypingIndicator(typingEl);

      // Prüfen ob SSE-Stream
      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        // Streaming-Antwort verarbeiten
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = '';
        let botMsgEl = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text') {
                fullReply += data.text;
                if (!botMsgEl) {
                  botMsgEl = addBotMessageStreaming('');
                }
                updateBotMessageStreaming(botMsgEl, fullReply);
              } else if (data.type === 'done') {
                fullReply = data.reply || fullReply;
              } else if (data.type === 'error') {
                if (!botMsgEl) {
                  addBotMessage('Entschuldigung, es gab ein Problem. Versuch es nochmal.');
                }
              }
            } catch (e) {
              // JSON parse Fehler ignorieren (z.B. leere Zeilen)
            }
          }
        }

        if (fullReply) {
          chatHistory.push({ role: 'user', content: text });
          chatHistory.push({ role: 'assistant', content: fullReply });
          trimHistory();
          lastBotReply = fullReply;
          setStatus('Anni spricht...');
          Speech.speak(fullReply);
          saveSession();
        }

      } else {
        // Fallback: JSON-Antwort (z.B. bei Fehlern)
        const data = await response.json();

        if (data.error) {
          addBotMessage(data.error);
          Avatar.setState('idle');
        } else {
          chatHistory.push({ role: 'user', content: text });
          chatHistory.push({ role: 'assistant', content: data.reply });
          trimHistory();
          lastBotReply = data.reply;
          addBotMessage(data.reply);
          setStatus('Anni spricht...');
          Speech.speak(data.reply);
          saveSession();
        }
      }

    } catch (err) {
      clearTimeout(timeoutId);
      removeTypingIndicator(typingEl);

      // Phase 1.3: Timeout-spezifische Fehlermeldung
      if (err.name === 'AbortError') {
        addBotMessage('Das hat leider zu lange gedauert. Bitte versuche es nochmal.');
      } else {
        addBotMessage('Oh, da ist etwas schiefgegangen. Versuch es bitte nochmal.');
      }
      Avatar.setState('idle');
    }

    isProcessing = false;
    btnSend.disabled = false;
  }

  // ---- Spracheingabe ----

  async function handleMicToggle() {
    if (Speech.getIsListening()) {
      Speech.stopListening();
    } else {
      const started = await Speech.startListening();
      if (started) {
        textInput.value = '';
      }
    }
  }

  // Phase 1.2: Race-Condition behoben mit isProcessing-Guard
  function handleSpeechResult(transcript, isFinal) {
    textInput.value = transcript;

    if (isFinal && transcript.trim()) {
      // Vorherigen Timer löschen
      if (speechSendTimeout) clearTimeout(speechSendTimeout);

      speechSendTimeout = setTimeout(() => {
        if (!isProcessing) {
          sendMessage(transcript.trim());
          textInput.value = '';
        }
        speechSendTimeout = null;
      }, 500);

      // Mic stoppen nach finalem Ergebnis
      Speech.stopListening();
    }
  }

  // ---- Chat-UI ----

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.textContent = text;
    chatArea.appendChild(div);
    trimChatDOM();
    scrollToBottom();
  }

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-message bot';

    const name = document.createElement('span');
    name.className = 'sender-name';
    name.textContent = 'Anni';
    div.appendChild(name);

    const content = document.createTextNode(text);
    div.appendChild(content);

    chatArea.appendChild(div);
    trimChatDOM();
    scrollToBottom();
  }

  // Streaming: Bot-Nachricht erstellen und schrittweise füllen
  function addBotMessageStreaming(text) {
    const div = document.createElement('div');
    div.className = 'chat-message bot';

    const name = document.createElement('span');
    name.className = 'sender-name';
    name.textContent = 'Anni';
    div.appendChild(name);

    const contentSpan = document.createElement('span');
    contentSpan.className = 'streaming-content';
    contentSpan.textContent = text;
    div.appendChild(contentSpan);

    chatArea.appendChild(div);
    scrollToBottom();
    return div;
  }

  function updateBotMessageStreaming(msgEl, text) {
    const contentSpan = msgEl.querySelector('.streaming-content');
    if (contentSpan) {
      contentSpan.textContent = text;
      scrollToBottom();
    }
  }

  function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    chatArea.appendChild(div);
    scrollToBottom();
    return div;
  }

  function removeTypingIndicator(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // Phase 7.6: Chat-DOM begrenzen
  function trimChatDOM() {
    const messages = chatArea.querySelectorAll('.chat-message');
    while (messages.length > 60) {
      chatArea.removeChild(messages[0]);
    }
  }

  // ---- History-Management ----

  function trimHistory() {
    while (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }
  }

  // ---- Session-Persistenz (Phase 6.1) ----

  function saveSession() {
    try {
      localStorage.setItem('anni-chat-history', JSON.stringify(chatHistory.slice(-30)));
      localStorage.setItem('anni-mode', currentMode);
    } catch (e) {
      // localStorage voll - kein Problem
    }
  }

  function restoreSession() {
    try {
      const savedHistory = localStorage.getItem('anni-chat-history');
      const savedMode = localStorage.getItem('anni-mode');

      if (savedMode && savedMode !== currentMode) {
        currentMode = savedMode;
        document.body.dataset.mode = savedMode;
        modeButtons.forEach((b) => {
          const isActive = b.dataset.mode === savedMode;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-pressed', String(isActive));
        });
      }

      if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        // Nachrichten in UI wiederherstellen
        for (const msg of chatHistory) {
          if (msg.role === 'user') addUserMessage(msg.content);
          else if (msg.role === 'assistant') addBotMessage(msg.content);
        }
        if (chatHistory.length > 0) {
          const last = chatHistory[chatHistory.length - 1];
          if (last.role === 'assistant') lastBotReply = last.content;
        }
      }
    } catch (e) {
      // Fehler beim Parsen - ignorieren
    }
  }

  function clearSession() {
    localStorage.removeItem('anni-chat-history');
    localStorage.removeItem('anni-mode');
  }

  // ---- Phase 4.9: Schriftgröße ----

  function changeFontSize(direction) {
    const html = document.documentElement;
    const current = parseFloat(getComputedStyle(html).fontSize);
    const newSize = Math.max(12, Math.min(24, current + direction * 2));
    html.style.fontSize = newSize + 'px';
    localStorage.setItem('anni-font-size', String(newSize));
    setStatus(`Schriftgröße: ${Math.round(newSize)}px`);
    setTimeout(() => setStatus(getIdleStatus()), 2000);
  }

  function applyFontSize() {
    const saved = localStorage.getItem('anni-font-size');
    if (saved) {
      document.documentElement.style.fontSize = saved + 'px';
    }
  }

  // ---- Phase 6.2: Offline-Erkennung ----

  function setupOfflineDetection() {
    window.addEventListener('offline', () => {
      offlineBanner.style.display = 'block';
      btnSend.disabled = true;
    });
    window.addEventListener('online', () => {
      offlineBanner.style.display = 'none';
      if (!isProcessing) btnSend.disabled = false;
    });

    // Initialer Check
    if (!navigator.onLine) {
      offlineBanner.style.display = 'block';
      btnSend.disabled = true;
    }
  }

  // ---- Phase 4.8: Inaktivitäts-Reaktivierung ----

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (!isProcessing && chatHistory.length > 0) {
        const nudge = 'Bist du noch da? Ich bin hier, wenn du reden möchtest.';
        addBotMessage(nudge);
        Speech.speak(nudge);
        lastBotReply = nudge;
      }
    }, INACTIVITY_MS);
  }

  // ---- Status & Begrüßung ----

  function setStatus(text) {
    statusText.textContent = text;
  }

  function getIdleStatus() {
    return currentMode === 'bewohner'
      ? 'Ich bin für dich da!'
      : 'Pfleger-Modus - bereit';
  }

  // Phase 4.7: Tageszeitabhängige Begrüßung
  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Guten Morgen! Ich bin Anni, deine Begleiterin. Hast du gut geschlafen?';
    if (hour < 14) return 'Hallo! Ich bin Anni. Wie war das Mittagessen?';
    if (hour < 18) return 'Guten Nachmittag! Ich bin Anni. Wie geht es dir?';
    return 'Guten Abend! Ich bin Anni. Wie war dein Tag?';
  }

  // ---- Global Error Handler ----
  window.onerror = () => {
    // UI in brauchbaren Zustand zurücksetzen
    isProcessing = false;
    btnSend.disabled = false;
    Avatar.setState('idle');
  };

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);
})();
