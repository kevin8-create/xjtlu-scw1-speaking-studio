/* Self-reported speaking priorities for the most recent fourteen Shanghai dates. */
(() => {
  "use strict";

  const DAY_MS = 86400000;
  const WINDOW_DAYS = 14;
  const states = [
    ["尚未自评", "Unrated"],
    ["需要练习", "Needs practice"],
    ["还在熟悉", "Building confidence"],
    ["已有把握", "Confident"]
  ];
  // The order breaks ties using the priorities on the student's feedback sheet.
  const skills = [
    {
      id: "cohesion", name: ["组织与衔接", "Organisation and linking"], rubric: "9–11",
      drill: ["用一句话回答 why 题，再用 because 解释原因，用 for example 讲一个结果。最后用 this 指回前面的做法。",
        "Answer a why question in one sentence. Use because for the reason and for example for an outcome. Then use this to refer back to the action."],
      line: "I switched off notifications because I kept losing my place. This change helped me finish the reading before class.",
      check: ["听者能指出 this 指什么，并说出前后两句的联系。", "A listener can identify what this refers to and explain how the ideas connect."]
    },
    {
      id: "detail", name: ["Part 1 具体例子", "Specific examples in Part 1"], rubric: "1–3",
      drill: ["用三个词记下谁、做了什么、结果怎样。讲一次真实经历，然后用一句话说明这个例子怎样支撑你的观点。",
        "Note who was there, what you did, and what changed. Tell the story, then explain how the example supports your point."],
      line: "During our group rehearsal, my teammate could not explain my chart. I added a label, and the next listener understood the comparison.",
      check: ["听者能复述一个动作、一个结果，以及这个结果为什么重要。", "A listener can repeat one action, one outcome, and why it mattered."]
    },
    {
      id: "development", name: ["Part 2 追问展开", "Developing interview answers"], rubric: "4–8",
      drill: ["选一道 Q2，把原因、过程和结果说清楚。换成 Q3 或 Q4 时，先给一个支撑点，再从不同角度给第二个。",
        "For Q2, explain the cause, how it works, and a result. For Q3 or Q4, give one supporting idea, then add a second from a different angle."],
      line: "A shared calendar helps us spot clashes early. It also makes responsibilities clearer because each task has a named owner.",
      check: ["Q2 有可观察的结果，Q3 或 Q4 有两个不重复的支撑点。", "Your Q2 has an observable result, and your Q3 or Q4 has two distinct supporting ideas."]
    },
    {
      id: "vocabulary", name: ["词汇与搭配", "Vocabulary and collocations"], rubric: "12–13",
      drill: ["从本题范文选两个词组。合上范文，用其中一个说自己的情况，隔一次练习再试另一个。",
        "Choose two phrases from a model. Close it and use one in a sentence about your own situation. Recall the second in a later practice."],
      line: "I was under a lot of pressure during the final week, so I agreed on a realistic deadline with my group.",
      check: ["词组搭配正确，而且你能换一个话题再用一次。", "The words fit together naturally, and you can use the phrase on a different topic."]
    },
    {
      id: "grammar", name: ["完整句与复杂句", "Complete and complex sentences"], rubric: "14–15",
      drill: ["先说一个独立完整的观点，再用 although 加一个限制条件。换一道题，用 if 表达条件和结果。",
        "Give a complete main idea, then add a limitation with although. On another prompt, use if to link a condition and a result."],
      line: "Although working from home saves commuting time, I prefer the office when I need quick feedback.",
      check: ["每个从句都有主语和谓语，听者能找到主句。", "Each clause has a subject and a verb, and the listener can identify the main clause."]
    },
    {
      id: "delivery", name: ["清晰度、重音与语调", "Clarity, stress and intonation"], rubric: "16–17",
      drill: ["挑一句有对比的表达，用斜杠划出意群。重读对比词，再慢一点重说一遍，请听者说出你的偏好。",
        "Take a sentence with a contrast. Mark the thought groups with slashes, stress the contrasting words, then repeat it more slowly. Ask a listener what you prefer."],
      line: "At HOME I can concentrate / but in the OFFICE I can ask for help.",
      check: ["第一次听的人能听清对比，也能分辨最后一个词。", "A first-time listener can hear the contrast and recognise the final word."]
    }
  ];

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  function copy(pair) {
    return '<span lang="zh-CN">' + esc(pair[0]) + '</span><br><span lang="en" class="translation">' + esc(pair[1]) + '</span>';
  }
  function inline(pair) {
    return esc(pair[0]) + ' / <span lang="en">' + esc(pair[1]) + '</span>';
  }
  function dayTime(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
    const ms = Date.parse(date + "T00:00:00Z");
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === date ? ms : NaN;
  }
  function ratingsOf(value) {
    const result = {};
    for (const skill of skills) {
      const raw = value?.[skill.id];
      if ([1, 2, 3, "1", "2", "3"].includes(raw)) result[skill.id] = Number(raw);
    }
    return result;
  }
  // Normalisation keeps one entry per date, and one explicit value per skill/date.
  function recent(history, today) {
    const until = dayTime(today);
    if (!Number.isFinite(until)) return [];
    const byDate = new Map();
    for (const item of Array.isArray(history) ? history : []) {
      const ms = dayTime(item?.date);
      if (!Number.isFinite(ms) || ms > until || ms < until - (WINDOW_DAYS - 1) * DAY_MS) continue;
      const ratings = ratingsOf(item?.ratings);
      if (Object.keys(ratings).length) {
        byDate.set(item.date, {...byDate.get(item.date), ...ratings});
      }
    }
    return Array.from(byDate, ([date, ratings]) => ({date, ratings})).sort((a, b) => a.date.localeCompare(b.date));
  }
  function record(history, today, values) {
    const previous = recent(history, today);
    const ratings = ratingsOf(values);
    if (!Number.isFinite(dayTime(today)) || !Object.keys(ratings).length) return previous;
    return recent([...previous, {date: today, ratings}], today);
  }
  function analyse(history, today) {
    const entries = recent(history, today);
    const rows = skills.map(skill => {
      const evidence = entries.filter(entry => entry.ratings[skill.id]);
      const last = evidence.at(-1);
      const before = evidence.at(-2);
      return {
        skill, value: last?.ratings[skill.id] || 0, date: last?.date || "",
        previous: before?.ratings[skill.id] || 0, previousDate: before?.date || ""
      };
    });
    const needs = rows.filter(row => row.value === 1 || row.value === 2).sort((a, b) => a.value - b.value);
    const unrated = rows.filter(row => !row.value);
    const priority = needs[0] || unrated[0] || rows.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
    const basis = needs.length ? ["来自你的自评", "Your self-rating"] :
      unrated.length ? ["参考课堂反馈，待自评", "Class feedback, awaiting your rating"] :
        ["保持熟练度", "Maintenance practice"];
    return {entries, rows, needs, priority, basis};
  }
  function status(row) {
    if (!row.value) return inline(states[0]);
    let result = inline(states[row.value]) + " · " + esc(row.date);
    if (row.previous) {
      const change = row.value - row.previous;
      const label = change > 0 ? ["更有把握", "confidence rose"] :
        change < 0 ? ["把握下降", "confidence fell"] : ["自评持平", "same rating"];
      result += "<br>" + inline(label) + " · " + esc(row.previousDate) + " → " + esc(row.date);
    }
    return result;
  }
  function ratingForm(summary, inPlan) {
    const options = states.map((state, index) => '<option value="' + (index || "") + '">' +
      (index ? esc(state.join(" / ")) : "本次跳过 / Skip this time") + "</option>").join("");
    const rows = summary.rows.map(row => '<label class="focus-field"><strong>' + inline(row.skill.name) +
      '</strong><small class="muted">' + status(row) + '</small><select data-focus-rating="' +
      row.skill.id + '">' + options + '</select></label>').join("");
    return '<details class="answer-details focus-assessment"><summary>自评 6 项能力 / Rate six skills</summary>' +
      '<p class="muted">' + copy(["只选今天实际练过的项目。下方显示近 14 天的最近一次自评，保存后更新建议。", 
        "Rate the skills you practised today. Each field shows your latest rating from the past 14 days. Save to update your suggestions."]) +
      '</p><div class="focus-fields">' + rows + "</div>" +
      (inPlan ? '<button class="btn secondary small" type="button" data-action="save-focus">保存自评 / Save ratings</button>' :
        '<p class="translation">选好后点本页「保存复盘」。 / Select Save review below to keep your ratings.</p>') + '</details>';
  }
  function renderHome(history, today) {
    const summary = analyse(history, today);
    return '<section class="card focus-home"><div><p class="eyebrow">TODAY’S FOCUS</p><h2>' +
      inline(summary.priority.skill.name) + '</h2><p class="muted">' + inline(summary.basis) + '</p></div>' +
      '<a class="btn secondary small" href="#plan" data-view="plan">查看针对性练习 / View your drill</a></section>';
  }
  function renderReview(history, today) {
    return ratingForm(analyse(history, today), false);
  }
  function renderPlan(history, today, dayNumber = 1) {
    const summary = analyse(history, today);
    const chosen = summary.priority.skill;
    const day = Math.max(1, Math.min(14, Math.floor(Number(dayNumber)) || 1));
    const stage = day === 7 || day === 14 ?
      ["完成今天的整套模拟，再用下方标准回听本次表现。", "Do today's full mock, then use the criterion below to review your answer."] :
      day < 7 ? ["用今天计划中的 3 分钟，把下面这项练习做两遍。", "Use three minutes of today's plan for two attempts at the drill below."] :
        ["从今天的练习中挑一个新话题，把这一技巧用进去，再按下面的标准检查。", "Take a fresh topic from today's practice, apply this skill, then check it against the criterion below."];
    const other = summary.needs.filter(row => row.skill.id !== chosen.id).slice(0, 2);
    const remaining = other.length ? '<p class="focus-other muted">接下来可练 / Next to practise · ' +
      other.map(row => inline(row.skill.name)).join(" · ") + "</p>" : "";
    return '<section class="panel focus-plan"><div class="focus-heading"><div><p class="eyebrow">YOUR TWO-WEEK FOCUS</p>' +
      '<h2>两周重点练什么 / What to practise</h2></div><span class="pill">' +
      summary.entries.length + ' 天有自评 / rated days</span></div>' +
      '<div class="focus-priority"><p class="muted">' + inline(summary.basis) +
      '</p><h3>' + inline(chosen.name) + '</h3><p class="muted">评分表 / Rubric ' + esc(chosen.rubric) + '</p>' +
      '<p><strong>Day ' + day + '</strong> · ' + copy(stage) + '</p><p>' + copy(chosen.drill) +
      '</p><blockquote class="focus-example" lang="en">' + esc(chosen.line) + '</blockquote>' +
      '<p class="focus-check"><strong>回听标准 / Listen for</strong><br>' + copy(chosen.check) + '</p>' +
      remaining + '<div class="button-row"><button class="btn primary small" type="button" data-action="daily">用今日题练 / Practise today</button></div></div>' +
      '<div class="focus-weeks"><div><h3>第一周 / Week 1</h3><p>' +
      copy(["第 1 天留一条原始回答。第 2–6 天在同类题上练当前重点，第 7 天在模拟中复查一次。", 
        "Keep a baseline answer on Day 1. Practise this skill on similar prompts on Days 2–6 and check it in the Day 7 mock."]) +
      '</p></div><div><h3>第二周 / Week 2</h3><p>' +
      copy(["第 8–13 天换两个不同主题练同一技巧，第 14 天用新模拟作答，对照第 1 天的原话。", 
        "Apply the skill to two different topics on Days 8–13. On Day 14, try a fresh mock and compare with your words from Day 1."]) +
      '</p></div></div>' + ratingForm(summary, true) + '</section>';
  }

  window.SCW_FOCUS = Object.freeze({record, analyse, renderHome, renderPlan, renderReview});
})();
