"use strict";

// Run with node verify.cjs. These checks use the delivered scripts and a
// controlled clock. Browser rendering and microphone access are separate QA.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const dist = path.join(__dirname, "dist");
const read = (name) => fs.readFileSync(path.join(dist, name), "utf8");
const html = read("index.html");
const appSource = read("app.js");
const storageKey = "scw1-studio-v1";
const DAY = 86_400_000;
const firstDay = Date.UTC(2026, 10, 20);
const escape = (text) => text.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function loadData(context) {
  for (const name of ["bank.js", "learning.js", "focus.js", "quotes.js", "media.js", "library.js", "days.js", "input.js", "awl.js", "words.js"]) {
    if (!context.customElements) {
      context.HTMLElement = class {};
      context.customElements = {get:()=>undefined, define:()=>{}};
      context.window.customElements=context.customElements;
    }
    vm.runInContext(read(name), context, { filename: name });
  }
  return { bank: context.window.SCW_BANK, learning: context.window.SCW_LEARNING };
}

function platform({
  epoch = firstDay + 4 * 3_600_000,
  values = new Map(),
  hash = "#home",
  voice = true
} = {}) {
  const clock = { now: epoch, sequence: 0, timers: new Map() };
  const location = { hash };
  const windowEvents = new Map();
  const documentEvents = new Map();
  const messages = [];
  let context;
  let nodes = [];

  class TestDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock.now]));
    }
    static now() {
      return clock.now;
    }
  }

  class TestFormatter extends Intl.DateTimeFormat {
    formatToParts(time = clock.now) {
      return super.formatToParts(time);
    }
  }

  class Element {
    constructor(tag, attributes = {}) {
      this.tagName = tag.toUpperCase();
      this.attributes = new Map(Object.entries(attributes));
      this.dataset = {};
      for (const [name, value] of this.attributes) {
        if (name.startsWith("data-")) {
          const key = name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
          this.dataset[key] = value;
        }
      }
      this.id = attributes.id || "";
      this.value = attributes.value || "";
      this.checked = Object.hasOwn(attributes, "checked");
      this.disabled = Object.hasOwn(attributes, "disabled");
      this.hidden = Object.hasOwn(attributes, "hidden");
      this.open = Object.hasOwn(attributes, "open");
      this.textContent = "";
      this.style = {};
      this.classList = {
        toggle: () => {},
        add: () => {},
        remove: () => {}
      };
    }
    set innerHTML(value) {
      this.markup = value;
      if (this.id === "app") nodes = extractNodes(value);
    }
    get innerHTML() { return this.markup || ""; }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    removeAttribute(name) { this.attributes.delete(name); }
    toggleAttribute(name, value) {
      if (value) this.setAttribute(name, "");
      else this.removeAttribute(name);
    }
    matches(selector) {
      const field = selector.match(/\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]/);
      const tag = selector.match(/^[a-z][\w-]*/i);
      const id = selector.match(/#([\w-]+)/);
      const className = selector.match(/\.([\w-]+)/);
      return (!tag || this.tagName === tag[0].toUpperCase())
        && (!id || this.id === id[1])
        && (!className || (this.getAttribute("class") || "").split(/\s+/).includes(className[1]))
        && (!selector.endsWith(":checked") || this.checked)
        && (!field || (this.attributes.has(field[1]) && (!field[2] || this.getAttribute(field[1]) === field[2])));
    }
    closest(selector) { return selector.split(",").some((part) => this.matches(part.trim())) ? this : null; }
    querySelector(selector) { return document.querySelector(selector); }
    querySelectorAll(selector) { return document.querySelectorAll(selector); }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
    setSelectionRange() {}
  }

  function extractNodes(markup) {
    return Array.from(markup.matchAll(/<([a-z][\w-]*)(\s[^<>]*?)?\s*\/?>(?!>)/gi), ([, tag, fields = ""]) => {
      const attributes = {};
      for (const [, name, double, single, unquoted] of fields.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        attributes[name] = double ?? single ?? unquoted ?? "";
      }
      return new Element(tag, attributes);
    });
  }

  const initialNodes = extractNodes(html);
  const app = initialNodes.find((node) => node.id === "app");
  const notice = initialNodes.find((node) => node.id === "notice");
  const document = {
    hidden: false,
    activeElement: null,
    body: new Element("body"),
    getElementById(id) { return [...nodes, ...initialNodes].find((node) => node.id === id) || null; },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
    querySelectorAll(selector) { return [...nodes, ...initialNodes].filter((node) => node.closest(selector)); },
    addEventListener(type, callback) { attach(documentEvents, type, callback); }
  };

  function attach(events, type, callback) {
    const callbacks = events.get(type) || [];
    callbacks.push(callback);
    events.set(type, callbacks);
  }
  function emit(events, type, target, extra = {}) {
    const event = {
      target, preventDefault() {}, stopPropagation() {}, shiftKey: false,
      ctrlKey: false, altKey: false, metaKey: false, button: 0, ...extra
    };
    for (const callback of events.get(type) || []) callback(event);
  }
  function registerTimer(callback, ms, repeating) {
    const id = ++clock.sequence;
    clock.timers.set(id, { id, callback, ms, repeating, expires: clock.now + ms });
    return id;
  }
  function advance(ms, runTimers = true) {
    clock.now += ms;
    if (!runTimers) return;
    const due = [...clock.timers.values()].filter((timer) => timer.expires <= clock.now);
    for (const timer of due) {
      if (!clock.timers.has(timer.id)) continue;
      if (timer.repeating) timer.expires += (Math.floor((clock.now - timer.expires) / timer.ms) + 1) * timer.ms;
      else clock.timers.delete(timer.id);
      timer.callback();
    }
  }
  const globals = {
    document, history: {
      pushState(_state, _unused, url) { location.hash = url; },
      replaceState(_state, _unused, url) { location.hash = url; }
    },
    Date: TestDate, Intl: { DateTimeFormat: TestFormatter },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value))
    },
    location, navigator: {}, console, URL, Blob,
    scrollTo() {},
    setTimeout: (callback, ms) => registerTimer(callback, ms, false),
    setInterval: (callback, ms) => registerTimer(callback, ms, true),
    clearTimeout: (id) => clock.timers.delete(id),
    clearInterval: (id) => clock.timers.delete(id),
    addEventListener: (type, callback) => attach(windowEvents, type, callback)
  };
  if (voice) {
    globals.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    globals.speechSynthesis = {
      cancel() {},
      getVoices: () => [{ lang: "en-GB", localService: true }],
      speak(utterance) { messages.push(utterance.text); utterance.onend?.(); }
    };
  }
  globals.window = globals;
  context = vm.createContext(globals);
  const data = loadData(context);
  const exposed = `window.inspectStudio = {
      drawDaily, mockDraw, shanghaiDate, isCore,
      current: () => ({ view, session, saved })
    };`;
  assert.match(appSource, /\}\)\(\);\s*$/, "app.js must be complete");
  vm.runInContext(appSource.replace(/\}\)\(\);\s*$/, exposed + "})();"), context, { filename: "app.js" });
  return {
    app, notice, document, location, values, messages, advance,
    ...data, ...globals.inspectStudio,
    fire(type, selector, extra = {}, properties = {}) {
      const target = document.querySelector(selector);
      assert.ok(target, "Missing selector " + selector + " in view " + globals.inspectStudio.current().view);
      assert.ok(!target.disabled, "Cannot act on disabled selector " + selector);
      Object.assign(target, properties);
      emit(documentEvents, type, target, extra);
      return target;
    },
    action(action) { return this.fire("click", '[data-action="' + action + '"]'); },
    actionMatching(pattern) {
      const actions = document.querySelectorAll("[data-action]").filter((node) => !node.disabled);
      const match = actions.find((node) => pattern.test(node.dataset.action));
      assert.ok(match, "No action matching " + pattern + ". Options: " + actions.map((node) => node.dataset.action).join(", "));
      emit(documentEvents, "click", match);
      return match;
    },
    hashChange(to) {
      location.hash = to;
      emit(windowEvents, "hashchange", null);
    },
    revealWindow() {
      document.hidden = false;
      emit(documentEvents, "visibilitychange", null);
    },
    savedData() { return JSON.parse(values.get(storageKey) || "{}"); }
  };
}

