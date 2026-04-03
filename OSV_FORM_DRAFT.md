# OSV Fellowship Form Draft

Replace anything inaccurate before submission.
This draft is now tuned to OSV's actual form style: short, concrete, quantified, and personal.

## Style reminder before you submit

- keep answers short
- lead with the strongest fact in sentence one
- prefer numbers over adjectives
- sound like yourself, not like a proposal writer
- do not claim roadmap items are already complete

## 1. List 3 of your most exceptional achievements

Recommended version:

### Achievement 1

`At 15, I built an air-based engine from e-waste scraps that reached 55% efficiency and got me nominated to present at IIT Bombay Techfest. Building something that ambitious from scrap at that age changed how I thought about engineering forever.`

### Achievement 2

`At 16, I qualified for a state-level swimming competition, then broke my arm 52 days before the event. After 20 days of recovery, I trained relentlessly despite barely being able to move my arm properly for butterfly, and still finished 3rd at the state level. I count that as exceptional because it taught me how to perform under pain, pressure, and almost no runway.`

### Achievement 3

`In the final year of my BTech, I proposed and helped build what became the first blockchain lab of its kind in my state, with my professors as mentors. I took it from requirements and infrastructure design to mining setup and student enablement so others could build on top of it, and the work was praised by Larsen & Toubro Infotech, Sun Global, and the Cyber Peace Foundation.`

Alternative tightening note:

`For the final form, keep each achievement to 1-2 sentences max and preserve the age markers. They make the story more memorable.`

## 2. What are you working on?

`I am building the coordination layer for a future where quantum computing is not one black-box machine, but a network of specialized services. The system discovers what capabilities exist, decides where each part of a workflow should run, survives failures, and returns results researchers can inspect, compare, and improve.`

## 3. Explain your work in 1-2 sentences using zero jargon

Recommended version:

`Most quantum software assumes one machine. I am building software for a future where many specialized machines work together across a network. It figures out what is available, decides where each step should run, recovers from failure, and returns results people can actually inspect.`

Shorter alternative:

`I am building the control layer for networked quantum tools. Instead of relying on one perfect machine, it helps many imperfect ones find each other, split up work, recover from failure, and produce results researchers can improve over time.`

## 4. If selected, how many hours can you commit each week?

`50-60 hours per week.`

Only keep this if it is fully true.

## 5. Why are you the best person to work on this? What is novel in your approach?

`I am well suited to this because I have been building across boundaries that usually stay separate: production software, distributed systems, multi-agent tooling, and quantum research. I have worked on decentralized networking through Protocol Labs, shipped production systems at Oracle, and built this project end to end across backend, networking, runtime, persistence, visualization, and docs. The novel part of my approach is that I am treating future quantum computing as an infrastructure problem, not just an algorithms problem. I am building the coordination layer: discovery, placement, reservation, fallback, recovery, and inspectable results for distributed quantum services.`

## 6. Pitch video

Paste your final public link here:

`[Insert public pitch video link]`

Suggested script:

`Most quantum software assumes one circuit and one machine. I am building the coordination layer for a future where quantum capabilities are distributed across a network of specialized services. I already have a working system that discovers services, plans workflows, survives failures, and returns inspectable results. With OSV support, I want to turn this from a strong prototype into a serious experimental platform for measuring distributed quantum-service coordination.`

## 7. What could success look like 1 year from now? What about beyond your wildest dreams?

`One year from now, success means I have turned this into a serious experimental platform instead of just a strong prototype. Concretely, that means: a stable distributed mode and centralized baseline mode, a reproducible scenario runner, telemetry-backed planner signals, and a public benchmark report comparing latency, success rate, retries, fallback behavior, and result quality across failure scenarios. Beyond my wildest dreams, this becomes a standard open sandbox for testing how networked quantum infrastructure should actually be coordinated, the way cloud researchers use distributed systems testbeds today.`

## 8. What might failure look like? What could be some original mistakes of your project?

`Failure would look like building something that is architecturally impressive but scientifically unconvincing. The original mistakes would be spending too long polishing the coordinator before building the comparison harness, trusting synthetic planner signals for too long, or mistaking a good demo for a real measurement platform. Another failure mode would be choosing abstractions that are too coordinator-centric and not grounded enough in how future heterogeneous quantum services may actually evolve.`

## 9. 1-page action-plan PDF

Working source:

- `OSV_ACTION_PLAN_DRAFT.md`

Submission note:

`Convert the final version into a 1-page PDF using Arial 11pt and 1.5 line spacing.`

## 10. Describe something you find beautiful in the world

Do not outsource this answer.
This is one of the easiest places to accidentally sound fake.

Good direction:

- write about something concrete
- make it sensory or observed
- keep it to `4-8` lines
- do not try to sound profound

## 11. Minimum funding needed to pursue this full-time for a year

Recommended structure:

`My minimum funding need for 12 months is $[insert]. That covers living expenses, compute and testing infrastructure, hardware, and a modest buffer for travel or collaboration.`

You should fill this with a real number.
Do not leave it vague in the final form.

## 12. Have you been part of any accelerators, incubators, grants, or similar programs?

Draft if accurate:

`I have participated in Protocol Labs' Dev Guild, where I contributed to decentralized systems work including py-libp2p and related networking components. [Add any accelerator, grant, fellowship, or incubator only if fully accurate.]`

## 13. Have you received funding for this specific project before?

Draft if accurate:

`No, this project has not received dedicated external funding so far. It has been developed through my own time and effort.`

If that is not true, replace it now.

## 14. How did you hear about the fellowship?

Fill with the true path, for example:

`Through X / LinkedIn / founder circles / OSV content / a recommendation from [name].`

## 15. Optional recommendation

Only add a recommender if the person can genuinely vouch for:

- your agency
- your execution speed
- your originality
- your likelihood of following through for a year

Best recommender profile for OSV:

- someone who has seen you ship hard things directly
- not necessarily the most famous person

## Final checklist

- remove any placeholder that is still generic
- make sure the pitch link works without access requests
- keep all claims consistent with the current repo state
- do not say all tests pass
- do not say the centralized baseline and experiment harness are already complete
- read every answer out loud once before submitting
