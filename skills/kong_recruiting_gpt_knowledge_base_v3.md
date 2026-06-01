# Internal recruiting outreach — full knowledge base
## Kong UX Research Program

---

## What this is for

This GPT helps designers and researchers at Kong get internal people to say yes to a research session quickly, or to connect them with a customer account. It covers who to recruit, how to find them, what to say, how to handle pushback, and what to do when people don't respond.

The people sending these messages are UX researchers and designers at Kong. Both may be doing outreach depending on the study.

---

## The core strategy — two messages, not one

Send a short first message with one ask. If they respond, follow up with context. Never put the full study brief in message one. A wall of context upfront works against you — get the yes first, explain after.

Every first message needs exactly three things:
1. Who you are and what team you're on
2. What you're working on — general area only, not the whole study
3. Why you're reaching out to them specifically — this is what prevents "I'm not the right person"

That third thing is the most important. It's different for every audience and every scenario. It can never be generic.

Message two goes out after they respond. That's where you give the full context: what the study is, why they fit, what the session involves, what's in it for them, and a clear yes-or-no ask at the end.

---

## What research sessions are and aren't

Be accurate on this in every message. These points directly address the fears each internal audience has:

- Sessions are for learning only — not a product demo, not a support call, not a feature request session
- No roadmap updates will be shared during sessions
- No solutions or troubleshooting provided — this is not a product call
- Participants don't need to prepare anything
- There are no right or wrong answers — honest reactions are the whole point
- Findings will be shared back with internal participants after the study
- Research may or may not directly shape specific features, but it always informs a better experience — never overcommit on outcomes
- Sessions are one-on-one, not a panel — this matters for CSMs and for customers who are used to multi-person calls

---

## The tools you use to find people

### Hex — for finding customer accounts and CSMs
Use the Hex analytics dashboard to identify which customer accounts match your study criteria. Hex will surface the CX representative for each account.

**Signals available in Hex:**
- Activation flags: API Gateway, AI Gateway, Dev Portal, Metering and Billing, Advanced Analytics
- Core entities activated
- Account tenure
- Engagement recency (last sign-in / last active)
- Billing classification
- Account ownership

Use these to filter accounts that match your participant criteria. For example, if your study is about new platform owners in early setup, filter for accounts that activated API Gateway recently and look like they're still in a proof-of-concept stage.

Hex recruiting dashboard: [link — add when ready]

For more detail on which signals to use for different study types, see the recruiting guidance in the research plan template.

### Atlassian Rovo — for finding internal people by role and region
Go directly to Atlassian Rovo to search. Do not use Claude or Claude Cowork for this — go to Rovo directly.

Rovo can search across Confluence, which has a lot of data on people at Kong. Use it to find people by role and time zone before reaching out.

**Example search in Rovo:**
"Which of the following roles — solutions engineer, field engineer, platform engineer, solutions architect — would be a good fit for my study on [topic], near [timezone]?"

This is especially useful when you don't already know who to reach out to, or when you need to find someone in a specific region or with a specific background.

### Slack channels — for finding and reaching people
These are the channels to use per audience. Use them to identify candidates, then always DM directly. Do not post in channels asking for volunteers — channel posts rarely convert and go person to person instead.

| Audience | Channel to find candidates |
|---|---|
| CSMs | Hex surfaces the right CSM. For fallback: #internal-[account-name] |
| Solutions engineers | #solutions-engineering |
| Field engineers / platform engineers | #field-engineering |
| Internal engineers | #engineering |

**Account channels for CSMs:**
Every account has a dedicated Slack channel: `#internal-[account-name]`. This channel has everyone who touches that account in one place — pre-sale, post-sale, CSMs, field team. It gives you more visibility and engagement than a single DM. Use it only as a fallback if your direct message to the CSM doesn't get a response. Do not use a general CSM channel — you want people who actually know that specific account.

---

## Audience 1: CSMs

### What you need from them
An intro to a specific customer account, or permission to reach out to that customer directly. You are not asking for their opinion on the product — just access. It's a small ask but it needs the right setup or they'll get protective.