function dateLabel(offset) {
  return new Date(firstDay + offset * DAY).toISOString().slice(0, 10);
}

const failures = [];
function verify(label, run) {
  try {
    run();
    console.log("PASS " + label);
  } catch (error) {
    failures.push(label);
    console.error("FAIL " + label + "\n" + error.stack);
  }
}

verify("static user entry points and bank quality", () => {
  for (const name of ["style.css", "bank.js", "learning.js", "app.js"]) {
    assert.ok(html.includes("./" + name));
    assert.ok(fs.statSync(path.join(dist, name)).size > 0);
  }
  const { bank, learning } = loadData(vm.createContext({ window: {} }));
  const ids = [...bank.talks, ...bank.interviews].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(bank.talks.filter((x) => x.source === "teacher").length >= 10);
  assert.ok(bank.interviews.filter((x) => x.source === "teacher").length >= 10);
  const normalized = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const talks = bank.talks.map(({ prompt }) => normalized(prompt));
  const questions = bank.interviews.flatMap(({ questions: entries }) => entries.map(({ prompt }) => normalized(prompt)));
  assert.equal(new Set(talks).size, talks.length, "Repeated individual prompts");
  assert.equal(new Set(questions).size, questions.length, "Repeated interview prompts");
  for (const talk of bank.talks) {
    assert.ok(bank.sources[talk.source]);
    assert.ok(talk.topic && talk.prompt && talk.answer.length >= 2);
    assert.ok(talk.cues.length > 0 && talk.phrases.length > 0);
  }
  for (const interview of bank.interviews) {
    assert.ok(bank.sources[interview.source]);
    assert.ok(interview.topic && interview.questions.length >= 1 && interview.questions.length <= 4);
    for (const question of interview.questions) {
      assert.ok(question.prompt && question.answer.length > 20 && question.phrases.length > 0);
    }
  }
  assert.equal(learning.days.length, 14);
  assert.equal(learning.rubric.length, 17);
  assert.ok(learning.toolkit.flatMap((entry) => entry.items).length >= 30);
  assert.ok(learning.methods.length >= 4);
  assert.ok(learning.methods.every(({ url }) => new URL(url).protocol === "https:"));
});

