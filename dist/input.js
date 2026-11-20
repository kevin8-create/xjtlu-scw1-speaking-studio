(() => {
  "use strict";

  const storageKey = "scw1-reading-listening-v1";
  const dayMs = 86400000;
  const types = ["reading", "listening"];
  let inMemory = {};
  let memoryOnly = false;

  function readState() {
    if (!memoryOnly) {
      try {
        const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
        if (value && typeof value === "object" && !Array.isArray(value)) inMemory = value;
      } catch { memoryOnly = true; }
    }
    return inMemory;
  }
  function writeState(next) {
    inMemory = next;
    if (!memoryOnly) {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); }
      catch { memoryOnly = true; }
    }
  }
  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function dayOfPlan(today, start) {
    const timestamp = date => Date.parse(date + "T00:00:00Z");
    const offset = Math.floor((timestamp(today) - timestamp(start)) / dayMs);
    return Number.isFinite(offset) ? Math.max(1, Math.min(14, offset + 1)) : 1;
  }
  function validDay(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= window.SCW_DAYS.length ? number : null;
  }
  function attemptKey(day, type) { return day + "-" + type; }
  function readAttempt(state, day, type) {
    const stored = state.work?.[attemptKey(day, type)] || {};
    const task = window.SCW_DAYS[day - 1][type];
    const choices = task.questions.map((question, i) => {
      const value = stored.choices?.[i];
      return Number.isInteger(value) && value >= 0 && value < question.options.length ? value : null;
    });
    const submitted = stored.submitted === true && choices.every(value => value !== null);
    return {choices, submitted, textMode: stored.textMode === true};
  }
  function saveAttempt(day, type, attempt) {
    const state = readState();
    writeState({...state, work: {...state.work, [attemptKey(day, type)]: attempt}});
  }
  function score(task, attempt) {
    return task.questions.reduce((count, question, i) => count + Number(attempt.choices[i] === question.correct), 0);
  }
  function paragraphs(text) {
    return String(text).split(/\n+/).filter(Boolean).map(line => '<p lang="en">' + escape(line) + '</p>').join("");
  }
  function quiz(day, type, attempt) {
    const task = window.SCW_DAYS[day - 1][type];
    const items = task.questions.map((question, index) => {
      const selected = attempt.choices[index];
      const options = question.options.map((option, optionIndex) => {
        const checked = selected === optionIndex;
        const correct = optionIndex === question.correct;
        let marker = "";
        if (attempt.submitted && correct) marker = '<small class="in-key">正确 / Correct</small>';
        else if (attempt.submitted && checked) marker = '<small class="in-yours">你的选择 / Your choice</small>';
        return '<label class="in-option' + (marker && correct ? " in-correct" : "") + '">' +
          '<input type="radio" data-input-q="' + index + '" name="in-' + day + '-' + type + '-' + index + '" value="' +
          optionIndex + '"' + (checked ? " checked" : "") + (attempt.submitted ? " disabled" : "") + '>' +
          '<span lang="en">' + escape(option) + '</span>' + marker + '</label>';
      }).join("");
      const explanation = attempt.submitted ? '<p class="in-evidence"><strong>依据 / Evidence</strong><br>' +
        escape(question.why) + '</p>' : "";
      return '<fieldset class="in-question"><legend><span>Q' + (index + 1) + '</span> ' +
        escape(question.q) + '</legend>' + options + explanation + '</fieldset>';
    }).join("");
    const total = task.questions.length;
    const result = attempt.submitted ? '<p class="in-result" role="status" tabindex="-1"><strong>' +
      score(task, attempt) + ' / ' + total + '</strong> 道正确 / correct</p>' : "";
    const control = attempt.submitted ?
      '<button class="btn quiet small" type="button" data-input-action="retry">重做本项 / Retry this section</button>' :
      '<button class="btn primary" type="button" data-input-action="submit">提交本项并看解析 / Check answers</button>';
    return result + items + '<p class="in-alert" data-input-alert role="status" aria-live="polite"></p>' + control;
  }
  function transcript(task, attempt) {
    if (attempt.submitted || attempt.textMode) {
      return '<details class="answer-details in-transcript"' + (attempt.textMode ? " open" : "") +
        '><summary>听力原文 / Transcript</summary>' + paragraphs(task.text) + '</details>';
    }
    return '<p class="translation">交卷后可核对听力原文。 / Review the transcript after submitting.</p>' +
      '<button type="button" class="btn quiet small" data-input-action="text-mode">需要文字辅助 / Use transcript mode</button>';
  }
  function renderPane(day, type, entry, state) {
    const task = entry[type];
    const attempt = readAttempt(state, day, type);
    const isListening = type === "listening";
    const media = '<div class="in-audio"><audio controls preload="none" aria-label="Day ' + day +
      ' 英语听力 / English listening" src="./audio/day-' + String(day).padStart(2, "0") +
      '.mp3">此浏览器无法播放音频。 / Audio playback unavailable.</audio>' +
      '<p class="in-alert" data-audio-error role="status" aria-live="polite"></p></div>';
    const content = isListening ? media + '<div data-input-transcript>' + transcript(task, attempt) + '</div>' :
      '<div class="in-passage">' + paragraphs(task.text) + '</div>';
    return '<article class="panel in-pane" data-input-type="' + type + '"><p class="eyebrow">' +
      (isListening ? "听力 / LISTENING" : "阅读 / READING") + '</p><h2 lang="en">' + escape(task.title) +
      '</h2>' + content + '<div class="in-quiz" data-input-quiz>' + quiz(day, type, attempt) + '</div></article>';
  }
  function renderDay(day, today, start) {
    const state = readState();
    const entry = window.SCW_DAYS[day - 1];
    const options = window.SCW_DAYS.map((item, index) => {
      const number = index + 1;
      const complete = types.every(type => readAttempt(state, number, type).submitted);
      return '<option value="' + number + '"' + (day === number ? " selected" : "") + '>Day ' +
        number + ' · ' + escape(item.title) + (complete ? ' · ✓' : '') + '</option>';
    }).join("");
    return '<header class="page-head"><p class="eyebrow">DAILY READING &amp; LISTENING</p><h1>每日读听练习</h1>' +
      '<p>每天读一篇、听一段，各答三题，再把一个表达用在口语里。 / Read one passage, listen to one recording, answer three questions for each, then reuse a phrase aloud.</p></header>' +
      '<div class="in-picker"><label for="in-day"><strong>选择练习日 / Choose a day</strong></label>' +
      '<select id="in-day" data-input-day>' + options + '</select><p class="translation">计划第 ' +
      dayOfPlan(today, start) + ' 天 / Current plan day ' + dayOfPlan(today, start) + '</p></div>' +
      '<div class="section-head"><div><p class="eyebrow">DAY ' + day + ' · ' + escape(entry.topic) +
      '</p><h2>' + escape(entry.title) + '</h2></div></div>' +
      '<div class="in-columns">' + types.map(type => renderPane(day, type, entry, state)).join("") + '</div>' +
      '<section class="card in-transfer"><p class="eyebrow">口语迁移 / SPEAKING TRANSFER</p><h2 lang="en">' +
      escape(entry.transfer.phrase) + '</h2><p lang="en">' + escape(entry.transfer.example) +
      '</p><p class="muted">换一个自己的例子，把这个表达用进两句话里。 / Give your own example using this expression in two sentences.</p></section>' +
      (memoryOnly ? '<p class="translation">本页暂存进度，关闭后可能丢失。 / Progress is stored in page memory and may be lost on closing.</p>' : "");
  }
  function render(today, planStart = today) {
    if (!Array.isArray(window.SCW_DAYS) || !window.SCW_DAYS.length) {
      return '<p class="card">读听练习暂未载入。 / The reading and listening sets could not be loaded.</p>';
    }
    const view = readState().view;
    const day = (view?.date === today && validDay(view?.day)) || dayOfPlan(today, planStart);
    return '<section class="scw-input" data-scw-input data-today="' + escape(today) + '" data-start="' +
      escape(planStart) + '" data-current="' + day + '">' + renderDay(day, today, planStart) + '</section>';
  }

  function setDay(host, value) {
    const day = validDay(value);
    if (day === null) return;
    const today = host.dataset.today;
    writeState({...readState(), view: {date: today, day}});
    host.dataset.current = String(day);
    host.innerHTML = renderDay(day, today, host.dataset.start);
    host.querySelector("[data-input-day]")?.focus({preventScroll: true});
  }
  function refreshPane(host, pane, day, type, attempt) {
    const quizContainer = pane.querySelector("[data-input-quiz]");
    quizContainer.innerHTML = quiz(day, type, attempt);
    if (type === "listening") {
      pane.querySelector("[data-input-transcript]").innerHTML = transcript(window.SCW_DAYS[day - 1].listening, attempt);
    }
    // Avoid resetting the audio element while marking answers or opening the transcript.
    const currentOption = host.querySelector('[data-input-day] option[value="' + day + '"]');
    if (currentOption) {
      const state = readState();
      const done = types.every(key => readAttempt(state, day, key).submitted);
      currentOption.textContent = 'Day ' + day + ' · ' + window.SCW_DAYS[day - 1].title + (done ? " · ✓" : "");
    }
  }
  document.addEventListener("change", event => {
    const control = event.target;
    const host = control.closest?.("[data-scw-input]");
    if (!host) return;
    if (control.matches("[data-input-day]")) { setDay(host, control.value); return; }
    if (!control.matches("input[data-input-q]") || !control.checked) return;
    const day = validDay(host.dataset.current);
    const type = control.closest("[data-input-type]")?.dataset.inputType;
    if (!day || !types.includes(type)) return;
    const attempt = readAttempt(readState(), day, type);
    const index = Number(control.dataset.inputQ);
    const choice = Number(control.value);
    const question = window.SCW_DAYS[day - 1][type].questions[index];
    if (attempt.submitted || !question || !Number.isInteger(choice) || choice < 0 || choice >= question.options.length) return;
    attempt.choices[index] = choice;
    saveAttempt(day, type, attempt);
    control.closest("[data-input-quiz]").querySelector("[data-input-alert]").textContent = "";
  });
  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-input-action]");
    if (!button) return;
    const host = button.closest("[data-scw-input]");
    const pane = button.closest("[data-input-type]");
    const day = validDay(host?.dataset.current);
    const type = pane?.dataset.inputType;
    if (!host || !day || !types.includes(type)) return;
    const attempt = readAttempt(readState(), day, type);
    const intent = button.dataset.inputAction;
    if (intent === "submit") {
      const missing = attempt.choices.findIndex(value => value === null);
      if (missing >= 0) {
        pane.querySelector("[data-input-alert]").textContent = "请先回答 Q" + (missing + 1) + "。 / Please answer Q" + (missing + 1) + " first.";
        pane.querySelector('input[data-input-q="' + missing + '"]')?.focus();
        return;
      }
      attempt.submitted = true;
    } else if (intent === "retry") {
      attempt.choices.fill(null);
      attempt.submitted = false;
      attempt.textMode = false;
    } else if (intent === "text-mode" && type === "listening") {
      attempt.textMode = true;
    } else { return; }
    saveAttempt(day, type, attempt);
    refreshPane(host, pane, day, type, attempt);
    const focus = intent === "submit" ? ".in-result" :
      intent === "text-mode" ? "[data-input-transcript] summary" : "input[data-input-q]";
    pane.querySelector(focus)?.focus({preventScroll: true});
  });
  document.addEventListener("error", event => {
    const player = event.target;
    if (player?.tagName !== "AUDIO") return;
    const container = player.closest?.(".in-audio");
    const message = container?.querySelector("[data-audio-error]");
    if (message) message.textContent = "音频未能加载，请重试或使用文字辅助。 / Audio could not load. Retry playback or use transcript mode.";
  }, true);
  window.SCW_INPUT = Object.freeze({render});
})();
