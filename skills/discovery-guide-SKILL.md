---
name: discovery-guide
description: >
  Generate a moderated exploratory interview discussion guide for Kong UX research. Use this skill
  when the user asks to write, generate, create, or build a discussion guide or moderator guide for
  a discovery interview, exploratory interview, generative research session, contextual inquiry, or
  any session where the goal is to understand current behavior, mental models, pain points, or
  context — not to test something. Also trigger when the user has learning objectives framed around
  "understand how", "learn what", "explore why", or "find out if" rather than around testing a
  specific design or flow. Produces a complete moderator-ready guide with intro script, warm-up,
  behavior-surfacing questions, friction and challenge probes, and closing. Output is plain text
  formatted for a textarea — no markdown, no JSON.
---

# Discovery guide skill

## What this skill produces

A complete, moderator-ready discussion guide for a moderated exploratory (discovery) interview at
Kong. The guide is behavior-surfacing in style: questions are designed to reveal what people
actually do, not what they think or prefer. The moderator reads it directly. It is not a template
— it is a draft the person edits until it feels right for their session.

---

## The core discipline of a discovery interview

This is the thing most designers get wrong when they run their first discovery session.

**You are not asking for opinions. You are surfacing behavior.**

The difference:
- Opinion: "What do you think about how Kong handles rate limiting?"
- Behavior: "Walk me through the last time you had to set up rate limiting. What did you do first?"

Opinions are what people believe they do or want. Behavior is what they actually do. In technical
research, especially with developers and platform engineers, opinions are often rationalizations
built after the fact. The behavior is the evidence.

Every question in this guide should be anchored to something the participant has actually done,
a real situation, a specific recent example, or a concrete current setup. Hypothetical and
general questions ("what would you want", "in general, how do you") produce unreliable data.

---

## What you need before generating

Collect from the user (or from cockpit state if available):

- **Project name and product area** — what space you're exploring
- **Purpose** — why this study is happening now, what decision or direction it informs
- **Learning objectives** — what the team needs to understand (Must/Should/Could)
- **Cohorts** — who is participating (internal Kongers, Kong customers, non-Kong via Respondent)
- **Stage** — is this early exploration (no design exists) or context-building alongside an active
  design effort?

If the person only has vague objectives ("understand how users feel about X"), push back before
generating. Ask what specific behaviors or decisions they need to inform. Vague objectives produce
vague guides.

---

## Guide structure — sections in order

Every guide has exactly these sections. Do not add sections. Do not reorder them.

### 1. INTRODUCTION (2-3 mins)

Purpose: establish that this is a listening session, not a sales call or a pitch. Developers and
platform engineers are often skeptical when someone from a product company wants to talk to them.
You earn the session by being explicit about your intent.

Write word-for-word. Include:
- Ask for recording consent before starting the recording
- Explain the purpose plainly: you're here to learn from them, not to show them anything or sell
  anything
- Confirm nothing they say will be quoted with their name attached
- Assure them there are no wrong answers — you want their honest experience, even if it's negative
- "You can stop at any time" — especially important for non-Kong participants

Do not explain what the product does. Do not mention features you're building. Do not hint at
what you're hoping to hear. Any signal about your hypotheses will anchor their answers.

**Moderator note to include:** "Start recording after they say yes. Don't introduce product names
or feature areas before the warm-up is complete."

### 2. WARM-UP (3-5 mins)

Purpose: understand who this person actually is before you ask about their experience. Their role
title tells you almost nothing. What they're responsible for right now, what their team looks like,
what their stack looks like — that's the context that makes everything they say interpretable.

Write 2-3 questions. Cover:
- Their current role and what they're actually responsible for day-to-day (not their job title)
- What they're currently building or managing — the actual work, not the category
- How long they've been doing this kind of work and what that evolution has looked like

For technical participants (platform engineers, API owners, SREs):
- Ask about their infrastructure setup — not to evaluate it, but to calibrate. A team running
  50 services in production thinks about gateway problems very differently than a team of 5 just
  getting started.

**What warm-up is NOT:** not a screener, not a recap of their LinkedIn, not an invitation to pitch
themselves. The moderator should be mostly listening here, not asking follow-up questions. If
something interesting surfaces, note it and come back to it.

### 3. CURRENT CONTEXT (10-12 mins)

Purpose: map their actual current state before you ask about problems. You cannot understand
friction without first understanding the system it lives in.

Structure: start wide, then focus on the area relevant to your objectives.

Open with a behavior-surfacing anchor question. Examples:
- "Walk me through how your team currently handles [area]. Start from the beginning — what does
  that process look like?"
- "Tell me about your current setup for [area]. What does it look like today?"
- "What does a typical week look like for you in terms of [area]?"