verify("Shanghai-day rollover and stable draw", () => {
  const site = platform({ epoch: Date.UTC(2026, 10, 19, 15, 59, 59) });
  assert.equal(site.shanghaiDate(), "2026-11-19");
  site.advance(1000);
  assert.equal(site.shanghaiDate(), "2026-11-20");
  const initial = site.drawDaily(site.shanghaiDate());
  const repeat = site.drawDaily(site.shanghaiDate());
  assert.equal(repeat.talk.id, initial.talk.id);
  assert.equal(repeat.interview.id, initial.interview.id);
});

verify("four fortnightly rotations prioritise teacher topics and avoid paired-topic collisions", () => {
  const site = platform();
  for (let cycle = 0; cycle < 4; cycle += 1) {
    const draws = Array.from({ length: 14 }, (_, position) => site.drawDaily(dateLabel(cycle * 14 + position)));
    for (const { date, talk, interview } of draws) {
      assert.notEqual(talk.topic.toLowerCase(), interview.topic.toLowerCase(), date);
      const options = site.mockDraw(date).talkOptions;
      assert.equal(options.length, 2, "Mock must offer two Part 1 topics");
      assert.notEqual(options[0].topic.toLowerCase(), options[1].topic.toLowerCase(), date);
      assert.ok(options.every(site.isCore), "Mock options must use core sources");
    }
    for (const kind of ["talk", "interview"]) {
      const ids = draws.map((draw) => draw[kind].id);
      assert.equal(new Set(ids).size, 14, "Repeated " + kind + " IDs in cycle " + (cycle + 1));
      assert.ok(draws.filter((draw) => site.isCore(draw[kind])).length >= 10, "Insufficient core source priority");
    }
  }
});

verify("all nine navigation routes render through the site entry point", () => {
  const site = platform();
  for (const route of ["practice", "bank", "toolkit", "words", "skills", "library", "plan", "sources", "home"]) {
    site.fire("click", '[data-view="' + route + '"]');
    assert.equal(site.current().view, route);
    assert.ok(site.app.innerHTML.includes("<h1"), "No heading rendered in " + route);
  }
  site.hashChange("#plan");
  assert.equal(site.current().view, "plan");
  assert.match(site.app.innerHTML, /14/);
});