### Why CSMs need careful handling
CSMs are protective of their customer relationships. There is a real history at Kong of people making roadmap promises in customer calls that didn't come through. That has happened and it damages trust. This is a live concern, not a hypothetical one. You have to get ahead of it.

They also worry about:
- Coming across as tone-deaf to a relationship they've spent time building
- Being kept out of the loop on what you found
- Their customer having a bad experience because of the intro
- Having to do a lot of coordination work
- Their customer getting "toned after" — meaning pressured or sold to during what was supposed to be a research session

### How to find the right CSM — Hex first, always
Before messaging anyone, know which account you want and why. Use Hex to filter accounts that match your study. Hex surfaces the CX representative for each account. That's your person.

Coming in with a specific account name makes the ask much easier — you've done the work, and all you need from them is the connection.

### What gets CSMs to say yes
- You already identified a specific account and have a concrete reason why they fit — you've done the homework
- You're clear this is research only: no solutions, no troubleshooting, no roadmap talk
- They get the findings back to use in their own customer conversations — genuinely useful for accounts they're managing through onboarding or POC stages
- It's a one-on-one session, not a panel — low-stakes for the customer
- If they want to join, they can, with a clear understanding of what that looks like

### The outreach flow — follow this order

1. **DM the CSM directly.** Short ask, name the account.
2. **If they respond,** send message two with full context and ask for the intro.
3. **If they go quiet,** send a 15-minute calendar invite with all the context in the description. That gives them everything they need without a back-and-forth. The 15 minutes becomes a quick yes or no.
4. **If still nothing,** post in `#internal-[account-name]`. This gets you more visibility — the whole pre/post-sale team is in there. Post the same message addressed to the group.

Do not post in a general CSM channel. You want people who know that specific account.

### Message templates

**Message 1 — send this first:**
Hey [name], I'm [your name] from the design team. I wanted to see if you could help me get in touch with [account name] for a research interview. You're the best person to get me access to them. Could you connect us?

That's it. One ask. You're not asking for their time or their opinion — just a connection.

**Message 2 — after they respond:**
Thanks! We're running a study on [e.g., how new platform owners get set up in Konnect] and [account name] stood out because [e.g., they activated API Gateway recently and look like they're still early in their setup, which is exactly the stage we're studying].

It would be a 30-minute interview, no prep needed on their end. We always make clear upfront it's purely for learning and there won't be any roadmap commitments.

We'd love to talk to them directly if possible since it keeps things cleaner. Could you make an intro, or are you okay with us reaching out directly? Happy to draft the outreach.

**Calendar invite description — if they go quiet:**

Invite title: Quick chat about connecting us with [account name] for research

Hey [name], wasn't sure if my message came through so I put some time on the calendar. Here's the context so you can come prepared.

We're running a research study on [e.g., how new platform owners get set up in Konnect] and we'd love to talk to [account name]. They stood out because [e.g., they activated API Gateway recently and are still early in their setup].

A few things worth knowing:
- We won't be sharing roadmap updates or making any feature promises
- This is research, not a product call, so we won't be troubleshooting anything either
- We'll share the findings back with you after so you have them for your own conversations with this account

If you want to join the session, you're welcome to. We'd just ask that you let the conversation flow naturally without stepping in. In research we want the customer to be as honest as possible — a panel dynamic or having someone there who might offer solutions changes that. One-on-one is what keeps it honest and low-stakes.

The research will help us shape a better experience for [e.g., customers in their first few weeks with Konnect]. The earlier we get this right, the less friction down the line for accounts like theirs.

Feel free to reply if it's easier to just make the intro directly.

### Handling CSM pushback

**"Can I be on the call?"**
They can join but they need to hold back and let the conversation flow. Customers adjust what they say when their CSM is present. A one-on-one is cleaner and doesn't put them in the position of fielding product questions mid-call. If they insist, agree but set the expectation clearly.

**"Are you going to make roadmap promises?"**
Fair concern because it has happened. Be direct: the team sets that expectation at the start of every session and never commits to timelines or features. Findings may inform the experience but nothing gets promised.

**"I don't have time to coordinate this."**
That's why you came with a specific account already identified. All you need from them is an intro or a green light to reach out directly. You handle everything else.

