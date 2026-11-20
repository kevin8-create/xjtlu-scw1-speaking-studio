(() => {
  "use strict";

  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
  const english = value => '<span lang="en">' + escape(value) + '</span>';
  const quotes = () => window.SCW_QUOTES || [];
  const videos = () => window.SCW_MEDIA || [];
  const labels = () => window.SCW_BANK?.topicLabels || {};
  let nextTopic = "";

  function pair(value) {
    const [chinese, ...englishParts] = String(value ?? "").split(" / ");
    if (!englishParts.length) return escape(chinese);
    return '<span lang="zh-CN">' + escape(chinese) + '</span><br>' +
      english(englishParts.join(" / "));
  }

  function topicTag(topic) {
    const chinese = labels()[topic];
    return '<span class="pill">' + (chinese ? escape(chinese) + ' · ' : "") +
      english(topic) + '</span>';
  }

  function sourceLink(url, chinese, translated) {
    let destination;
    try { destination = new URL(url); }
    catch { return ""; }
    if (destination.protocol !== "https:") return "";
    return '<a class="btn secondary small" href="' + escape(destination.href) +
      '" target="_blank" rel="noopener noreferrer">' + escape(chinese) +
      ' / ' + english(translated) + '</a>';
  }

  function exercise(item) {
    return '<details class="answer-details"><summary>对应题与开口练习 / Prompt and drill</summary>' +
      '<p lang="en"><strong>' + escape(item.prompt) + '</strong></p>' +
      '<p>' + pair(item.drill) + '</p></details>';
  }

  function quoteCard(item) {
    return '<article class="card topic-card"><div class="button-row">' + topicTag(item.topic) +
      '<span class="eyebrow">原文引句 · QUOTATION</span></div>' +
      '<blockquote><h3 lang="en">“' + escape(item.quote) + '”</h3></blockquote>' +
      '<p class="muted" lang="en">' + escape(item.author) + ' · <cite>' +
      escape(item.work) + '</cite></p>' +
      '<p>' + escape(item.zh) + '</p>' +
      '<p><strong>口语改述 / Spoken paraphrase</strong><br>' + english(item.paraphrase) + '</p>' +
      '<p><strong>答题示例 / Example response</strong><br>' + english(item.example) + '</p>' +
      exercise(item) +
      '<div class="button-row">' + sourceLink(item.url, "查看原文", "Read source") + '</div></article>';
  }

  function videoCard(item) {
    return '<article class="card topic-card"><div class="button-row">' +
      item.topics.map(topicTag).join("") + '</div>' +
      '<p class="eyebrow">' + escape(item.type) + '</p>' +
      '<h3 lang="en">' + escape(item.title) + '</h3>' +
      '<p class="muted" lang="en">' + escape(item.publisher) + '</p>' +
      '<p class="translation">' + pair(item.access) + '</p>' +
      '<p><strong>怎么听 / What to listen for</strong><br>' + pair(item.segment) + '</p>' +
      '<p><strong class="phrase" lang="en">' + escape(item.phrase) + '</strong> · ' +
      escape(item.meaning) + '</p><p lang="en">' + escape(item.example) + '</p>' +
      exercise(item) +
      '<div class="button-row">' + sourceLink(item.url, "打开来源播放器", "Open publisher video") +
      '</div></article>';
  }

  function group(chinese, heading, cards) {
    if (!cards.length) return "";
    return '<section><div class="section-head"><div><p class="eyebrow">' + english(heading) +
      '</p><h2>' + escape(chinese) + '</h2></div></div><div class="grid two-col">' +
      cards.join("") + '</div></section>';
  }

  class ResourceLibrary extends HTMLElement {
    connectedCallback() {
      if (this.querySelector("[data-library-results]")) return;
      const topics = Array.from(new Set([
        ...Object.keys(labels()), ...quotes().map(item => item.topic),
        ...videos().flatMap(item => item.topics)
      ]));
      this.innerHTML = '<header class="page-head"><p class="eyebrow">SPEAKING LIBRARY</p>' +
        '<h1>名言与视频素材</h1><p class="muted">按题目主题选一张卡。先听或读一小段，再试用自己的例子回答。<br>' +
        english("Choose a card by topic. Read or listen to a short stretch, then answer using an example of your own.") +
        '</p></header><div class="form-row"><label>主题 / Topic <select data-library-topic>' +
        '<option value="">全部主题 / All topics</option>' + topics.map(topic => {
          const chinese = labels()[topic];
          return '<option value="' + escape(topic) + '">' +
            escape(chinese ? chinese + ' / ' + topic : topic) + '</option>';
        }).join("") + '</select></label><label>类型 / Type <select data-library-kind>' +
        '<option value="">名言和视频 / All formats</option><option value="quote">名言 / Quotations</option>' +
        '<option value="video">视频 / Videos</option></select></label></div>' +
        '<p class="translation" role="status" data-library-status></p><div data-library-results></div>';
      const topicFilter = this.querySelector("[data-library-topic]");
      if (topics.includes(nextTopic)) topicFilter.value = nextTopic;
      nextTopic = "";
      this.addEventListener("change", this.update);
      this.update();
    }

    update() {
      const topic = this.querySelector("[data-library-topic]").value;
      const kind = this.querySelector("[data-library-kind]").value;
      const quoteMatches = kind === "video" ? [] : quotes().filter(item => !topic || item.topic === topic);
      const videoMatches = kind === "quote" ? [] : videos().filter(item => !topic || item.topics.includes(topic));
      const status = this.querySelector("[data-library-status]");
      const quoteCount = quoteMatches.length + (quoteMatches.length === 1 ? " quotation" : " quotations");
      const videoCount = videoMatches.length + (videoMatches.length === 1 ? " video" : " videos");
      status.innerHTML = quoteMatches.length + ' 条名言 · ' + videoMatches.length +
        ' 个视频<br>' + english(quoteCount + ' · ' + videoCount);
      this.querySelector("[data-library-results]").innerHTML =
        group("名言与口语改述", "QUOTATIONS AND PARAPHRASES", quoteMatches.map(quoteCard)) +
        group("视频跟听与例句", "VIDEO PRACTICE", videoMatches.map(videoCard)) ||
        '<p class="empty">这个筛选组合没有素材。请换一个主题或类型。<br>' +
        english("No cards match these filters. Try a different topic or format.") + '</p>';
    }
  }

  if (!customElements.get("scw-resource-library")) {
    customElements.define("scw-resource-library", ResourceLibrary);
  }

  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[data-scw-library-topic]");
    if (link) nextTopic = link.dataset.scwLibraryTopic;
  }, true);

  window.SCW_LIBRARY = {
    render() {
      return '<scw-resource-library style="display:block"></scw-resource-library>';
    },
    related(talkTopic, interviewTopic) {
      const topics = [...new Set([talkTopic, interviewTopic])].filter(topic =>
        quotes().some(item => item.topic === topic) || videos().some(item => item.topics.includes(topic))
      );
      if (!topics.length) return "";
      return '<section class="card"><h3>换一个例子再答 / Try it again with a new example</h3>' +
        '<p class="translation">从同主题的名言或视频选一个表达，再回答一次。<br>' +
        english("Pick a phrase from a quotation or video on the same topic, then answer again.") +
        '</p><div class="button-row">' + topics.map(topic =>
          '<a class="btn quiet small" href="#library" data-view="library" data-scw-library-topic="' +
          escape(topic) + '">' + escape(labels()[topic] || topic) + ' · ' + english(topic) + '</a>'
        ).join("") + '</div></section>';
    }
  };
})();