Then follow with context-building probes (pick 3-4 that fit):
- "Who else is involved in that? What do they own?"
- "What tools are you using for that right now?"
- "How did you end up with this setup? Did it evolve, or did you make a deliberate decision?"
- "What does this process connect to upstream or downstream?"
- "How often does this change or need maintenance?"

**What to avoid in this section:**
- "Are you happy with that?" — yes/no, opinion, not behavior
- "Does that work well for you?" — same problem
- "What would you want instead?" — premature, and anchors to your product before you have context
- Any question that mentions a feature, product name, or solution you're working on

### 4. FRICTION AND CHALLENGES (10-12 mins)

Purpose: find where the current state breaks down, where workarounds live, and what the actual
cost of those breakdowns is. This is where the most valuable research data comes from.

The key technique: **anchor to specific, recent events, not general feelings.**

Open with:
- "Tell me about the last time something went wrong in [area]. What happened?"
- "Walk me through a time this process took longer than it should have. What was going on?"
- "What's the part of [area] that you most dread dealing with?"

Then probe to understand the breakdown:
- "How often does that happen?"
- "What do you do when it happens? Walk me through it."
- "Who else gets pulled in when that breaks?"
- "What's the cost when that goes wrong? Time, trust, downstream impact?"
- "Have you tried to fix that? What happened?"
- "What are you working around right now to avoid that problem?"
- "If that didn't exist, what would be different?"

**Workaround probe** — include this explicitly. Workarounds are the most honest signal you will
ever get about where a product is failing:
"Tell me about any workarounds you have for this. Things you do that feel like they shouldn't
be necessary."

**Probe depth rule:** When a participant mentions something that sounds important — a pain point,
an unexpected process, a workaround — go there. Don't stay on the guide. The guide is a safety net,
not a script. The best data comes from following surprising answers.

Include this moderator note:
[MODERATOR NOTE: If they mention a tool, a workaround, or a process you didn't expect, follow it.
You can return to the guide, but don't redirect away from something interesting just to stay on
track. Deviation is usually signal.]

### 5. CLOSING (3-5 mins)

Purpose: get the things they didn't think to mention, and the one thing they most want you to
understand. Developers and platform engineers often have opinions they didn't share because they
weren't sure you'd find them useful.

Always include:
- "What's the biggest thing you'd want someone building tools for this space to understand about
  how you work?"
- "Is there anything we didn't talk about that you think is important?"
- Thank them by name
- Explain findings will be used to shape product direction — their name won't be attached to anything
- Confirm the recording stays within the research team

**Do not ask:** "What features would you want?" This is the classic research mistake. You are not
running a feature request session. If they offer feature requests unprompted, note them — but don't
solicit them. Your job is to understand the problem space, not to collect a wishlist.

**Moderator note:** "If they offer a feature suggestion, acknowledge it and ask: 'What problem
would that solve for you?' The suggestion is less useful than the problem underneath it."

---

## Writing rules

These apply to every word in the guide.

**Voice and tone**
- Write like a researcher, not a template
- No em dashes
- No corporate language ("leverage", "surface insights", "pain points" as a phrase you say aloud
  — it sounds like a consulting deck)
- Short sentences. The moderator is reading this live.
- Write questions the way a person would actually ask them, not the way they'd appear in a survey

**The behavior-surfacing discipline**
Every question should make the participant recall something real: a specific day, a specific
situation, a thing they actually did. If a question can be answered without remembering anything
specific, rewrite it.

Test: read the question out loud. Would a real person answer it with a story and concrete details,
or with a general statement? General statements are not research data.

- "What do you think about how Kong handles routing?" → general, opinion, not useful
- "Walk me through how you set up routing on your last project. What did that look like?" → specific, behavioral, useful

**What the guide is not**
- Not a survey. No rating scales in a discovery interview.
- Not a usability test. You are not observing task completion. You are listening to stories.
- Not a feature prioritization session. You are not collecting a wishlist.
- Not an NPS call. You are not measuring satisfaction.

**Probe questions vs. guide questions**
The guide contains primary questions — the ones you'd ask if you had no idea what they'd say.
Probe questions are follow-ups that dig into whatever they actually said. Include 3-4 probe
options under each major section so the moderator has options without having to improvise.

Label probes clearly: [PROBE OPTIONS:] — they are not all asked, moderator picks what fits.

---

## Generation prompt

Use this prompt to call the Claude API. Fill in the bracketed values from cockpit state or user input.