**"Can you just join one of our existing cadence calls instead?"**
Try to avoid this. It changes the dynamic and puts the CSM in an awkward position if the conversation goes somewhere unexpected. A standalone 30-minute session framed clearly as research is cleaner for everyone.

**"Which customers do you want to talk to?"**
You should already have an answer — this is why you do the Hex work first. Don't ask a CSM to identify the right customers for you. That's a burden and a reason they'll say they don't have time.

---

## Audience 2: Solutions Engineers (SEs)

### What you need from them
Their perspective on whether something makes sense before customers see it. SEs work directly with customers through evaluation and POC stages. They see how Kong gets bought and adopted from the outside — that's hard to get from inside the product team and genuinely valuable before you test with real users.

Unlike CSMs, you're not going through their customers. You're reaching out to them directly.

### How to find the right SE
1. Look in `#solutions-engineering` on Slack — solutions engineers and solutions architects
2. Search Atlassian Rovo directly: "Which solutions engineers or solutions architects would be a good fit for a study on [topic] and are based near [timezone]?"

Always DM directly. Do not post in the channel asking for volunteers — channel posts for SEs don't tend to get traction. Go person to person.

### What SEs care about

**Their worries:**
- "I don't work on that product, I won't be useful" — the most common opt-out, must be addressed in message one
- "I've never done research before, I won't know what to do"
- Wasting time on something that doesn't feel relevant to their work
- Being asked to speak on behalf of their customers in a way that feels awkward

**What gets them to say yes:**
- Their customer-facing experience is the whole point, not their product knowledge
- No experience required, no prep needed, no right or wrong answers
- They get the findings back after — useful context for customer conversations they're already having
- They're contributing expertise, not being evaluated

### Message templates

**Message 1:**
Hey [name], I'm [your name] from the design team. I'm working on [e.g., the platform owner onboarding experience] and wanted to get your input before we test it with customers. You work with customers going through this kind of thing and that perspective is exactly what we need. Could I grab 30 minutes?

The why-you line is about their customer-facing role. That's what heads off "I'm not the right person."

**Message 2 — after they say yes:**
Thanks! We're running research on [e.g., how new platform owners experience their first few days in Konnect] and wanted someone with your background to look at it before customers do.

Not looking for UI expertise at all, just your honest read on whether this makes sense given what you see out there. No prep needed.

We'll share the findings back after. Does [time] work?

---

## Audience 3: Field Engineers and Platform Engineers

### What you need from them
A broad view across many customer contexts. They see how the product gets used across a wide range of setups. That breadth is useful for pressure-testing assumptions before any single customer sees them — you want range, not depth on one account.

Unlike CSMs, you're reaching out to them directly.

### How to find the right person
1. Look in `#field-engineering` on Slack — field engineers and platform engineers
2. Search Atlassian Rovo directly: "Which field engineers, platform engineers, or solutions architects would be a good fit for a study on [topic] and are based near [timezone]?"

Always DM directly. Channel posts don't convert for this group. Go person to person.

### What they care about

**Their worries:**
- "I cover a lot of accounts, I'm not sure I'm specific enough to be useful"
- Not wanting to participate if it doesn't feel relevant
- Whether roadmap or feature topics will come up

**What gets them to say yes:**
- Their breadth is the point — you want range across many customer setups, not expertise on one
- They get the findings back, useful for customer work they're already doing
- Research only, no commitments, no awkward product conversations

### Message templates

**Message 1:**
Hey [name], I'm [your name] from the design team. I'm working on [e.g., how platform owners expose and secure APIs in Gateway Manager] and wanted your perspective before we test it with customers. You work across a lot of different customer setups and that wider view is really useful at this stage. Could I grab 30 minutes?

**Message 2 — after they say yes:**
Thanks! We're doing research on [e.g., the Day 1 experience for new platform owners] and wanted input from someone who sees how customers actually work with this before we put it in front of users.

No experience with the prototype needed. Mostly after your take on whether what we're building sounds right based on what you see in the field.

We'll share what we find back with you. Does [time] work?

---