verify("daily timer and model gating through practice controls", () => {
  const site = platform();
  site.action("daily");
  let current = site.current().session;
  const day = current.date;
  const talkId = current.talk.id;
  const setId = current.interview.id;
  const modelExcerpt = escape(current.talk.answer[0].slice(0, 55));
  const modelQuestion = escape(current.interview.questions[0].answer.slice(0, 50));
  const checkHidden = () => {
    assert.ok(!site.app.innerHTML.includes(modelExcerpt), "Part 1 model visible before completion");
    assert.ok(!site.app.innerHTML.includes(modelQuestion), "Part 2 model visible before completion");
  };
  assert.equal(current.stage, "prep-ready");
  checkHidden();
  site.actionMatching(/^(prep|start-prep|begin-prep|prep-start)$/);
  assert.equal(site.current().session.stage, "prep");
  site.advance(59_999);
  assert.equal(site.current().session.stage, "prep");
  site.advance(1);
  assert.equal(site.current().session.stage, "talk-ready");
  checkHidden();
  site.actionMatching(/^(talk|start-talk|begin-talk|talk-start)$/);
  current = site.current().session;
  assert.equal(current.stage, "talk");
  assert.equal(current.duration, 120);
  site.advance(120_000);
  assert.equal(site.current().session.stage, "interview-ready");
  checkHidden();
  assert.equal(site.values.has(storageKey), false, "Daily progress saved before review");
  site.actionMatching(/^(interview|start-interview|begin-interview|interview-start)$/);
  current = site.current().session;
  assert.equal(current.stage, "interview");
  assert.equal(current.duration, 240);
  assert.equal(site.messages[0], current.interview.questions[0].prompt);
  assert.ok(!site.app.innerHTML.includes(escape(current.interview.questions[0].prompt)), "Listen-only prompt printed before showing text");
  site.advance(239_999);
  assert.equal(site.current().session.stage, "interview");
  checkHidden();
  site.advance(1);
  assert.equal(site.current().session.stage, "review");
  assert.deepEqual(site.savedData().done[day], { talk: talkId, interview: setId });
  assert.ok(site.app.innerHTML.includes(modelExcerpt), "Part 1 model unavailable after completion");
  assert.ok(site.app.innerHTML.includes(modelQuestion), "Part 2 model unavailable after completion");
  const restored = platform({ values: site.values });
  assert.match(restored.app.innerHTML, /Practised today|Replay today/);
  assert.equal(restored.drawDaily(day).talk.id, talkId);
});

verify("full mock topic selection and spoken interview questions share the four-minute cap", () => {
  const site = platform();
  site.action("mock");
  const current = site.current().session;
  assert.equal(current.stage, "talk-choice");
  assert.equal(current.talkOptions.length, 2);
  const originalIndex = current.talkOptions[0];
  site.actionMatching(/^(pick-talk|choose-talk|select-talk)$/);
  assert.equal(site.current().session.talk.id, originalIndex.id);
  if (site.current().session.stage === "prep-ready") site.actionMatching(/^(prep|start-prep|begin-prep|prep-start)$/);
  site.advance(60_000);
  site.actionMatching(/^(talk|start-talk|begin-talk|talk-start)$/);
  site.advance(120_000);
  assert.equal(site.current().session.stage, "interview-choice");
  assert.equal(current.interviewOptions.length, 2);
  for (const option of current.interviewOptions) assert.notEqual(option.topic.toLowerCase(), current.talk.topic.toLowerCase());
  site.actionMatching(/^(pick-interview|choose-interview|select-interview)$/);
  if (site.current().session.stage === "interview-ready") site.actionMatching(/^(interview|start-interview|begin-interview|interview-start)$/);
  assert.equal(current.stage, "interview");
  const deadline = current.deadline;
  site.advance(60_000);
  site.actionMatching(/^(next|next-q|next-question|interview-next)$/);
  assert.equal(current.q, 1);
  assert.equal(current.deadline, deadline, "Interview question reset the session deadline");
  assert.equal(site.messages.at(-1), current.interview.questions[1].prompt);
  site.advance(180_000);
  assert.equal(current.stage, "review");
  assert.equal(site.values.has(storageKey), false, "Full mock was added to daily progress");
});

