(() => {
  "use strict";

  const bilingual = (chinese, english) => chinese + "\n" + english;
  const step = (label, chinese, english) => ({ label, text: bilingual(chinese, english) });
  const day = (chinese, english, focus, steps, success) => ({
    title: bilingual(chinese, english), focus, steps, success
  });
  const item = (label, phrase, example) => ({ label, phrase, example });
  const section = (chinese, english, note, items) => ({
    title: bilingual(chinese, english), note, items
  });
  const method = (chinese, english, description, source, url) => ({
    title: bilingual(chinese, english), description, source, url
  });
  const check = (group, chinese, english, tip) => ({
    group, label: bilingual(chinese, english), tip
  });

  window.SCW_LEARNING = {
    days: [
      day("录下起点", "Record a baseline",
        bilingual("用官方计时跑一次，找到一个最影响听者的问题。", "Do one timed run and identify one issue that most affects the listener."),
        [
          step("8 min · 模拟 / Mock", "做一组 Part 1 和 Part 2，开口作答并录音。", "Answer one Part 1 and one Part 2 set aloud and record yourself."),
          step("7 min · 回听 / Review", "按自查表找两处，记下时间点和原话。", "Use the checklist to mark two moments and note what you said."),
          step("5 min · 重答 / Retry", "只修最影响理解的一处，再录一次相关题。", "Fix the issue that most affects clarity and record that answer again.")
        ],
        bilingual("留下一条可核对的目标，例如「Q2 要说出结果」。", "Write one observable target, such as “state the result in Q2.”")),
      day("把例子说具体", "Make your example specific",
        bilingual("Part 1 先交代主题，再补一个场景、动作和结果。", "In Part 1, name the topic, then add a scene, an action, and a result."),
        [
          step("5 min · 素材 / Gather", "想起一次在西浦上课、合作或通勤的小事，用五个词记下。", "Recall a small incident from class, group work, or commuting and note five words."),
          step("8 min · 计时 / Time it", "两次各准备 1 分钟，说最多 2 分钟。第二次换细节。", "Take one minute to prepare and up to two to speak, twice. Change a detail on the second attempt."),
          step("5 min · 回听 / Review", "定位例子开始的那句，确认它支撑了你先说的观点。", "Find where the example begins and check whether it supports your earlier point.")
        ],
        bilingual("听者能说出谁做了什么、发生了什么变化。", "A listener can say who did what and what changed.")),
      day("直接回答 Q1", "Answer Q1 directly",
        bilingual("定义要易懂，列举要有分类。", "Give an accessible definition or organise your list into categories."),
        [
          step("5 min · 回忆 / Recall", "不看笔记复述昨天的一个具体例子。", "Retell one concrete example from yesterday from memory."),
          step("8 min · 快答 / Quick answers", "挑三道定义或列举题，每道先给核心回答，再加一句例子。", "Try three definition or list prompts. Give the main answer, then one example."),
          step("5 min · 重答 / Retry", "挑最模糊的一题，换一组分类或例子重新说。", "Retry the vaguest answer with a clearer category or example.")
        ],
        bilingual("每个答案的第一句已经回答了题目。", "The first sentence of each answer already addresses the question.")),
      day("把 Q2 讲成因果链", "Build a causal chain in Q2",
        bilingual("原因、过程、结果各说清楚。", "Explain the reason, how it works, and the result."),
        [
          step("5 min · 拆解 / Analyse", "先自主作答，再从范文找 because、so 或能说明过程的一句。", "Answer first, then look for a causal link or explanation in the model."),
          step("8 min · 应用 / Apply", "用两道不同的 why 题练同一结构，第二题换话题。", "Use the same structure on two why questions about different topics."),
          step("5 min · 检查 / Check", "把 good、bad 或 important 换成可观察结果，例如节省了十分钟。", "Replace a vague judgement with an observable outcome, such as saving ten minutes.")
        ],
        bilingual("两题都能说出一个具体后果。", "Both answers name a specific consequence.")),
      day("提出可做的办法", "Suggest practical actions",
        bilingual("Q3 讲谁来做、怎么做、为什么有用。", "In Q3, name who can act, how they can act, and why it helps."),
        [
          step("5 min · 备点 / Prepare", "为一个校园问题找两个不同层面的办法，例如个人习惯和小组规则。", "Find two actions for a campus issue, such as a personal habit and a group rule."),
          step("8 min · 即答 / Respond", "听到 suggest 或 how can 后，直接说出做法，为一条加上实施场景。", "On hearing suggest or how can, state the action directly and give a setting for one idea."),
          step("5 min · 换题 / Transfer", "用同一结构回答另一个问题，换掉行动者和场景。", "Apply the structure to a second prompt with a different actor and setting.")
        ],
        bilingual("两条建议互不重复，听者明白第一步怎么做。", "The suggestions are distinct and a listener can identify the first step.")),
      day("表明立场并权衡", "Take and qualify a position",
        bilingual("Q4 先表态，给两个支撑点，再按题目需要加条件。", "In Q4, give your position and two reasons. Add a condition if it helps answer the question."),
        [
          step("5 min · 口头回忆 / Recall", "不看笔记说出昨天的一条建议，再补为什么有用。", "Recall one suggestion from yesterday and explain why it helps."),
          step("10 min · 双角度 / Two angles", "练两道观点题。每题从不同角度给两个理由，例如便利性和机会。", "Try two opinion prompts. For each, give reasons from different angles, such as convenience and access."),
          step("5 min · 加条件 / Qualify", "用 It depends on 或 provided that 给一个实际条件。", "Add one real condition, using It depends on or provided that.")
        ],
        bilingual("第一句有明确立场，理由各自回答了为什么。", "The first sentence states a position and both reasons explain why.")),
      day("第一次完整模拟", "Run your first full mock",
        bilingual("连贯完成 Part 1 和不同主题的 Part 2。", "Complete Part 1 and a Part 2 set on a different topic in one sitting."),
        [
          step("8 min · 模拟 / Mock", "用 1 分钟准备和 2 分钟陈述。访谈共最多 4 分钟，听一题答一题。", "Use one minute to prepare and up to two to speak. Spend up to four minutes on the interview, taking one question at a time."),
          step("7 min · 比较 / Compare", "与 Day 1 录音比较答题速度、例子和结尾。", "Compare the pace, examples, and ending with your Day 1 recording."),
          step("5 min · 修正 / Repair", "补练一个跑题、卡顿或没有完成的句子。", "Redo one off-topic, hesitant, or unfinished sentence.")
        ],
        bilingual("记录一个确认进步的时间点和下一次要修的一个问题。", "Note a timestamp for one improvement and choose one issue for the next run.")),
      day("重复讲，再换题", "Repeat, then switch prompts",
        bilingual("压缩重讲以减少绕话，随后检查能否迁移到新题。", "Retell the ideas in less time, then test whether the structure transfers to a new prompt."),
        [
          step("5 min · 回忆 / Recall", "选一个旧话题，只写三个关键词。", "Choose an earlier topic and write three keywords."),
          step("9 min · 重讲 / Retell", "同一话题依次讲 2 分钟、90 秒、60 秒，保留理由及例子。", "Retell the same topic in two minutes, 90 seconds, and 60 seconds. Keep the reason and example."),
          step("6 min · 新题 / Transfer", "抽一个未练过的题，用同一结构答，换成贴合新题的理由和例子。", "Draw an unfamiliar prompt and use the structure with a new relevant reason and example.")
        ],
        bilingual("短版本仍有例子，新题第一句切题。", "The short version still has an example and the new answer opens on topic.")),
      day("意群和重音", "Practise thought groups and stress",
        bilingual("让听者听出新的信息、对比和结论。", "Make new information, contrasts, and conclusions easy to hear."),
        [
          step("5 min · 示范 / Model", "挑范文两句，用斜线标意群，圈出两个关键词。", "Take two model sentences. Mark phrase breaks and circle two stressed words."),
          step("7 min · 模仿 / Imitate", "听一小段英语示范，跟读两次，再用同样节奏说自己的句子。", "Listen to a short spoken model, imitate it twice, then say your own sentence with the same phrasing."),
          step("5 min · 盲听 / Listen back", "关闭文本回听，检查关键词与词尾，找一处重录。", "Listen without the text. Check key words and word endings, then rerecord one sentence.")
        ],
        bilingual("不看原文也能辨认重读词和词尾。", "The stressed words and endings are recognisable without the script.")),
      day("让词组进入新题", "Reuse phrases in new topics",
        bilingual("从记单词转到调用搭配和素材。", "Retrieve useful collocations and apply them to different prompts."),
        [
          step("5 min · 口头抽查 / Recall", "合上词表，回忆三个前几天用过的搭配。", "Close the phrase list and recall three collocations from earlier sessions."),
          step("8 min · 变题 / Apply", "换三个情境分别造句，如学习、通勤或团队沟通。", "Use them in three new situations, such as study, commuting, or group communication."),
          step("5 min · 复现 / Repeat", "过一轮别的题再回想，标出仍说不出来的一个。", "Answer another prompt, then recall the phrases again and mark the one that still eludes you.")
        ],
        bilingual("能把至少两个搭配自然用在陌生题里。", "Use at least two collocations naturally in an unfamiliar answer.")),
      day("修一类语法问题", "Repair one recurring grammar issue",
        bilingual("用准确的完整句表达原因、让步或条件。", "Use complete sentences to express a reason, concession, or condition."),
        [
          step("5 min · 转写 / Transcribe", "从旧录音转写三句，圈出反复出现的语法问题。", "Transcribe three lines from an earlier recording and identify one recurring issue."),
          step("8 min · 修句 / Repair", "针对该问题各说一句简单句和一句复合句。", "Practise one simple sentence and one complex sentence that handle the issue correctly."),
          step("5 min · 复用 / Reuse", "放进一个新的计时答案，检查语法是否仍然准确。", "Use the pattern in a fresh timed answer and check that it stays accurate.")
        ],
        bilingual("复讲时主句完整，所练的语法结构准确出现一次。", "Your retry has a complete main clause and uses the target pattern accurately once.")),
      day("练听题与追问", "Practise listening and follow-ups",
        bilingual("听出题目要你定义、解释、建议还是判断。", "Hear whether the question asks you to define, explain, suggest, or judge."),
        [
          step("5 min · 确认 / Clarify", "练一句请对方重复和一句确认题意。两句各说两遍。", "Say one request for repetition and one clarification question twice."),
          step("9 min · 随机问答 / Live practice", "请同学逐个念题并加一句 Why? 或 Can you give an example? 也可听网站朗读。", "Ask a classmate to read questions one at a time and add Why? or Can you give an example? You can also use the site’s read-aloud feature."),
          step("5 min · 立即回答 / Respond", "记录听错的一题，下次先辨认动作词，再直接作答。", "Note a question you misheard. On the next attempt, spot the question verb first and answer directly.")
        ],
        bilingual("能用一句话回应题目，再接例子或解释。", "Answer in one sentence, then add an example or explanation.")),
      day("模拟陌生题", "Mock with unfamiliar prompts",
        bilingual("在压力下使用练过的结构和新的理由。", "Use familiar structures with fresh reasons under time pressure."),
        [
          step("8 min · 完整模拟 / Full mock", "随机抽题。一次完成两部分，先答完再看范文。", "Draw random questions. Finish both parts in one sitting before opening the models."),
          step("7 min · 回听 / Review", "请同学复述你的立场和例子，或自己隔几分钟盲听。", "Ask a classmate to repeat your position and example, or replay your answer after a short break without looking at notes."),
          step("5 min · 修一个点 / Repair", "只补一处没有展开的答案，录一次新版本。", "Develop one thin answer and record it again.")
        ],
        bilingual("两部分切题，访谈能说出至少一个具体例子和一项可操作建议。", "Both parts stay on topic. The interview includes at least one concrete example and one actionable suggestion.")),
      day("轻量复盘与考前流程", "Review lightly and rehearse the routine",
        bilingual("复习可跨题复用的表达，确认自己的考场安排。", "Review adaptable language and confirm your own exam logistics."),
        [
          step("5 min · 回忆 / Recall", "从记忆说出三条短语、两个例子和一个过渡句。", "Recall three phrases, two examples, and one transition from memory."),
          step("8 min · 小模拟 / Final run", "做一组计时练习。卡住时用改述句继续。", "Do one timed set. When you get stuck, paraphrase and keep going."),
          step("4 min · 确认 / Check", "在官方公告和 e-Bridge 确认个人时间、地点与证件要求。", "Confirm your own time, location, and ID requirements in the official notice and e-Bridge.")
        ],
        bilingual("能在不看范文的情况下完成两部分，已核对自己的考场信息。", "You can complete both parts without a model and have checked your own exam details."))
    ],
    toolkit: [
      section("个人陈述", "Part 1 · Individual talk",
        bilingual("准备 1 分钟时记关键词。前几秒回应题目，随后发展一到两个要点，每次举例都说出动作与结果。", "Use the preparation minute to note keywords. Answer the prompt early, develop one or two ideas, and make the action and outcome audible."),
        [
          item("切题开头 / Open directly", "I’d like to talk about [topic], which…", "I’d like to talk about our shared calendar, which made a group assignment easier to organise."),
          item("交代场景 / Set the scene", "This happened when…", "This happened when three of us were trying to finish a presentation in the same week."),
          item("说实际发生的事 / Give a detail", "To give a specific example, …", "To give a specific example, I added each deadline to the calendar and assigned one task to each person."),
          item("解释它为何重要 / Explain why it mattered", "What made a difference was…", "What made a difference was that everyone could check the latest plan without sending another message."),
          item("落回题意 / Close on topic", "That experience showed me that…", "That experience showed me that a device is most useful when it solves a clear problem.")
        ]),
      section("定义与列举", "Part 2 · List or define",
        bilingual("给简明定义或列出两到三类，挑一个说明用途。", "Give a short definition or two to three categories. Explain what one example is used for."),
        [
          item("定义 / Define", "In this context, [X] means…", "In this context, active learning means using an idea yourself, such as explaining it to a partner."),
          item("分类 / Group", "Two common types are … and …", "Two common types are formal feedback, such as comments on an essay, and informal feedback, such as a question from a classmate."),
          item("举常见项 / Name an example", "A typical example would be…", "A typical example would be a shared study room where a group can practise a presentation.")
        ]),
      section("解释原因", "Part 2 · Explain",
        bilingual("说清一个过程，并用可观察的结果收尾。", "Explain how something happens and end with an observable result."),
        [
          item("点出原因 / Give a reason", "One reason is that…", "One reason students miss messages is that group chats can get very busy."),
          item("连接过程与结果 / Show the link", "When [X] happens, [Y]. As a result, …", "When important dates are buried in a chat, people may overlook them. As a result, somebody can miss a deadline."),
          item("给可观察结果 / Ground the answer", "You can see this when…", "You can see this when two people bring different versions of the same slide to a rehearsal.")
        ]),
      section("提出建议", "Part 2 · Suggest",
        bilingual("给两个不同做法。为至少一个做法交代行动者、步骤和效果。", "Give two distinct ideas. For at least one, explain who acts, what they do, and why it helps."),
        [
          item("可操作建议 / Propose an action", "One practical step would be to…", "One practical step would be to put key group decisions in a short shared document."),
          item("另加一项 / Add another action", "Another option would be for [person] to…", "Another option would be for the group leader to recap responsibilities at the end of each meeting."),
          item("解释何时有效 / Add a condition", "This would be especially useful when…", "This would be especially useful when team members have different class schedules.")
        ]),
      section("观点与推测", "Part 2 · Argue or speculate",
        bilingual("先表态，给两条独立理由。谈未来时说明哪种条件会影响判断。", "State a position and give two independent reasons. Say what could affect a prediction."),
        [
          item("清楚表态 / State your view", "On balance, I think…", "On balance, I think group projects are useful because students can learn from each other and practise explaining decisions."),
          item("作出让步 / Acknowledge a limit", "That can be true in some cases. However, …", "That can be true in some cases. However, a clear division of tasks can make marking fairer."),
          item("限定判断 / Qualify your view", "I’d support it, provided that…", "I’d support recorded lectures, provided that students also have time to ask questions in class."),
          item("推测变化 / Make a prediction", "If [X] continues, we may see…", "If more assignments move online, we may see students using shared workspaces more often.")
        ]),
      section("卡住时继续说", "Conversation repair",
        bilingual("听不清可以请求重复，忘词可以用更熟悉的表达把意思说完整。", "Ask for repetition if you miss a question. If a word escapes you, finish the thought using familiar language."),
        [
          item("请重复 / Ask for repetition", "Sorry, could you repeat the question, please?", "Sorry, could you repeat the last part of the question, please?"),
          item("核对题意 / Confirm the meaning", "Do you mean [X], or [Y]?", "Do you mean commuting to campus, or travelling around the city in general?"),
          item("用熟词改述 / Paraphrase", "What I mean is…", "What I mean is that students can choose when to review the material."),
          item("把说错的词修好 / Correct yourself", "Let me put that another way.", "Let me put that another way. The route was shorter, but the bus came less often.")
        ]),
      section("关联句与完整句", "Connect ideas with complete sentences",
        bilingual("先保证意思完整，再选最适合的连接方式。每个 because 或 although 从句都要能接回完整主句。", "Complete the thought, then choose the best connection. Check that each because or although clause connects to a full main clause."),
        [
          item("给原因 / Explain", "[Main clause] because [reason].", "I stopped checking messages at night because they made it harder to concentrate the next morning."),
          item("让步 / Concede", "Although [limit], [main clause].", "Although online classes are convenient, some students find it easier to focus in a classroom."),
          item("条件 / Give a condition", "If [condition], [likely result].", "If the campus adds more cycle racks, more students may choose to ride to class."),
          item("精确定义对象 / Specify", "[Noun] that [description]…", "A timetable that groups lectures together can reduce commuting time."),
          item("回指结果 / Refer back", "This change meant that…", "We posted the instructions on one page. This change meant that everyone used the same version.")
        ]),
      section("校园、学习与沟通", "University, education, and communication",
        bilingual("从校园小事里选能交代背景、行动和结果的片段。用你真实经历过的细节替换示例里的场景。", "Start with a small campus incident that has context, action, and an outcome. Substitute details from your own experience."),
        [
          item("校园资源 / University", "book a study room · academic support", "We booked a study room for an hour and rehearsed our slides without interrupting other students."),
          item("复习做法 / Education", "space out revision · act on feedback", "I spaced out my revision and used Tuesday’s feedback to rewrite the opening on Friday."),
          item("小组合作 / Communication", "clarify responsibilities · recap a decision", "I clarified responsibilities by posting a short recap showing who would bring each file."),
          item("同伴影响 / People", "set a good example · give constructive feedback", "My partner gave constructive feedback by pointing out where my example stopped supporting my claim.")
        ]),
      section("健康、技术与工作", "Health, technology, and jobs",
        bilingual("说出谁会受益、在哪个情境、效果是什么。避免用笼统的 good 或 bad 当作唯一理由。", "Say who benefits, when, and what changes. Give a specific outcome to support a general claim."),
        [
          item("健康习惯 / Health", "stick to a routine · take regular breaks", "I take a short walk between classes, which helps me feel ready for the next one."),
          item("隐私与便利 / Technology", "adjust privacy settings · enable notifications", "I adjusted my privacy settings so that classmates could view my work without seeing my personal information."),
          item("职业技能 / Jobs", "meet a deadline · deal with feedback", "A good designer needs time management skills because several clients may expect updates on the same day.")
        ]),
      section("环境、地点与变化", "Environment, places, and change",
        bilingual("从看得到的空间、行为或变化切入，用时间、方便程度和谁受益来发展理由。", "Start from a visible place, action, or change. Develop your reason through time, convenience, or who benefits."),
        [
          item("校园环保 / Environment", "sort waste · reduce food waste", "Clear labels on campus bins could make it easier for students to sort waste correctly."),
          item("城市空间 / Places", "within walking distance · a quiet study area", "A small park within walking distance of campus gives students somewhere to take a break."),
          item("通勤变化 / Change", "cut commuting time · improve access", "A direct bus could cut commuting time for students who live far from the nearest metro station."),
          item("一份素材换三题 / Adapt a story", "travel time · access · lower emissions", "A direct bus works as a change topic if you discuss the new route, a places topic if you discuss access, or an environment topic if you discuss fewer car journeys.")
        ])
    ],
    methods: [
      method("缩短重讲，再换一题", "Timed repetition, then a new prompt",
        bilingual("同一道题讲 2 分钟、90 秒、60 秒，每次保留观点、理由和例子。最后换一道题测试能否迁移。研究考察的是 4/3/2 分钟重讲，本站把时间缩短来适配 SCW1。", "Retell one answer in 2 minutes, 90 seconds, then 60 seconds. Keep the claim, reason, and example. Try a new prompt afterward to check transfer. The study tested 4/3/2-minute repetition. This is a shorter SCW1 adaptation."),
        "de Jong & Perfetti (2011) · Language Learning",
        "https://sites.pitt.edu/~perfetti/PDF/de%20Jong%20Language%20Learning.pdf"),
      method("合上范文，再调用词组", "Retrieve phrases before rereading",
        bilingual("答完后只留三个词组。次日、三天后和一周后，各遮住原句造一个新句，然后核对用法。这三个间隔是复习安排。研究支持的是词汇保持。", "After a response, keep three phrases. Recall each without notes in a new sentence the next day, three days later, and one week later. These are practical review intervals. The research measured vocabulary retention."),
        "Karpicke & Roediger (2008) · Science",
        "https://doi.org/10.1126/science.1152408"),
      method("用回听发现一个问题", "Get feedback and retry one thing",
        bilingual("回听 30 秒，记下时间点与原句。请同学用一个问题引导你补充，例如「这个建议会带来什么结果？」然后重录这段。研究考察课堂口头纠错，录音自查是本站的练习设计。", "Replay 30 seconds and note the timestamp and wording. Ask a classmate for one prompt, such as “What would this suggestion achieve?” Then record that stretch again. The study concerns classroom oral correction and informs this practice design."),
        "Lyster & Saito (2010) · Studies in Second Language Acquisition",
        "https://doi.org/10.1017/S0272263109990520"),
      method("模仿表达方式，替换内容", "Borrow the phrasing, then make it yours",
        bilingual("找约 15 秒的官方雅思口语示范，听出停顿和重读，跟说两遍，再换成自己的例子。留意答题相关性、用词准确性、简单句与复合句的搭配，以及可懂度。SCW1 计时和评分按西浦任务单及课堂反馈。", "Use about 15 seconds from an official IELTS speaking sample. Listen for phrase breaks and stress, imitate twice, and give your own example. Check relevance, word choice, sentence variety, and intelligibility. Follow XJTLU for SCW1 timing and feedback."),
        "IELTS · Official annotated Speaking samples",
        "https://ielts.org/organisations/ielts-for-organisations/understanding-ielts-scoring/resources-for-setting-your-ielts-scores"),
      method("跨天练习词组", "Space vocabulary practice across days",
        bilingual("每天先回忆旧搭配，再把它用到今天的新题。优先复练昨天想不起来的词组。课堂研究用累积小测练二语词汇，口语里可改成短的口头复现。", "First recall old phrases, then use one in today’s prompt. Prioritise items you could not retrieve yesterday. The classroom study used cumulative tests for L2 vocabulary. Here the retrieval is a short spoken drill."),
        "Nakata et al. (2021) · TESOL Quarterly",
        "https://doi.org/10.1002/tesq.596")
    ],
    rubric: [
      check("Part 1", "陈述切题", "The talk stays on topic", bilingual("第一句回应题目，结尾回到主题。", "Answer the prompt in the opening and return to it at the end.")),
      check("Part 1", "给出具体例子", "The talk gives specific examples", bilingual("每个关键理由配一段场景，交代动作或结果。", "Support each main reason with a scene, action, or result.")),
      check("Part 1", "展开解释或观点", "The talk explains ideas or gives opinions", bilingual("说清为什么这个经历重要、做法有效或观点合理。", "Explain why the experience mattered, the action worked, or the view makes sense.")),
      check("Part 2", "听懂并回应原题", "The interview addresses the question", bilingual("找出动作词，用第一句回应具体问法。", "Spot the task verb and answer it in your first sentence.")),
      check("Part 2", "Q1 展开回答", "Q1 develops the answer", bilingual("给定义或列两到三类，并说出一项用途或例子。", "Define the idea or list two to three types, then give a use or an example.")),
      check("Part 2", "Q2 展开解释", "Q2 develops the explanation", bilingual("说明原因如何导致一个看得见的后果。", "Show how the reason leads to an observable result.")),
      check("Part 2", "Q3 展开建议", "Q3 develops suggestions", bilingual("给两个行动方案，其中一个讲清实施场景。", "Give two actions and show how one would be put into practice.")),
      check("Part 2", "Q4 展开观点", "Q4 develops an opinion", bilingual("先表态，给两个支撑点，再按需限定条件。", "Give your view, develop two reasons, then qualify it if useful.")),
      check("Fluency / 流畅度", "语速与停顿适当", "Pace and hesitation sound natural", bilingual("按意群停顿，给关键词足够的时间。", "Pause between thought groups and give key words enough time.")),
      check("Coherence / 连贯性", "思路有顺序", "Ideas follow a clear order", bilingual("先答，再解释和举例，最后回到观点。", "Answer, explain, exemplify, and return to the point.")),
      check("Coherence / 连贯性", "有明确衔接和指代", "Links and references are clear", bilingual("让 because、for example、this change 等衔接对应前后内容。", "Use signals like because, for example, and this change to clarify how ideas relate.")),
      check("Vocabulary / 词汇", "用词切题", "Vocabulary fits the topic and meaning", bilingual("说 under pressure、meet a deadline 等准确搭配。", "Use accurate collocations, such as under pressure and meet a deadline.")),
      check("Vocabulary / 词汇", "词汇有范围", "Vocabulary includes precise topic language", bilingual("用具体词说清问题。忘词时换一种熟悉说法。", "Choose specific words and paraphrase when a word escapes you.")),
      check("Grammar / 语法", "语法符合意思", "Grammar is accurate and appropriate", bilingual("检查主谓一致、时间、可数名词和主句。", "Check agreement, time reference, countable nouns, and complete clauses.")),
      check("Grammar / 语法", "使用不同类型复合句", "Uses different types of complex sentences", bilingual("按意思选用原因、条件、让步或定语从句。", "Use a reason, condition, concession, or relative clause where it fits the meaning.")),
      check("Pronunciation / 发音", "词音能被听懂", "Individual words are intelligible", bilingual("回听关键词、复数及过去式词尾。", "Check key words and the endings of plurals and past-tense verbs.")),
      check("Pronunciation / 发音", "用重音和语调传递意思", "Stress and intonation support meaning", bilingual("对比词重读，在结论处用适合的降调。", "Stress contrasts and use an appropriate fall at the end of a conclusion."))
    ]
  };
})();