## Audience 4: Internal Engineers

There are three different reasons to recruit an internal engineer and each one needs a different why-you line. Get clear on which applies before drafting anything.

### How to find internal engineers
1. Look in `#engineering` on Slack
2. Search Atlassian Rovo directly: "Which engineers at Kong are [role] and based near [timezone]?" — Rovo can search Confluence which has a lot of data on people by role, team, and region

Always DM directly. Channel posts don't convert. If someone doesn't respond, move to the next person on your list.

---

### Sub-type A: Fresh eyes — someone who hasn't worked on this product

**What you need:** A technically literate person who'll react like a new user would. Their distance from this product is the whole point.

**The specific challenge:** They will almost certainly say "I don't work on that" if you don't address it in message one. Name it as the reason you picked them — not a gap, a feature.

**Their worries:**
- "I don't know this product, I won't be useful" — address this explicitly in message one
- "I've never done research, I won't know what to say"
- Looking uninformed in front of a designer

**What gets them to say yes:**
- Unfamiliarity is exactly what you're looking for — say it plainly
- No prep, no right or wrong answers, just reactions
- They'll see what changed based on their input

**Message 1:**
Hey [name], I'm [your name] from the design team. I'm working on [e.g., the Gateway Manager setup flow] and wanted a sanity check before we test it with users. I'm specifically looking for someone who hasn't worked on this product, so your fresh eyes are actually the whole point. Could I grab 30 minutes?

**Message 2 — after they say yes:**
Thanks! We're about to run usability sessions on [e.g., how we walk new platform owners through setting up their first gateway] and wanted someone technical to look at it first.

Mainly we want to catch anything that wouldn't make sense to a developer coming in fresh — whether that's the phrasing, the steps, or anything that feels off. No prep needed.

We'll share what we find back with you. Does [time] work?

---

### Sub-type B: Adjacent product — they know the platform but not this specific flow

**What you need:** Someone with enough platform context to catch technical inaccuracies, but without deep assumptions about this specific product. Technical grounding plus relative freshness on this flow.

**Their worries:**
- Assuming you want someone closer to the product
- Not knowing the feature area well enough to help

**What gets them to say yes:**
- Their distance from this specific product is what makes them useful — say it
- You just need a technical gut reaction, not deep feature knowledge

**Message 1:**
Hey [name], I'm [your name] from the design team. I'm working on [e.g., the API exposure and security flow in Gateway Manager] and wanted a technical sanity check before we test it with users. You know the platform well but haven't been deep in this specific product, which is actually the perspective I'm looking for. Could I grab 30 minutes?

**Message 2 — after they say yes:**
Thanks! We're running sessions on [e.g., how platform owners set up their first gateway in Konnect] and want to make sure the phrasing and flow make sense technically before customers see it.

Looking for things that would confuse someone who knows the platform but is new to this specific workflow. No design background needed, just your technical gut reaction.

We'll share the results after. Does [time] work?

---

### Sub-type C: Role match — someone in the same role as target users

**What you need:** Their honest reaction as someone who does this kind of work. Their role is the qualification — not their product knowledge.

**The specific challenge:** They'll assume that not using Konnect disqualifies them. "I don't use that" will be their first response unless you close that door first.

**Their worries:**
- "I don't use Konnect, I won't know what I'm looking at"
- Not understanding why their role matters if they don't work on the product

**What gets them to say yes:**
- Their role is the qualification — no product knowledge needed, that's the point
- A way to contribute real expertise and see what came of it
- The work might eventually affect tools and workflows they actually use

**Message 1:**
Hey [name], I'm [your name] from the design team. I'm working on [e.g., an onboarding experience for platform engineers] and wanted to test it with someone in your role before it goes out to customers. We're specifically looking for platform engineers so you're exactly who we need. Could I grab 30 minutes?

"You're exactly who we need" closes the opt-out door before they reach for it.

**Message 2 — after they say yes:**
Thanks! We're building an experience for [e.g., platform engineers who are new to Konnect] and want to test it with people in that role before customers see it.

No familiarity with the prototype needed at all. Just looking for your honest reaction as someone who does this kind of work — what makes sense, what feels off, what you'd expect to happen next.

