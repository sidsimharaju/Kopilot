---
name: usability-guide
description: >
  Generate a moderated usability test discussion guide in task analysis style for Kong UX research.
  Use this skill when the user asks to write, generate, create, or build a discussion guide or
  moderator guide for a usability test, usability study, task-based session, or moderated usability
  test. Also trigger when the user has a research plan (objectives, area, cohorts) and wants a
  runnable guide for testing a specific flow or feature. Produces a complete, moderator-ready guide
  with intro script, warm-up, scenario-framed tasks with observation notes, confidence ratings, and
  closing. Output is plain text formatted for a textarea — no markdown, no JSON.
---

# Usability guide skill

## What this skill produces

A complete, moderator-ready discussion guide for a moderated usability test at Kong. The guide is
task analysis style: structured around realistic scenarios and goal-statement tasks, not instructions.
The moderator reads it directly. It is not a template — it is a draft the person edits until it
feels right for their session.

---

## What you need before generating

Collect from the user (or from cockpit state if available):

- **Project name and product area** — what feature or flow is being tested
- **Purpose** — why this study is happening now, what decision it informs
- **Learning objectives** — what the team needs to find out (ideally prioritized Must/Should/Could)
- **Cohorts** — who is participating (internal Kongers, Kong customers, non-Kong via Respondent)
- **Number of tasks** — optional, default to matching number of Must objectives
- **Booking link** — optional, only needed if including in a screener or email (not in the guide itself)

If any of these are missing, ask for them before generating. A guide built without real objectives
produces generic tasks that could apply to any product.

---

## Guide structure — sections in order

Every guide has exactly these sections. Do not add sections. Do not reorder them.

### 1. INTRODUCTION (2-3 mins)

Purpose: set the participant up to give useful data. Recording consent before you start recording.
Thinking-aloud norm established before the tasks begin.

Write word-for-word. Include:
- Ask for recording consent before starting the recording ("Before I hit record...")
- Explain feedback won't be tied back to them by name
- Ask them to think out loud as they work — say what they're seeing, what they expect, what confuses them
- Reassure: they are testing the product, not their own skills. There are no wrong answers.
- One sentence framing what they'll be doing (not what you're testing — frame it from their perspective)

Do not explain what the product does. Do not say what you're looking for.

**Moderator note to include:** "Start recording after they say yes."

### 2. WARM-UP (3-5 mins)

Purpose: calibrate your mental model of this participant before the tasks. Not just pleasantries —
these answers change how you interpret what you see in the tasks.

Write 2-3 actual questions. Cover:
- Their role and what they're currently working on or responsible for
- How they interact with the product area being tested day-to-day (frequency, context)
- One question specific to the study area — what their current setup looks like, what tools they use

Keep questions open-ended. No yes/no. No leading questions.

**What warm-up is NOT:** not a screener, not a baseline task, not an opinion survey. It's context-building.

### 3. SCENARIOS AND TASKS (15-20 mins)

This is the core of the guide. Structure:

**Scenario framing** — one sentence that sets the stage before each task group. Realistic context,
not a product description. Written from the participant's perspective.

Example: "Imagine you've just joined a new team and need to get a gateway running for a new service
before your standup tomorrow."

NOT: "In this scenario, you will use the Gateway Manager to create a new gateway instance."

**Tasks** — goal statements, not instructions.

A goal statement tells them WHAT to achieve, not HOW to do it.

- Good: "Go ahead and get your first gateway running."
- Bad: "Click 'New Gateway' in the top right corner."
- Bad: "Try to create a gateway."  ← too vague, no stakes
- Bad: "See if you can set up a gateway."  ← "see if you can" implies it might be impossible

Each task needs three things in the guide:

1. **The task itself** — written as a goal statement, in second person, present tense
2. **Moderator observation note** — what to watch for. Not what you hope to see. What would tell
   you something is working, broken, or surprising. Keep to 2-3 bullets.
3. **Confidence rating** — after each major task: "On a scale of 1 to 5, how confident did you
   feel during that last task? 1 means you felt completely lost, 5 means it was totally clear."

**How many tasks:** Match to the number of Must objectives. If there are 3 Must objectives, there
are 3 task groups. Don't add tasks to fill time — if you finish early, go deeper on what you saw.

**Task grouping:** Tasks that test the same flow live under one scenario. Tasks that test separate
flows get separate scenario framings.

**Probing during tasks:** Include a standing moderator note after the task instructions:
"If they go quiet for more than 10-15 seconds, ask: 'What are you thinking right now?'
If they do something unexpected, don't redirect — note it and ask about it in closing."

### 4. CLOSING (5 mins)

Purpose: get the things participants didn't say during the tasks, and give them a chance to tell
you what you didn't think to look for.

Always include these three questions, word-for-word:
- "Was there anything that surprised you today?"
- "If you could change one thing about what you saw, what would it be?"
- "Anything else you'd want us to know?"

Then:
- Thank them by name
- Explain findings will be used to improve the product — their name won't be attached to anything
- Confirm the recording stays within the research team

