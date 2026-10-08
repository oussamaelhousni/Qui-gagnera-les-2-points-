(() => {
  "use strict";

  const LETTERS = ["A", "B", "C", "D"];
  const PRIZES = [100, 200, 500, 1000, 2000, 5000, 10000, 50000, 250000, 1000000];
  const REVEAL_DELAY = 3200;
  const formatNumber = (value) => new Intl.NumberFormat("fr-FR").format(value);
  const $ = (id) => document.getElementById(id);
  const ui = Object.fromEntries([
    "intro", "question-board", "end-board", "question-count", "prize-label", "question-number",
    "question-text", "answers", "feedback", "feedback-text", "suspense-dots", "session-status",
    "dataset-label", "prize-ladder", "primary-button", "primary-label", "secondary-button",
    "action-hint", "fifty-button", "teacher-button", "friend-button", "fifty-state", "teacher-state",
    "friend-state", "import-button", "json-input", "sound-button", "sound-icon", "fullscreen-button",
    "guide-button", "guide-dialog", "close-guide", "confirm-dialog", "confirm-title", "confirm-message",
    "cancel-reset", "confirm-reset", "end-title", "end-description", "end-correct", "end-prize",
    "end-points", "end-icon"
  ].map((id) => [id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), $(id)]));

  let dataset;
  let phase = "ready";
  let questionIndex = 0;
  let correctCount = 0;
  let selected = null;
  let hiddenAnswers = new Set();
  let removalSelection = new Set();
  let selectionBeforeRemoval = null;
  let used = { fifty: false, teacher: false, friend: false };
  let assistance = null;
  let revealTimer = null;
  let confirmationAction = null;
  let dataRevision = 0;
  let notice = null;
  let muted = false;
  let audioContext;
  let masterGain;
  const activeOscillators = new Set();

  // Accept only complete, well-formed games before replacing the current quiz.
  // JSON text is always displayed using textContent, never injected into HTML.
  function normalizeDataset(data, filename = "Mon quiz") {
    const entries = Array.isArray(data) ? data : data?.questions;
    if (!Array.isArray(entries) || entries.length !== 10) {
      throw new Error("Le fichier doit contenir exactement 10 questions dans un tableau « questions ».");
    }
    const questions = entries.map((entry, index) => {
      const prefix = `Question ${index + 1} : `;
      if (!entry || typeof entry !== "object") throw new Error(prefix + "format invalide.");
      const question = entry.question ?? entry.text;
      let options = entry.options ?? entry.answers;
      if (options && !Array.isArray(options) && typeof options === "object") {
        options = LETTERS.map((letter) => options[letter]);
      }
      if (typeof question !== "string" || !question.trim() || question.length > 1500) {
        throw new Error(prefix + "ajoutez un texte non vide (1 500 caractères maximum).");
      }
      if (!Array.isArray(options) || options.length !== 4 || options.some((option) =>
        typeof option !== "string" || !option.trim() || option.length > 500)) {
        throw new Error(prefix + "ajoutez exactement 4 réponses textuelles non vides (500 caractères maximum).");
      }
      let correctIndex;
      if (typeof entry.correctAnswer === "string") {
        correctIndex = LETTERS.indexOf(entry.correctAnswer.trim().toUpperCase());
      } else {
        correctIndex = entry.correctIndex;
      }
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        throw new Error(prefix + "« correctAnswer » doit être A, B, C ou D (ou « correctIndex » un entier de 0 à 3).");
      }
      return {
        question: question.trim(),
        options: options.map((option) => option.trim()),
        correctIndex,
        explanation: typeof entry.explanation === "string" ? entry.explanation.trim().slice(0, 1500) : ""
      };
    });
    return {
      title: typeof data?.title === "string" && data.title.trim() ? data.title.trim().slice(0, 140) : filename,
      demo: data?.demo === true,
      questions
    };
  }

  function getQuestion() { return dataset.questions[questionIndex]; }
  function canChoose() { return phase === "question" || phase === "remove"; }
  function setNotice(text, kind = "bad") { notice = { text, kind }; render(); }

  function resetGame() {
    window.clearTimeout(revealTimer);
    revealTimer = null;
    stopSounds();
    phase = "ready";
    questionIndex = 0;
    correctCount = 0;
    selected = null;
    hiddenAnswers = new Set();
    removalSelection = new Set();
    used = { fifty: false, teacher: false, friend: false };
    assistance = null;
    notice = null;
    document.querySelector(".celebration")?.remove();
    render();
  }

  function startGame() {
    resetGame();
    phase = "question";
    render();
    playSound("start");
    ui.questionText.focus({ preventScroll: true });
  }

  function nextQuestion() {
    if (phase !== "correct") return;
    if (correctCount === 10) {
      phase = "won";
      render();
      return;
    }
    questionIndex += 1;
    phase = "question";
    selected = null;
    hiddenAnswers = new Set();
    removalSelection = new Set();
    notice = null;
    render();
    playSound("next");
    ui.questionText.focus({ preventScroll: true });
  }

  function chooseAnswer(index) {
    if (!canChoose() || hiddenAnswers.has(index)) return;
    notice = null;
    if (phase === "remove") {
      if (removalSelection.has(index)) removalSelection.delete(index);
      else if (removalSelection.size < 2) removalSelection.add(index);
      else return;
    } else {
      selected = index;
    }
    render();
    playSound("select");
  }

  function revealAnswer() {
    if (phase !== "question" || selected === null) return;
    phase = "revealing";
    notice = null;
    render();
    playSound("suspense");
    revealTimer = window.setTimeout(() => {
      revealTimer = null;
      stopSounds();
      if (selected === getQuestion().correctIndex) {
        correctCount += 1;
        phase = "correct";
        render();
        playSound(correctCount === 10 ? "win" : "correct");
        if (correctCount === 10) celebrate();
      } else {
        phase = "wrong";
        render();
        playSound("wrong");
      }
      ui.primaryButton.focus({ preventScroll: true });
    }, REVEAL_DELAY);
  }

  function useLifeline(kind) {
    if (phase !== "question" || used[kind]) return;
    notice = null;
    if (kind === "fifty") {
      phase = "remove";
      selectionBeforeRemoval = selected;
      selected = null;
      removalSelection.clear();
    } else {
      used[kind] = true;
      assistance = kind;
      phase = "assistance";
    }
    render();
    playSound("help");
  }

  function confirmRemoval() {
    if (phase !== "remove" || removalSelection.size !== 2) return;
    // The teacher chooses both answers. Do not secretly auto-pick or reveal the key.
    hiddenAnswers = new Set(removalSelection);
    used.fifty = true;
    phase = "question";
    removalSelection.clear();
    selected = selectionBeforeRemoval !== null && !hiddenAnswers.has(selectionBeforeRemoval)
      ? selectionBeforeRemoval : null;
    selectionBeforeRemoval = null;
    render();
    playSound("help");
  }

  function cancelRemoval() {
    phase = "question";
    selected = selectionBeforeRemoval;
    selectionBeforeRemoval = null;
    removalSelection.clear();
    notice = null;
    render();
  }

  function onPrimary() {
    if (ui.primaryButton.disabled || ui.confirmDialog.open || ui.guideDialog.open) return;
    switch (phase) {
      case "ready": startGame(); break;
      case "question": revealAnswer(); break;
      case "remove": confirmRemoval(); break;
      case "assistance": phase = "question"; assistance = null; render(); break;
      case "correct": nextQuestion(); break;
      case "wrong": phase = "ended"; render(); break;
      case "won": case "ended": resetGame(); break;
    }
  }

  function openConfirmation(action, importing = false) {
    confirmationAction = action;
    ui.confirmTitle.textContent = importing ? "Charger une nouvelle série ?" : "Recommencer la partie ?";
    ui.confirmMessage.textContent = importing
      ? "Cette série remplacera les questions actuelles. La progression et les jokers seront remis à zéro."
      : "La progression et les jokers seront remis à zéro.";
    ui.confirmReset.textContent = importing ? "Charger la série" : "Recommencer";
    ui.confirmDialog.showModal();
    ui.cancelReset.focus();
  }

  function createIcon(id, className = "icon") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#i-${id}`);
    svg.append(use);
    return svg;
  }

  function renderAnswers() {
    const question = getQuestion();
    const revealed = phase === "correct" || phase === "wrong";
    // Keep the controls themselves stable so mouse and keyboard focus survive selection.
    for (let index = 0; index < 4; index += 1) {
      const button = ui.answers.children[index];
      const classes = ["answer"];
      const isCorrect = revealed && index === question.correctIndex;
      const isWrong = phase === "wrong" && index === selected;
      const wasHidden = hiddenAnswers.has(index);
      if (selected === index && !revealed) classes.push("selected");
      if (isCorrect) classes.push("correct");
      if (isWrong) classes.push("incorrect");
      if (phase === "remove" && removalSelection.has(index)) classes.push("marked-removal");
      // Always show the true answer when revealing, even if the teacher hid it.
      if (wasHidden && !revealed) classes.push("removed");
      if (phase === "revealing" && selected === index) classes.push("suspense");
      button.className = classes.join(" ");
      button.disabled = !canChoose() || (wasHidden && !revealed);
      button.setAttribute("aria-pressed", String(phase === "remove" ? removalSelection.has(index) : selected === index));
      button.setAttribute("aria-label", `${LETTERS[index]} : ${question.options[index]}${isCorrect ? ", bonne réponse" : isWrong ? ", réponse incorrecte" : ""}`);
      button.querySelector(".answer-text").textContent = question.options[index];
      button.querySelector(".answer-marker")?.remove();
      if (isCorrect || isWrong || (phase === "remove" && removalSelection.has(index))) {
        button.append(createIcon(isCorrect ? "check" : "close", "icon answer-marker"));
      }
    }
  }

  function renderLadder() {
    const isEnding = phase === "ended" || phase === "won";
    const isPlaying = phase !== "ready" && !isEnding;
    for (const item of ui.prizeLadder.children) {
      const index = Number(item.dataset.index);
      item.className = `prize-step${index === 9 ? " top-step" : ""}`;
      if (index < correctCount) item.classList.add("passed");
      if (isPlaying && index === questionIndex) item.classList.add(phase === "wrong" ? "failed" : "active");
      item.removeAttribute("aria-current");
      if (isPlaying && index === questionIndex) item.setAttribute("aria-current", "step");
      const icon = item.querySelector("use");
      icon.setAttribute("href", index < correctCount ? "#i-check" : index === 9 ? "#i-trophy" : "");
    }
  }

  function getFeedback() {
    if (notice) return notice;
    const explanation = getQuestion().explanation;
    switch (phase) {
      case "ready": return { text: "Choisissez votre élève. Le plateau est prêt.", kind: "" };
      case "question": return { text: selected === null ? "Écoutez votre élève, puis sélectionnez sa réponse." : `Réponse ${LETTERS[selected]} sélectionnée. C’est votre dernier mot ?`, kind: selected === null ? "" : "waiting" };
      case "remove": return { text: `50:50 — Choisissez les deux mauvaises réponses à retirer (${removalSelection.size}/2).`, kind: "waiting" };
      case "assistance": return { text: assistance === "teacher" ? "Le professeur entre en jeu. Donnez votre indice, puis reprenez la question." : "La parole à un ami ! Laissez-le aider votre élève, puis reprenez la question.", kind: "waiting" };
      case "revealing": return { text: `Réponse ${LETTERS[selected]}… le suspense est à son comble.`, kind: "waiting" };
      case "correct": return { text: `${correctCount === 10 ? "Les 10 réponses sont justes ! +2 points remportés." : "Bonne réponse !"}${explanation ? ` ${explanation}` : ""}`, kind: "good" };
      case "wrong": return { text: `La partie s’arrête ici. La bonne réponse était ${LETTERS[getQuestion().correctIndex]} : ${getQuestion().options[getQuestion().correctIndex]}.${explanation ? ` ${explanation}` : ""}`, kind: "bad" };
      case "won": return { text: "Bravo ! Choisissez un autre élève pour le prochain défi.", kind: "good" };
      case "ended": return { text: "Chaque tentative est une occasion d’apprendre. À qui le tour ?", kind: "" };
      default: return { text: "", kind: "" };
    }
  }

  function render() {
    const isEnding = phase === "ended" || phase === "won";
    ui.intro.hidden = phase !== "ready";
    ui.questionBoard.hidden = phase === "ready" || isEnding;
    ui.endBoard.hidden = !isEnding;
    ui.questionCount.textContent = phase === "ready" ? "10 questions · 3 jokers" : isEnding ? "Le bilan de la partie" : `Question ${questionIndex + 1} sur 10`;
    ui.questionNumber.textContent = String(questionIndex + 1).padStart(2, "0");
    ui.questionText.textContent = getQuestion().question;
    ui.prizeLabel.replaceChildren(createIcon("trophy"), document.createTextNode(
      phase === "ready" || isEnding ? "Objectif : 1 000 000" : `Pour ${formatNumber(PRIZES[questionIndex])}`
    ));
    ui.datasetLabel.textContent = dataset.demo ? "Questions de démonstration" : dataset.title;
    ui.datasetLabel.title = dataset.title;
    ui.sessionStatus.textContent = phase === "ready" ? "À vous de jouer" : phase === "revealing" ? "Dernier mot…" : phase === "won" || correctCount === 10 ? "Le million est remporté !" : phase === "wrong" || phase === "ended" ? "Fin de la partie" : "La partie est en cours";
    const feedback = getFeedback();
    ui.feedback.className = `feedback${feedback.kind ? ` ${feedback.kind}` : ""}`;
    ui.feedbackText.textContent = feedback.text;
    ui.suspenseDots.hidden = phase !== "revealing";
    ui.importButton.disabled = phase === "revealing";

    let primaryText = "Commencer la partie";
    let hint = "La récompense : +2 points si tout est juste.";
    let disabled = false;
    switch (phase) {
      case "question": primaryText = "Valider la réponse"; disabled = selected === null; hint = "Choisissez A, B, C ou D, puis validez."; break;
      case "revealing": primaryText = "Suspense…"; disabled = true; hint = "La réponse arrive dans quelques secondes."; break;
      case "correct": primaryText = correctCount === 10 ? "Voir la récompense" : "Question suivante"; hint = correctCount === 10 ? "Objectif atteint : +2 points !" : `${correctCount} bonne${correctCount > 1 ? "s" : ""} réponse${correctCount > 1 ? "s" : ""}. À vous de continuer.`; break;
      case "wrong": primaryText = "Voir le bilan"; hint = "Les +2 points nécessitent 10 bonnes réponses."; break;
      case "remove": primaryText = "Masquer les 2 réponses"; disabled = removalSelection.size !== 2; hint = "Le professeur retire les deux propositions de son choix."; break;
      case "assistance": primaryText = "Reprendre la question"; hint = "Prenez le temps nécessaire pour ce coup de pouce."; break;
      case "won": case "ended": primaryText = "Nouvelle partie"; hint = "Même série, nouveau départ, trois jokers."; break;
    }
    ui.primaryLabel.textContent = primaryText;
    ui.primaryButton.disabled = disabled;
    ui.actionHint.textContent = hint;
    ui.secondaryButton.hidden = phase === "ready" || phase === "revealing" || isEnding;
    ui.secondaryButton.textContent = phase === "remove" ? "Annuler" : "Recommencer";
    for (const kind of ["fifty", "teacher", "friend"]) {
      const button = ui[`${kind}Button`];
      button.disabled = phase !== "question" || used[kind];
      button.classList.toggle("used", used[kind]);
      ui[`${kind}State`].textContent = used[kind] ? "Joker utilisé" : "Disponible";
    }
    if (isEnding) {
      const won = phase === "won";
      ui.endTitle.textContent = won ? "Le million. Et les 2 points !" : "Bien joué. À qui le tour ?";
      ui.endDescription.textContent = won ? "Dix questions, dix bonnes réponses. Une victoire méritée." : `La partie s’est arrêtée à la question ${questionIndex + 1}. Le prochain défi vous attend.`;
      ui.endCorrect.textContent = `${correctCount} / 10`;
      ui.endPrize.textContent = formatNumber(correctCount ? PRIZES[correctCount - 1] : 0);
      ui.endPoints.textContent = won ? "+2 points" : "0 point";
      ui.endIcon.classList.toggle("lost", !won);
      ui.endIcon.replaceChildren(createIcon(won ? "trophy" : "restart"));
    }
    renderAnswers();
    renderLadder();
  }

  // Small original synthesised cues. They start only after a user gesture.
  // No soundtrack, downloads, network or third-party audio is needed.
  function ensureAudio() {
    if (muted) return false;
    try {
      if (!audioContext) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return false;
        audioContext = new AudioCtor();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.10;
        masterGain.connect(audioContext.destination);
      }
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
      return audioContext.state !== "closed";
    } catch { return false; }
  }

  function tone(frequency, delay = 0, duration = 0.18, type = "sine", volume = 0.7) {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(masterGain);
    activeOscillators.add(oscillator);
    oscillator.onended = () => { activeOscillators.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function stopSounds() {
    for (const oscillator of activeOscillators) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    activeOscillators.clear();
  }

  function playSound(kind) {
    if (!ensureAudio()) return;
    try {
      switch (kind) {
        case "select": tone(520, 0, 0.08, "sine", 0.35); break;
        case "next": tone(392, 0, 0.13); tone(523, 0.10, 0.18); break;
        case "start": [261.6, 329.6, 392, 523.3].forEach((f, i) => tone(f, i * 0.12, 0.32)); break;
        case "help": tone(392, 0, 0.2); tone(587, 0.14, 0.25); break;
        case "suspense":
          for (let i = 0; i < 13; i += 1) tone(i % 2 ? 146.8 : 130.8, i * 0.235, 0.18, "triangle", 0.8);
          tone(65.4, 0, 3.1, "sine", 0.6);
          break;
        case "correct": [392, 523.3, 659.3, 784].forEach((f, i) => tone(f, i * 0.13, 0.35)); break;
        case "wrong": [349.2, 293.7, 220, 146.8].forEach((f, i) => tone(f, i * 0.17, 0.4, "triangle")); break;
        case "win": [261.6, 329.6, 392, 523.3, 392, 523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i * 0.13, 0.48)); break;
      }
    } catch { /* The game remains fully usable if audio is unavailable. */ }
  }

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelector(".celebration")?.remove();
    const layer = document.createElement("div");
    layer.className = "celebration";
    layer.setAttribute("aria-hidden", "true");
    const colors = ["#5746c5", "#d9ae40", "#a99bdd", "#15613f"];
    for (let i = 0; i < 52; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.65}s`;
      piece.style.setProperty("--drift", `${Math.random() * 240 - 120}px`);
      piece.style.setProperty("--spin", `${Math.random() * 1080 - 540}deg`);
      layer.append(piece);
    }
    document.body.append(layer);
    window.setTimeout(() => layer.remove(), 4200);
  }

  async function importQuestions(file) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error("Ce fichier est trop volumineux. Utilisez un JSON de moins de 1 Mo.");
      const parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
      const candidate = normalizeDataset(parsed, file.name.replace(/\.json$/i, ""));
      const applyDataset = () => {
        dataRevision += 1;
        dataset = candidate;
        resetGame();
        setNotice(`Série chargée : ${dataset.title}. Les 10 questions sont prêtes.`, "good");
      };
      if (phase !== "ready" && phase !== "ended" && phase !== "won") openConfirmation(applyDataset, true);
      else applyDataset();
    } catch (error) {
      const message = error instanceof SyntaxError ? "Ce fichier n’est pas un JSON valide. Vérifiez les virgules et les guillemets, puis réessayez." : error.message;
      setNotice(`Chargement impossible : ${message} La série actuelle est conservée.`);
    } finally {
      ui.jsonInput.value = "";
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setNotice("Le plein écran n’est pas disponible ici. Utilisez le plein écran de votre navigateur (F11).", "");
    } catch { setNotice("Le navigateur n’a pas autorisé le plein écran. Essayez la touche F11.", ""); }
  }

  for (let i = 0; i < 4; i += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer";
    button.dataset.index = String(i);
    const letter = document.createElement("span");
    letter.className = "answer-letter";
    letter.textContent = LETTERS[i];
    const text = document.createElement("span");
    text.className = "answer-text";
    button.append(letter, text);
    button.addEventListener("click", () => chooseAnswer(i));
    ui.answers.append(button);
  }

  for (let i = 9; i >= 0; i -= 1) {
    const item = document.createElement("li");
    item.dataset.index = String(i);
    item.value = i + 1;
    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = String(i + 1).padStart(2, "0");
    const amount = document.createElement("span");
    amount.className = "step-amount";
    amount.textContent = formatNumber(PRIZES[i]);
    item.append(number, amount, createIcon("trophy", "icon step-indicator"));
    ui.prizeLadder.append(item);
  }

  ui.primaryButton.addEventListener("click", onPrimary);
  ui.secondaryButton.addEventListener("click", () => {
    if (phase === "remove") cancelRemoval();
    else openConfirmation(resetGame);
  });
  ui.fiftyButton.addEventListener("click", () => useLifeline("fifty"));
  ui.teacherButton.addEventListener("click", () => useLifeline("teacher"));
  ui.friendButton.addEventListener("click", () => useLifeline("friend"));
  ui.importButton.addEventListener("click", () => ui.jsonInput.click());
  ui.jsonInput.addEventListener("change", () => importQuestions(ui.jsonInput.files[0]));
  ui.guideButton.addEventListener("click", () => ui.guideDialog.showModal());
  ui.closeGuide.addEventListener("click", () => ui.guideDialog.close());
  ui.cancelReset.addEventListener("click", () => { confirmationAction = null; ui.confirmDialog.close(); });
  ui.confirmReset.addEventListener("click", () => {
    const action = confirmationAction;
    confirmationAction = null;
    ui.confirmDialog.close();
    action?.();
  });
  ui.confirmDialog.addEventListener("cancel", () => { confirmationAction = null; });
  ui.soundButton.addEventListener("click", () => {
    muted = !muted;
    if (muted) stopSounds();
    else playSound("select");
    ui.soundButton.setAttribute("aria-pressed", String(!muted));
    const label = muted ? "Activer les sons" : "Désactiver les sons";
    ui.soundButton.setAttribute("aria-label", label);
    ui.soundButton.title = label;
    ui.soundIcon.setAttribute("href", muted ? "#i-muted" : "#i-sound");
  });
  ui.fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    const label = document.fullscreenElement ? "Quitter le plein écran" : "Passer en plein écran";
    ui.fullscreenButton.setAttribute("aria-label", label);
    ui.fullscreenButton.title = label + " (F)";
  });
  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ui.guideDialog.open || ui.confirmDialog.open) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) || event.target.isContentEditable) return;
    const key = event.key.toUpperCase();
    if (LETTERS.includes(key) && canChoose()) {
      event.preventDefault();
      chooseAnswer(LETTERS.indexOf(key));
    } else if (key === "ENTER" && event.target.tagName !== "BUTTON" && event.target.tagName !== "A") {
      event.preventDefault(); onPrimary();
    } else if (key === "F") {
      event.preventDefault(); toggleFullscreen();
    } else if (key === "ESCAPE" && phase === "remove") cancelRemoval();
  });
  window.addEventListener("pagehide", () => { window.clearTimeout(revealTimer); stopSounds(); });

  // Embedded demo makes double-click/file:// and offline use work immediately.
  // With a local web server, questions.json is also loaded automatically.
  dataset = normalizeDataset(JSON.parse($("demo-questions").textContent));
  render();
  if (location.protocol === "http:" || location.protocol === "https:") {
    fetch("questions.json", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error(`Fichier questions.json introuvable (${response.status}).`); return response.json(); })
      .then((data) => {
        if (dataRevision === 0 && phase === "ready") { dataset = normalizeDataset(data); render(); }
      })
      .catch(() => {
        if (dataRevision === 0 && phase === "ready") setNotice("La série de démonstration est prête. Pour votre propre quiz, cliquez sur « Charger mes questions ».", "");
      });
  }
})();