verify("a background tab rechecks expired time, and unavailable speech reveals the question", () => {
  const site = platform({ voice: false });
  site.action("daily");
  site.actionMatching(/^(prep|start-prep|begin-prep|prep-start)$/);
  site.document.hidden = true;
  site.advance(61_000, false);
  assert.equal(site.current().session.stage, "prep");
  site.revealWindow();
  assert.equal(site.current().session.stage, "talk-ready");
  site.actionMatching(/^(talk|start-talk|begin-talk|talk-start)$/);
  site.advance(120_000);
  site.actionMatching(/^(interview|start-interview|begin-interview|interview-start)$/);
  const current = site.current().session;
  assert.equal(current.stage, "interview");
  assert.equal(current.textVisible, true);
  assert.ok(site.app.innerHTML.includes(escape(current.interview.questions[0].prompt)));
});

verify("bank searches question text and combines the source and part filters", () => {
  const site = platform({ hash: "#bank" });
  const results = () => site.document.getElementById("bank-results").innerHTML;
  site.fire("change", "#filter-type", {}, { value: "interview" });
  assert.match(results(), /data-action="bank-interview"/);
  assert.doesNotMatch(results(), /data-action="bank-talk"/);
  site.fire("change", "#filter-source", {}, { value: "core" });
  const teacherSet = site.bank.interviews.find((entry) => entry.source === "teacher");
  const supplementarySet = site.bank.interviews.find((entry) => !site.isCore(entry));
  assert.ok(results().includes('data-value="' + teacherSet.id + '"'));
  assert.ok(!results().includes('data-value="' + supplementarySet.id + '"'));
  site.fire("input", "#search-bank", {}, { value: teacherSet.questions[0].prompt });
  assert.match(results(), /1 cards/);
  assert.match(results(), /data-value="teacher-university-interview"/);
  site.fire("input", "#search-bank", {}, { value: "not a known question in this bank" });
  assert.match(results(), /No matching prompts/);
});

verify("plan completion survives reload and can be undone", () => {
  const site = platform({ hash: "#plan" });
  site.fire("change", '[data-day="0"]', {}, { checked: true });
  const initialStart = site.savedData().start;
  assert.equal(initialStart, site.shanghaiDate());
  assert.equal(site.savedData().plan["0"], true);
  assert.match(site.app.innerHTML, /1 \/ 14/);
  const restored = platform({ hash: "#plan", values: site.values });
  assert.equal(restored.document.querySelector('[data-day="0"]').checked, true);
  assert.equal(restored.savedData().start, initialStart);
  restored.fire("change", '[data-day="0"]', {}, { checked: false });
  assert.equal(restored.savedData().plan["0"], undefined);
  assert.match(restored.app.innerHTML, /0 \/ 14/);
});

verify("bank single-prompt practice saves a 17-point review and note", () => {
  const site = platform({ hash: "#bank" });
  const note = "Explain why this matters, then give a real campus example.";
  const run = () => {
    site.action("prep");
    site.fire("input", "#prep-notes", {}, { value: "seminar - feedback - next step" });
    assert.equal(site.current().session.notes, "seminar - feedback - next step");
    site.action("finish-prep");
    site.action("talk");
    site.action("finish-talk");
    assert.equal(site.current().session.stage, "review");
  };
  site.action("bank-talk");
  const chosen = site.current().session.talk;
  assert.equal(site.current().session.interview, null);
  run();
  assert.equal(site.document.querySelectorAll("[data-check]").length, 17);
  site.fire("change", '[data-check="8"]', {}, { checked: true });
  site.fire("input", "#review-notes", {}, { value: note });
  site.action("save-review");
  const record = Object.values(site.savedData().reviews)[0];
  assert.deepEqual(record, { checked: [8], note });
  assert.deepEqual(site.savedData().done, {});
  site.action("retry");
  assert.equal(site.current().session.talk.id, chosen.id);
  run();
  assert.equal(site.document.querySelector('[data-check="8"]').checked, true);
  assert.ok(site.app.innerHTML.includes(note));
});

if (failures.length) process.exitCode = 1;