**Moderator note:** "Don't end with 'great job' or 'you did really well.' It implies there was a
right answer. Just 'thank you, this was genuinely helpful.'"

---

## Writing rules

These apply to every word in the guide.

**Voice and tone**
- Write like a researcher, not a template
- No em dashes
- No corporate language ("leverage", "utilize", "surface insights", "ideate")
- No passive voice in task statements
- No hedging ("try to", "see if you can", "attempt to")
- Short sentences. The moderator is reading this live.

**What makes a task good**
- Has stakes. The participant knows why it matters.
- Is specific enough to complete. "Get your first gateway running" is completable. "Explore the
  gateway area" is not.
- Does not contain the answer. Don't use the product's button labels or navigation terms in the
  task statement.
- Matches something a real user would actually do in their job.

**What the guide is not**
- Not a test script that walks through every click. The moderator follows the participant.
- Not a list of things to verify. The tasks create conditions for observation — the moderator
  observes what actually happens.
- Not a survey. No rating scales except the confidence question after each task.

**Observation notes are for the moderator only**
Write them in brackets or label them clearly: [MODERATOR NOTE: ...]. They are not read aloud.
They contain: what behavior would confirm or challenge the hypothesis, what to probe if you see X,
what not to redirect.

---

## Generation prompt

Use this prompt to call the Claude API. Fill in the bracketed values from cockpit state or user input.

```
Write a moderated usability test discussion guide. Write real, runnable content — actual moderator
script and task statements, not meta-descriptions or placeholders.

SESSION TYPE: Moderated usability test (task analysis style)
PROJECT: [projectName]
PRODUCT AREA: [area]
PURPOSE: [purpose]

LEARNING OBJECTIVES:
[objectives — list each with priority]

PARTICIPANTS: [cohorts]

GUIDE STRUCTURE (follow exactly, in this order):
1. INTRODUCTION (2-3 mins): Word-for-word script. Recording consent before recording starts.
   Think-aloud norm. Reassure: testing the product, not them. No wrong answers.
   Moderator note: start recording after consent.

2. WARM-UP (3-5 mins): 2-3 open questions. Role, day-to-day context, something specific to
   [area]. Not a screener. Context-building only.

3. SCENARIOS AND TASKS (15-20 mins): One scenario framing per task group. Each scenario is a
   realistic goal framing, not a product description. Each task is a goal statement (what to
   achieve, not how). After each major task: confidence rating 1-5. Each task includes a
   [MODERATOR NOTE] with 2-3 things to watch for. Tasks must map to the Must objectives.
   Include a standing probe note after the first task.

4. CLOSING (5 mins): Three questions word-for-word: "Was there anything that surprised you?"
   "If you could change one thing, what would it be?" "Anything else you'd want us to know?"
   Thank them. No "great job." Confirm recording stays in team.

RULES:
- No em dashes
- No corporate language
- No instructions in tasks — goal statements only
- No leading questions
- Section headers in ALL CAPS
- [MODERATOR NOTE: ...] labels for observation notes — not read aloud
- Write like a researcher. Short sentences. This is read live.

Return plain text only. No JSON. No markdown backticks. Moderator reads directly from this.
```

---

## Output format

Plain text. Section headers in ALL CAPS. Moderator notes in [MODERATOR NOTE: ...] brackets.
No markdown. No JSON. No bullet points inside the guide — the moderator reads prose and labeled
items, not a bulleted list.

The guide should run 40-50 minutes total for 3 task groups, 30-35 minutes for 2.

---

## Quality check before handing off

Before giving the guide to the designer, verify:

- [ ] Every task is a goal statement, not an instruction
- [ ] No task contains a UI label or button name
- [ ] Confidence rating appears after each major task
- [ ] Intro script is word-for-word, not summarized
- [ ] Observation notes are labeled as moderator-only
- [ ] Closing includes all three standard questions
- [ ] No em dashes anywhere
- [ ] Total timing adds up (intro + warm-up + tasks + closing)

---

## Kong-specific context

**Internal Kongers (practice + proxy signal)**
- Warm-up should ask what product area they're closest to, not what they know about the feature
  being tested. You want to calibrate proximity, not telegraph the task.
- Tasks should be runnable without deep product knowledge. If an internal participant needs
  product context to do a task, the task is too narrow.
- Confidence ratings from internals are less reliable — they may feel confident for the wrong reasons.
  Weight observation over self-report.

**Kong customers (primary signal)**
- These are the sessions that matter most. Go slower. Give more time per task.
- Warm-up should surface their actual setup — what gateway they're running, how many services,
  who else is on the platform team. This context changes everything you observe.
- Don't rush to the next task when something interesting happens.

**Non-Kong participants (via Respondent)**
- Always screened. Screener criteria should align with the participant criteria in the plan.
- Warm-up is more important here — you have less context about them before the session.
- Be more explicit in the scenario framing. Less assumed knowledge about API infrastructure patterns.