```
Write a moderated exploratory interview discussion guide. Write real, runnable content — actual
moderator script and behavior-surfacing questions, not meta-descriptions or placeholders.

SESSION TYPE: Moderated discovery/exploratory interview
PROJECT: [projectName]
PRODUCT AREA: [area]
PURPOSE: [purpose]

LEARNING OBJECTIVES:
[objectives — list each with priority]

PARTICIPANTS: [cohorts]

GUIDE STRUCTURE (follow exactly, in this order):
1. INTRODUCTION (2-3 mins): Word-for-word script. Recording consent before recording starts.
   Establish this is a listening session, not a pitch. No wrong answers. They can stop anytime.
   Moderator note: don't mention product features before warm-up is complete.

2. WARM-UP (3-5 mins): 2-3 open questions. Current role and actual responsibilities, what they're
   building or managing right now, how long they've been in this space. For technical participants,
   include a question about their current setup. No yes/no questions.

3. CURRENT CONTEXT (10-12 mins): Behavior-surfacing anchor question to open. Then 3-4 context
   probes: who else is involved, what tools, how did they end up here, what connects to it
   upstream/downstream. No opinion questions. No "are you happy with" or "does that work well."
   Include [PROBE OPTIONS] under the anchor question.

4. FRICTION AND CHALLENGES (10-12 mins): Open with a recent-event anchor. Then probe for
   frequency, workarounds, cost, who gets involved, what they've tried. Include explicit workaround
   probe. Include a moderator note about following surprising answers.
   Include [PROBE OPTIONS] under the main friction question.

5. CLOSING (3-5 mins): "What's the biggest thing you'd want someone building tools for this
   space to understand?" "Anything we didn't cover?" Thank them. No feature requests solicited.
   Moderator note: if they offer a feature suggestion, ask what problem it would solve.

RULES:
- No em dashes
- No corporate language
- No opinion questions — every question should surface behavior or a specific situation
- No hypotheticals ("what would you want", "in general how do you")
- No feature requests solicited
- Section headers in ALL CAPS
- [MODERATOR NOTE: ...] and [PROBE OPTIONS:] labeled for moderator only — not read aloud
- Write like a researcher. Short sentences. This is read live.

Return plain text only. No JSON. No markdown backticks. Moderator reads directly from this.
```

---

## Output format

Plain text. Section headers in ALL CAPS. Moderator notes and probe options in labeled brackets.
No markdown. No JSON. No bullet points inside the guide — the moderator reads prose and labeled
items, not a bulleted list.

The guide should run 35-45 minutes total. Current Context and Friction together are the heart of
the session — they should take 20-25 minutes between them.

---

## Quality check before handing off

Before giving the guide to the designer, verify:

- [ ] Every question in Current Context and Friction surfaces behavior, not opinion
- [ ] At least one anchor question in each section asks about a specific, recent event
- [ ] Probe options are labeled and clearly moderator-only
- [ ] No question asks "what would you want" or "what features would help"
- [ ] No yes/no questions in warm-up or current context
- [ ] Intro script is word-for-word, not summarized
- [ ] Closing does not solicit feature requests
- [ ] Moderator note about following surprising answers is present in friction section
- [ ] No em dashes anywhere

---

## Kong-specific context

**Internal Kongers (practice + proxy signal)**
- Warm-up should identify proximity to the area — someone on the gateway team has different
  context than someone on billing. Don't assume the role title tells you this.
- Discovery with internals surfaces internal mental models and assumed workflows, not customer
  reality. Weight it accordingly.
- Useful for: understanding how the team thinks about the problem before you go external,
  identifying terminology mismatches, finding internal workarounds that signal known product gaps.

**Kong customers (primary signal)**
- These are the sessions that matter most. Go slower in Friction. Let them go long on a story.
- The warm-up infrastructure question is especially important here — a 2-person startup and a
  200-person enterprise have completely different contexts for the same product area.
- Probe for team dynamics: who else makes decisions, who gets paged when things break, who owns
  the platform vs. who uses it. These distinctions matter for understanding the actual user.

**Non-Kong participants (via Respondent, Shikha sign-off required)**
- Screener alignment is critical. Their context has to actually match the problem space.
- Warm-up needs more calibration time — you have less prior context about how they work.
- Useful for: understanding how the space works outside Kong's framing, finding where Kong's
  mental model differs from the broader developer/operator mental model.

**Technical audiences (platform engineers, SREs, API owners)**
- Be specific in scenario anchors. "Tell me about your API gateway setup" is fine. "Tell me
  about your infrastructure" is too broad — they'll spend 10 minutes giving you context you
  didn't need.
- Don't apologize for technical questions. These participants want to be treated as technical peers.
- Jargon they use unprompted is signal. If they use a term you don't recognize, ask what they
  mean rather than nodding through it.
- "Walk me through it" and "what did you do first" are the two most useful probes you have.
  Use them often.