We'll share the findings back after. Does [time] work?

---

## Deciding which audience to recruit

**You need a CSM if:**
You want to talk to a specific customer account and need someone to make the intro or give you access.

**You need an SE if:**
You want someone who sees how Kong gets evaluated and adopted from the customer side — through sales and POC conversations. Good for testing whether something will land with the people they work with, or for getting subject matter expertise before testing with customers.

**You need a field or platform engineer if:**
You want a broad read from someone who works across many different customer setups. Good for pressure-testing assumptions before any single customer sees them. Value is range, not depth.

**You need an internal engineer (fresh eyes) if:**
You want a technically literate person to react to something the way a new user would, without pre-built assumptions about this product.

**You need an internal engineer (adjacent product) if:**
You want a technical sanity check from someone who knows the platform but hasn't been close to this specific product or flow.

**You need an internal engineer (role match) if:**
You're building for a specific technical role and want to test it with someone in that role before going to external users.

**You might need more than one:**
For example, before a usability study you might want a field engineer to pressure-test the flow and an internal engineer to sanity-check phrasing. Often done in sequence: field team first for subject matter context, engineers second for technical accuracy, then external users.

---

## The why-you line — never skip it, never genericize it

| Audience | What the why-you line is about |
|---|---|
| CSM | Access — they manage the account, they're the only route in |
| SE | Their customer-facing role — they see how customers evaluate and adopt the product |
| Field / platform engineer | Breadth — they work across many setups, range is the value |
| Engineer: fresh eyes | Unfamiliarity — they haven't worked on this product and that's the point |
| Engineer: adjacent product | Middle ground — they know the platform but not this specific flow |
| Engineer: role match | Their role — they are the type of person you're building for |

---

## After sessions — what to share back

Internal participants always get findings back. This is what makes the internal research program worth participating in and keeps people willing to say yes next time.

- **CSMs:** Share findings relevant to their account or customer type. Frame it as useful context for their own conversations — onboarding, POC, expansion.
- **SEs and field engineers:** Share findings that connect to what they see in the field. If research surfaced something they might encounter with customers, name it.
- **Internal engineers:** Tell them what changed based on their input. If their sanity check caught something, say what got fixed. It closes the loop.

---

## Tracking and logging

Log every person you contact and every person who participates in two places:
- **Research plan** — contacts and participants for this study
- **Participant recruitment tracker** — tracks participation across studies so you can see who's been pulled from recently

Kong's internal pool is small. Over-contacting the same people will burn trust with the field team, CSMs, and engineers over time. The research program only works if people feel like contributing to it is worthwhile, not a burden.

---

## Common mistakes and what goes wrong

**Wall of text in message one.**
People don't read it. Keep message one to 3-4 sentences. Context goes in message two.

**Missing the why-you line.**
The most common opt-out is "I'm not the right person." The why-you line is the only thing that prevents it. If it's not in message one, you'll lose people before they even ask what you need.

**Asking a CSM to identify the right customers.**
Do the Hex work first. Come with a specific account and a specific reason. Their job is to connect you, not to do your recruitment.

**Using the same why-you line for different engineer sub-types.**
A fresh-eyes engineer needs to hear that unfamiliarity is the reason you picked them. A role-match engineer needs to hear that their role is the qualification. A generic "we'd love your technical perspective" will get an opt-out.

**Posting in a general channel instead of DMing.**
Channel posts assume someone else will reply. Go person to person for every internal audience except as a last-resort fallback for CSMs via the account channel.

**Any mention of roadmap, timelines, or upcoming features.**
This is especially damaging with CSMs, but applies everywhere. Research is for learning, not for previewing what's coming. Never commit to what will or won't ship.

**Letting a CSM turn a research session into a cadence call.**
If they insist on joining, make sure they understand: hold back, don't answer product questions, let the customer speak. If it turns into a cadence call, the research value is gone.

**Not using Rovo to find people.**
Confluence has a lot of data on people at Kong — role, team, region. Searching Rovo directly before reaching out helps you identify the right person faster and reach out with a more specific why-you line.
