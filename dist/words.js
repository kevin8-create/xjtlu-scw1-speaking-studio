(() => {
  "use strict";

  const originalCards = [
    ["articulate", "v. 清楚说出；明确表达", "articulate a concern", "A student representative can articulate a concern by describing exactly what happens in class."],
    ["clarify", "v. 澄清；说明", "clarify what the task involves", "We clarified what the task involved before dividing the work between us."],
    ["hesitate", "v. 犹豫；迟疑", "hesitate to speak up", "I used to hesitate to speak up in a large class, especially if I had only just formed my opinion."],
    ["reassure", "v. 使安心；打消顾虑", "reassure someone about a change", "A trial lesson could reassure students who are worried about changing to a new timetable."],
    ["misinterpret", "v. 误解；错误解读", "misinterpret a message", "It's easy to misinterpret a short message when you can't hear the speaker's tone."],
    ["paraphrase", "v. 用自己的话转述", "paraphrase the main point", "I paraphrased my partner's main point to check that we understood each other."],
    ["manageable", "adj. 可应付的；可掌控的", "break it into manageable steps", "I broke the project into manageable steps so that I could make progress between lectures."],
    ["overwhelmed", "adj. 感到不知所措的", "feel overwhelmed by deadlines", "I felt overwhelmed by the deadlines, so I put all three dates in one calendar."],
    ["procrastinate", "v. 拖延", "procrastinate on difficult tasks", "I tend to procrastinate on difficult tasks if I don't know the first step."],
    ["workload", "n. 工作量；课业量", "manage a heavy workload", "A weekly plan helps me manage a heavy workload because I can see which tasks are urgent."],
    ["setback", "n. 挫折；阻碍", "recover from a setback", "I recovered from the setback by asking my group to try the demonstration one more time."],
    ["resourceful", "adj. 善用资源的；办法多的", "be resourceful under pressure", "My classmate was resourceful under pressure and drew the diagram when the projector stopped working."],
    ["trade-off", "n. 取舍；权衡", "a trade-off between convenience and cost", "There is a trade-off between convenience and cost when students choose where to live."],
    ["drawback", "n. 缺点；不利之处", "one drawback of a proposal", "One drawback of the proposal is that students living farther away may find the new bus stop inconvenient."],
    ["outweigh", "v. 比……更重要", "the benefits outweigh the disadvantages", "I think the benefits outweigh the disadvantages when recorded lectures help students revisit a difficult idea."],
    ["feasible", "adj. 可行的；可做到的", "a feasible solution", "A feasible solution would be to keep the library open late during the busiest week."],
    ["cost-effective", "adj. 有成本效益的", "a cost-effective way to improve something", "Adding clearer signs could be a cost-effective way to improve recycling on campus."],
    ["counterproductive", "adj. 适得其反的", "be counterproductive in practice", "Reading my script repeatedly becomes counterproductive when I stop responding to the actual question."],
    ["streamline", "v. 简化；提高效率", "streamline the booking process", "A single online form could streamline the booking process for study rooms."],
    ["time-consuming", "adj. 耗时的", "a time-consuming process", "We used a shared document because collecting everyone's changes by email was time-consuming."],
    ["tailored", "adj. 针对需求调整的", "be tailored to a particular audience", "The campus tour could be tailored to new students by showing them places they will use in their first week."],
    ["compelling", "adj. 有说服力的；引人入胜的", "a compelling reason", "A compelling reason to improve the bus route is that more students could get to an early class on time."],
    ["nuanced", "adj. 有细微区分的；细致的", "a more nuanced view", "I have a more nuanced view of technology now because the same tool can help or distract me."],
    ["insightful", "adj. 有见地的", "an insightful comment", "An insightful comment from my partner helped me see why our example didn't support the main point."],
    ["overlooked", "adj. 容易被忽视的", "an often-overlooked benefit", "An often-overlooked benefit of group work is learning how other people approach the same problem."],
    ["reliable", "adj. 可靠的；稳定的", "a reliable source of information", "I check whether a claim comes from a reliable source before I use it as evidence."],
    ["distraction", "n. 使人分心的事物", "remove unnecessary distractions", "I put my phone in my bag to remove unnecessary distractions while I read."],
    ["walkable", "adj. 适合步行的", "a walkable neighbourhood", "A walkable neighbourhood can make everyday trips easier for people who don't own a car."],
    ["commute", "v./n. 通勤；通勤路程", "a shorter commute to campus", "A shorter commute to campus would give me more time to prepare for my morning class."],
    ["congestion", "n. 拥堵", "reduce traffic congestion", "A more frequent bus service may reduce traffic congestion if people find it reliable."],
    ["affordable", "adj. 负担得起的", "make transport more affordable", "A student travel pass could make transport more affordable for people who commute every day."],
    ["durable", "adj. 耐用的", "choose a durable alternative", "I chose a durable water bottle because I use it in class, the library, and at the gym."],
    ["biodiversity", "n. 生物多样性", "protect local biodiversity", "A park can protect local biodiversity if it has different trees, insects, and birds."],
    ["wind down", "phr. v. 放松下来", "wind down after a long day", "I go for a short walk to wind down after a long day of lectures."],
    ["self-conscious", "adj. 不自在的；怕别人评价的", "feel self-conscious when speaking", "I felt self-conscious when speaking at first, but rehearsing with one friend helped."],
    ["hands-on", "adj. 动手实践的；实际参与的", "gain hands-on experience", "Students can gain hands-on experience by trying a short design project with a real brief."]
  ].map(([word, meaning, phrase, example]) => ({ word, group: 0, meaning, phrase, example, page: null }));

  const imported = Array.isArray(window.SCW_AWL) ? window.SCW_AWL : [];
  const words = [...imported, ...originalCards];
  const byWord = new Map(words.map((item) => [item.word, item]));
  const storageKey = "scw1-vocabulary-v1";
  const groupPlan = [1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2];
  const reviewIntervals = [3, 7, 14];
  const pageSize = 16;
  const ui = { mode: "today", search: "", group: "", filter: "", selected: "", revealed: false, page: 0, message: "" };
  const wordState = readState();

  window.SCW_WORDS = words;

  function readState() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey));
      if (data && typeof data === "object") {
        const cards = Object.fromEntries(Object.entries(data.cards || {}).filter(([word, record]) =>
          byWord.has(word) && record && ["hard", "easy"].includes(record.rating) && validDate(record.due)));
        const days = Object.fromEntries(Object.entries(data.days || {}).filter(([date, values]) =>
          validDate(date) && Array.isArray(values)).map(([date, values]) =>
          [date, [...new Set(values.filter((word) => byWord.has(word)))]]));
        return { start: validDate(data.start) ? data.start : "", cards, days };
      }
    } catch { /* The browser can disable storage. */ }
    return { start: "", cards: {}, days: {} };
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(wordState));
      return true;
    } catch { return false; }
  }

  function validDate(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const timestamp = Date.parse(date + "T00:00:00Z");
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date;
  }
  function plusDays(day, count) {
    return new Date(Date.parse(day + "T00:00:00Z") + count * 86_400_000).toISOString().slice(0, 10);
  }
  function dateOffset(day, start) {
    return Math.floor((Date.parse(day + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 86_400_000);
  }
  function getDate(today) {
    if (validDate(today)) return today;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts();
    const { year, month, day } = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return year + "-" + month + "-" + day;
  }
  function text(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }
  function english(value) { return '<span lang="en">' + text(value) + "</span>"; }
  function button(label, action, options = {}) {
    const { value, theme = "quiet", disabled = false, pressed, controls } = options;
    return '<button type="button" class="btn ' + theme + '" data-word-action="' + text(action) + '"' +
      (value === undefined ? "" : ' data-word-value="' + text(value) + '"') +
      (pressed === undefined ? "" : ' aria-pressed="' + pressed + '"') +
      (controls ? ' aria-controls="' + text(controls) + '"' : "") + (disabled ? " disabled" : "") +
      ">" + text(label) + "</button>";
  }
  function option(value, description, current) {
    return '<option value="' + text(value) + '"' + (String(current) === String(value) ? " selected" : "") +
      ">" + text(description) + "</option>";
  }
  function startPlan(today) {
    if (!wordState.start) {
      wordState.start = today;
      save();
    }
  }
  function dueWords(today) {
    return words.filter((card) => wordState.cards[card.word]?.due <= today).sort((a, b) =>
      wordState.cards[a.word].due.localeCompare(wordState.cards[b.word].due) ||
      Number(wordState.cards[b.word].rating === "hard") - Number(wordState.cards[a.word].rating === "hard"));
  }
  function nextWords(today) {
    const day = Math.max(0, dateOffset(today, wordState.start));
    const sample = (deck, offset, count) => Array.from({ length: Math.min(count, deck.length) }, (_, index) =>
      deck[(offset + index) % deck.length]);
    if (!imported.length) return sample(originalCards, day * 6, 6).filter((card) => !wordState.cards[card.word]);
    const position = day % groupPlan.length;
    const group = groupPlan[position];
    const visits = Math.floor(day / groupPlan.length) * groupPlan.filter((value) => value === group).length
      + groupPlan.slice(0, position).filter((value) => value === group).length;
    const academic = imported.filter((card) => card.group === group);
    return [...sample(academic, visits * 6, 6), ...sample(originalCards, day * 2, 2)].filter((card) => !wordState.cards[card.word]);
  }
  function currentCards(today) {
    const due = dueWords(today);
    const incoming = ui.mode === "due" ? due : ui.mode === "today" ? [...due, ...nextWords(today)] : words;
    const query = ui.search.trim().toLowerCase();
    return incoming.filter((card) => {
      const record = wordState.cards[card.word];
      return (!ui.group || Number(ui.group) === card.group)
        && (!ui.filter || (ui.filter === "new" ? !record : record?.rating === ui.filter))
        && (!query || [card.word, card.meaning, card.phrase].join(" ").toLowerCase().includes(query));
    });
  }
  function setCurrent(cards) {
    if (!cards.some((card) => card.word === ui.selected)) {
      ui.selected = cards[0]?.word || "";
      ui.revealed = false;
    }
    return byWord.get(ui.selected);
  }
  function clearSelection() {
    ui.selected = "";
    ui.revealed = false;
    ui.page = 0;
  }
  function rate(card, rating, today) {
    const previous = wordState.cards[card.word];
    const streak = rating === "hard" ? 0 : Math.min(3, (Number(previous?.streak) || 0) + 1);
    const days = rating === "hard" ? 1 : reviewIntervals[streak - 1];
    const due = plusDays(today, days);
    wordState.cards[card.word] = { rating, streak, due, last: today };
    const marked = Array.isArray(wordState.days[today]) ? wordState.days[today] : [];
    wordState.days[today] = [...new Set([...marked, card.word])];
    const persisted = save();
    ui.message = "下次复习 / Next review · " + due +
      (persisted ? "" : " · 浏览器未保存本次更改 / Changes could not be saved");
  }

  function progress(today) {
    const day = Math.min(14, Math.max(1, dateOffset(today, wordState.start) + 1));
    const due = dueWords(today).length;
    const marked = (wordState.days[today] || []).length;
    return '<div class="word-stats"><div><span>计划 / Plan</span><strong>Day ' + day +
      ' / 14</strong></div><div><span>今天到期 / Due today</span><strong>' + due +
      '</strong></div><div><span>今天已练 / Reviewed today</span><strong>' + marked + "</strong></div></div>";
  }
  function reminders(today) {
    const days = Array.from({ length: 14 }, (_, index) => plusDays(wordState.start, index));
    const overview = days.map((date, index) => {
      const count = (wordState.days[date] || []).length;
      const isToday = date === today;
      const label = count ? count + " 词 / words" : isToday ? "待练 / To do"
        : date < today ? "未练 / Missed" : "待开始 / Upcoming";
      return '<li class="word-day' + (isToday ? " is-current" : "") + (count ? " is-done" : "") +
        '"' + (isToday ? ' aria-current="date"' : "") + '><strong>Day ' + (index + 1) +
        '</strong><time datetime="' + date + '">' + date.slice(5) +
        "</time><small>" + text(label) + "</small></li>";
    }).join("");
    return '<section class="card word-reminder"><h2>14 天复习提醒</h2><p class="muted" lang="en">14-day review reminders</p>' +
      '<p>优先复习到期词，再练少量新词。标为难词后，次日进入到期队列。熟词按 3、7、14 天逐步延长间隔。每次打开本站可查看提醒。<br>' +
      '<span lang="en">Review due words first, then try a few new ones. Hard words return the next day. Easy reviews extend the gap to 3, 7, then 14 days. Reminders appear when you open the site.</span></p>' +
      '<ol class="word-days">' + overview + "</ol></section>";
  }
  function modeButtons() {
    const modes = [["today", "今日词组 / Today"], ["due", "到期复习 / Due"], ["bank", "全部词卡 / All words"]];
    return modes.map(([value, label]) => button(label, "mode", {
      value, pressed: ui.mode === value, controls: "word-results", theme: ui.mode === value ? "primary" : "quiet"
    })).join("");
  }
  function filters() {
    const groups = [...new Set(imported.map((card) => card.group))].sort((a, b) => a - b);
    const groupOptions = groups.map((group) => option(group, "Sublist " + group, ui.group)).join("");
    const filterOptions = [
      ["", "所有 / All"], ["new", "未练 / New"], ["hard", "难词 / Hard"], ["easy", "熟词 / Easy"]
    ].map(([value, label]) => option(value, label, ui.filter)).join("");
    return '<div class="word-filters"><label>搜索词或词义 / Search words or meanings' +
      '<input id="word-search" data-word-field="search" type="search" value="' + text(ui.search) +
      '" placeholder="例如 trade-off、权衡"></label><label>词表 / Sublist' +
      '<select id="word-group" data-word-field="group">' + option("", "所有词表 / All lists", ui.group) +
      groupOptions + option(0, "雅思风格加练 / IELTS-style", ui.group) + "</select></label>" +
      '<label>熟悉度 / Familiarity<select id="word-filter" data-word-field="filter">' + filterOptions + "</select></label></div>";
  }
  function source(card) {
    return card.group ? "AWL · Sublist " + card.group + " · PDF p. " + card.page
      : "雅思风格原创加练 / IELTS-style practice";
  }
  function cardView(cards) {
    const card = setCurrent(cards);
    if (!card) {
      const message = ui.mode === "due" && !ui.search && !ui.group && !ui.filter
        ? "当前没有到期词。 / No reviews are due."
        : "当前没有匹配的词卡。 / No matching cards.";
      return '<section class="word-card word-empty"><h2 id="word-card-title" tabindex="-1">' +
        text(message) + "</h2>" + button("浏览全部词卡 / Browse all words", "reset-to-bank", { theme: "secondary" }) + "</section>";
    }
    const index = cards.findIndex((item) => item.word === card.word);
    const record = wordState.cards[card.word];
    const state = record ? (record.rating === "hard" ? "难词 / Hard" : "熟词 / Easy") +
      " · 下次 / Next " + record.due : "未练 / New";
    const answer = ui.revealed
      ? '<div id="word-card-answer" class="word-answer"><dl><dt>词义 / Meaning</dt><dd>' + text(card.meaning) +
        '</dd><dt>搭配 / Phrase</dt><dd>' + text(card.phrase) + '</dd><dt>例句 / Example</dt><dd>' +
        english(card.example) + "</dd></dl></div>"
      : '<p class="word-recall">先试着说出词义或搭配，再翻面核对。<br><span lang="en">Recall a meaning or phrase, then reveal the card.</span></p>';
    return '<section class="word-card"><p class="eyebrow">' + text(source(card)) + "</p>" +
      '<p class="word-counter">' + (index + 1) + " / " + cards.length + " · " + text(state) + '</p>' +
      '<h2 id="word-card-title" tabindex="-1" lang="en">' + text(card.word) + "</h2>" +
      '<div class="word-actions">' + button("听读音 / Pronounce", "pronounce") +
      button(ui.revealed ? "收起答案 / Hide answer" : "翻面看答案 / Reveal answer", "reveal", {
        theme: ui.revealed ? "quiet" : "secondary", pressed: ui.revealed, controls: "word-card-answer"
      }) + "</div>" + answer +
      '<div class="word-actions word-card-footer"><div>' +
      button("上一词 / Previous", "previous", { disabled: index === 0 }) +
      button("下一词 / Next", "next", { disabled: index + 1 >= cards.length }) +
      "</div><div>" + (ui.revealed ? button("难词 / Hard", "hard", { theme: "secondary" }) +
        button("熟词 / Easy", "easy", { theme: "primary" }) : "") + "</div></div></section>";
  }
  function wordList(cards) {
    const pages = Math.max(1, Math.ceil(cards.length / pageSize));
    ui.page = Math.min(ui.page, pages - 1);
    const items = cards.slice(ui.page * pageSize, (ui.page + 1) * pageSize);
    const rows = items.map((card) => '<li>' +
      button(card.word, "open", {
        value: card.word, pressed: ui.selected === card.word, controls: "word-card-view"
      }) + "<small>" + text(card.group ? "Sublist " + card.group : "IELTS-style") + "</small></li>").join("");
    return '<section class="card word-list"><div class="word-list-head"><h2>词卡队列 / Word queue</h2>' +
      '<p class="muted" role="status">' + cards.length + ' 词 / ' + cards.length + " words</p></div>" +
      (rows ? '<ol class="word-queue">' + rows + "</ol>" : "") +
      (pages > 1 ? '<div class="word-actions word-pages">' +
        button("上一页 / Previous page", "prev-page", { disabled: ui.page === 0 }) + "<span>" +
        (ui.page + 1) + " / " + pages + "</span>" +
        button("下一页 / Next page", "next-page", { disabled: ui.page + 1 >= pages }) + "</div>" : "") + "</section>";
  }
  const styles = '<style>' +
    '#word-module{display:block;min-width:0}#word-module h1,#word-module h2,#word-module p{overflow-wrap:anywhere}' +
    '#word-module .word-intro{max-width:54rem}#word-module .word-intro h1{margin-bottom:.25rem}' +
    '#word-module .word-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;padding:1rem 0}' +
    '#word-module .word-stats>div{padding:1rem 1.2rem;border:1px solid var(--line,#d8e1d8);border-radius:16px;background:var(--white,#fff)}' +
    '#word-module .word-stats span,#word-module .word-stats strong{display:block}#word-module .word-stats strong{font-size:1.5rem}' +
    '#word-module .word-actions{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}#word-module .word-actions .btn{min-height:42px}' +
    '#word-module .word-filters{display:grid;grid-template-columns:2fr 1fr 1fr;gap:.65rem;margin:1rem 0}' +
    '#word-module .word-filters label{display:grid;gap:.35rem;font-size:.9rem;font-weight:700;min-width:0}' +
    '#word-module input,#word-module select{width:100%;min-width:0;padding:.7rem .85rem;background:white;color:var(--ink,#132a24);border:1px solid var(--line,#d8e1d8);border-radius:10px;font:inherit}' +
    '#word-module .word-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:1rem;align-items:start}' +
    '#word-module .word-card{min-width:0;background:var(--dark,#122420);color:#f5f8f5;border-radius:20px;padding:clamp(1rem,3vw,2rem)}' +
    '#word-module .word-card h2{font-size:clamp(1.8rem,5vw,3.5rem);letter-spacing:-.03em;margin:.35rem 0 1.25rem;line-height:1.13}' +
    '#word-module .word-card h2:focus{outline:2px solid var(--mint,#c8f985);outline-offset:4px}' +
    '#word-module .word-card .eyebrow,#word-module .word-counter,#word-module .word-recall{color:#cbdcd2}' +
    '#word-module .word-card .btn.quiet,#word-module .word-card .btn.secondary{color:#f5f8f5;border-color:#658072;background:transparent}' +
    '#word-module .word-card button:disabled{opacity:.5;cursor:default}#word-module .word-card .btn:focus-visible{outline-color:var(--mint,#c8f985)}' +
    '#word-module .word-answer{border-top:1px solid #668072;margin-top:1.05rem;padding-top:.45rem}#word-module .word-answer dt{font-weight:700;margin-top:.85rem;color:#dbf6b7}' +
    '#word-module .word-answer dd{margin:.15rem 0 0;overflow-wrap:anywhere}#word-module .word-card-footer{justify-content:space-between;margin-top:1.15rem}' +
    '#word-module .word-card-footer>div{display:flex;gap:.45rem;flex-wrap:wrap}#word-module .word-recall{margin-bottom:1.35rem}' +
    '#word-module .word-list h2{font-size:1.15rem}#word-module .word-list-head p{margin:.1rem 0 .6rem}#word-module .word-queue{list-style:none;padding:0;margin:.25rem 0}' +
    '#word-module .word-queue li{display:flex;gap:.5rem;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line,#d8e1d8)}' +
    '#word-module .word-queue button{text-align:left;justify-content:flex-start;min-width:0;overflow-wrap:anywhere}' +
    '#word-module .word-queue button[aria-pressed=true]{font-weight:700;color:var(--forest,#18543d);background:var(--soft,#e7f2df)}' +
    '#word-module .word-queue small{color:var(--muted,#4f635a);flex-shrink:0}#word-module .word-pages{justify-content:space-between;margin-top:.6rem}' +
    '#word-module .word-reminder{margin:1rem 0 0}#word-module .word-reminder h2{margin-bottom:.1rem}#word-module .word-reminder p{margin-bottom:.7rem}' +
    '#word-module .word-days{list-style:none;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.45rem;padding:0;margin:1rem 0 0}' +
    '#word-module .word-day{border:1px solid var(--line,#d8e1d8);background:var(--paper,#f3f6ef);padding:.55rem;border-radius:10px;min-width:0}' +
    '#word-module .word-day>*{display:block}#word-module .word-day small{overflow-wrap:anywhere;color:var(--muted,#4f635a)}' +
    '#word-module .word-day.is-current{border-color:var(--forest,#18543d);box-shadow:inset 0 0 0 1px var(--forest,#18543d)}#word-module .word-day.is-done{background:var(--soft,#e7f2df)}' +
    '#word-module .word-status{color:var(--forest,#18543d);font-weight:700;margin:.6rem 0}#word-module .word-status:empty{display:none}' +
    '@media (max-width:800px){#word-module .word-grid{grid-template-columns:1fr}#word-module .word-days{grid-template-columns:repeat(4,minmax(0,1fr))}}' +
    '@media (max-width:560px){#word-module .word-stats{gap:.35rem}#word-module .word-stats>div{padding:.6rem}#word-module .word-stats strong{font-size:1.05rem}#word-module .word-stats span{font-size:.85rem}#word-module .word-filters{grid-template-columns:repeat(2,minmax(0,1fr))}#word-module .word-filters label:first-child{grid-column:1/-1}#word-module .word-days{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
    '</style>';

  function render(today) {
    today = getDate(today);
    startPlan(today);
    const cards = currentCards(today);
    const card = cardView(cards);
    const sourceNote = imported.length
      ? '含 ' + imported.length + ' 个 PDF 词条和 ' + originalCards.length + ' 张原创雅思风格词卡。<br><span lang="en">' +
        imported.length + ' entries from the PDF and ' + originalCards.length + ' original IELTS-style practice cards.</span>'
      : originalCards.length + ' 张原创雅思风格词卡。<br><span lang="en">' + originalCards.length + ' original IELTS-style practice cards.</span>';
    return '<scw-word-module id="word-module" data-today="' + today + '">' + styles +
      '<header class="page-head word-intro"><p class="eyebrow" lang="en">VOCABULARY PRACTICE</p>' +
      '<h1>学术与口语词汇</h1><p class="muted">' + sourceNote + '</p></header>' +
      '<div id="word-progress">' + progress(today) + '</div><div id="word-mode" class="word-actions">' +
      modeButtons() + "</div>" + filters() + '<p id="word-message" class="word-status" role="status">' + text(ui.message) + "</p>" +
      '<div id="word-results" class="word-grid"><div id="word-card-view">' + card +
      '</div><div id="word-queue-view">' + wordList(cards) + '</div></div><div id="word-reminders">' +
      reminders(today) + '</div></scw-word-module>';
  }
  function refresh(root, today, focus = false) {
    const cards = currentCards(today);
    const replace = (id, markup) => {
      const node = root.querySelector("#" + id);
      if (node) node.innerHTML = markup;
    };
    replace("word-progress", progress(today));
    replace("word-mode", modeButtons());
    replace("word-card-view", cardView(cards));
    replace("word-queue-view", wordList(cards));
    replace("word-reminders", reminders(today));
    const notice = root.querySelector("#word-message");
    if (notice) notice.textContent = ui.message;
    if (focus) root.querySelector("#word-card-title")?.focus({ preventScroll: true });
  }
  function speak(card, root) {
    const announce = () => {
      ui.message = "当前设备未能朗读。 / This device could not play the pronunciation.";
      const notice = root.querySelector("#word-message");
      if (notice) notice.textContent = ui.message;
    };
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      announce();
      return;
    }
    const speech = new window.SpeechSynthesisUtterance(card.word);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.lang === "en-GB" && item.localService)
      || voices.find((item) => item.lang.startsWith("en") && item.localService)
      || voices.find((item) => item.lang.startsWith("en"));
    speech.lang = voice?.lang || "en-GB";
    speech.rate = 0.85;
    if (voice) speech.voice = voice;
    speech.onerror = (event) => { if (!["canceled", "interrupted"].includes(event.error)) announce(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }
  function clearFilters(root) {
    for (const field of ["search", "group", "filter"]) {
      ui[field] = "";
      const control = root.querySelector('[data-word-field="' + field + '"]');
      if (control) control.value = "";
    }
  }
  function handle(event, today) {
    const root = event.target?.closest?.("#word-module");
    if (!root) return false;
    today = getDate(today || root.dataset.today);
    startPlan(today);
    const field = event.target.dataset?.wordField;
    if ((event.type === "input" && field === "search")
      || (event.type === "change" && ["group", "filter"].includes(field))) {
      ui[field] = event.target.value;
      ui.mode = "bank";
      ui.message = "";
      clearSelection();
      refresh(root, today);
      return true;
    }
    const target = event.type === "click" ? event.target.closest("[data-word-action]") : null;
    if (!target || target.disabled) return false;
    const action = target.dataset.wordAction;
    const value = target.dataset.wordValue;
    const cards = currentCards(today);
    const card = setCurrent(cards);
    const index = cards.findIndex((item) => item.word === ui.selected);
    ui.message = "";
    if (action === "mode" || action === "reset-to-bank") {
      ui.mode = action === "reset-to-bank" ? "bank" : value;
      clearFilters(root);
      clearSelection();
    } else if (action === "open" || action === "previous" || action === "next") {
      const targetIndex = action === "open" ? cards.findIndex((item) => item.word === value)
        : index + (action === "next" ? 1 : -1);
      if (cards[targetIndex]) {
        ui.selected = cards[targetIndex].word;
        ui.page = Math.floor(targetIndex / pageSize);
        ui.revealed = false;
      }
    } else if (action === "prev-page" || action === "next-page") {
      ui.page = Math.max(0, ui.page + (action === "next-page" ? 1 : -1));
    } else if (action === "pronounce" && card) {
      speak(card, root);
      return true;
    } else if (action === "reveal" && card) {
      ui.revealed = !ui.revealed;
    } else if (card && ui.revealed && ["easy", "hard"].includes(action)) {
      rate(card, action, today);
      const remaining = currentCards(today);
      const nextIndex = Math.min(index + Number(remaining.includes(card)), remaining.length - 1);
      const next = remaining[nextIndex];
      ui.selected = next?.word || "";
      ui.page = Math.max(0, Math.floor(nextIndex / pageSize));
      ui.revealed = false;
    } else return false;
    refresh(root, today, action !== "prev-page" && action !== "next-page");
    return true;
  }

  window.SCW_WORD_APP = { render, handle };

  if (window.customElements && !window.customElements.get("scw-word-module")) {
    class WordModule extends window.HTMLElement {
      connectedCallback() {
        if (this.bound) return;
        this.bound = true;
        for (const type of ["click", "input", "change"]) {
          this.addEventListener(type, (event) => handle(event, this.dataset.today));
        }
      }
    }
    window.customElements.define("scw-word-module", WordModule);
  }
})();
