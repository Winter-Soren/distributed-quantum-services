# OSV Fellowship Submission Draft

This is the near-final, paste-ready version of the 2026 OSV Fellowship form.
It assumes the following are accurate:

- you can commit `50-60 hours/week`
- Protocol Labs Dev Guild can be listed under prior programs
- this project has not received dedicated external funding yet

Still needs your final input:

- pitch video link
- minimum funding number
- how you heard about OSV
- whether you want to add a recommender
- a final pass on the "something beautiful" answer so it sounds unmistakably like you

## 1. List 3 of your most exceptional achievements

1. At 15, I built an air-based engine from e-waste scraps that reached 55% efficiency and got me nominated to present at IIT Bombay Techfest. Building something that ambitious from scrap at that age changed how I thought about engineering forever.

2. At 16, I qualified for a state-level swimming competition, then broke my arm 52 days before the event. After 37 days of recovery, I trained relentlessly despite barely being able to move my arm properly for butterfly, and still finished 3rd at the state level. I count that as exceptional because it taught me how to perform under pain, pressure, and almost no runway.

3. In the final year of my BTech, I proposed and helped build what became the first blockchain lab of its kind in my state, with my professors as mentors. I took it from requirements and infrastructure design to mining setup and student enablement so others could build on top of it, and the work was praised by Larsen & Toubro Infotech, Sun Global, and the Cyber Peace Foundation.

Alternative stronger-version note:

If you want these even tighter for the final form, keep each to 2 sentences max and preserve the age markers. They make the trajectory much more memorable.

## 2. What are you working on?

I am building the coordination layer for a future where quantum computing is not one black-box machine, but a network of specialized services. The system discovers what capabilities exist, decides where each part of a workflow should run, survives failures, and returns results researchers can inspect, compare, and improve.

Optional higher-hook version:

I am building a torrent network for quantum services. Instead of one machine doing all the work, a network of specialized nodes can advertise capabilities, coordinate execution, recover from failure, and contribute to a larger workflow.

## 3. Explain your work in 1-2 sentences using zero jargon

Most quantum software assumes one machine. I am building software for a future where many specialized machines work together across a network: it figures out what is available, decides where each step should run, recovers from failure, and returns results people can actually inspect.

## 4. If selected, how many hours can you commit each week?

50-60 hours per week.

## 5. Why are you the best person to work on this? What is novel in your approach?

I have spent the last few years building at the boundary between distributed systems, production software, and quantum research. At Protocol Labs, I worked on decentralized networking primitives. At Oracle, I shipped production systems in GenAI and orchestration. In parallel, I kept building and publishing in quantum machine learning. This project exists because I am willing to build across backend, networking, runtime, persistence, visualization, and docs instead of stopping at one layer. The novel part of my approach is that I am not treating future quantum computing as only an algorithms problem. I am treating it as an infrastructure problem: discovery, placement, reservation, fallback, recovery, and measurement for distributed quantum services.

## 6. Pitch video

Paste your final public link here:

`[insert pitch video link]`

Suggested script:

Most quantum software assumes one circuit and one machine. I am building the coordination layer for a future where quantum capabilities are distributed across a network of specialized services. I already have a working system that discovers services, plans workflows, survives failures, and returns inspectable results. With OSV support, I want to turn it from a strong prototype into a serious experimental platform for measuring how distributed quantum infrastructure should actually be coordinated.

Alternative opening if you want a stronger hook:

You can think of this as a torrent network for quantum services. Instead of one black-box backend, I am building a peer-to-peer coordination layer where specialized quantum nodes can advertise capabilities, share work, recover from failure, and make the whole system more resilient and inspectable.

## 7. What could success look like 1 year from now? What about beyond your wildest dreams?

One year from now, success means I have turned this into a serious experimental platform instead of just a strong prototype. Concretely, that means a stable distributed mode, a stable centralized baseline mode, a reproducible scenario runner, telemetry-backed planner signals, and a public benchmark report comparing latency, success rate, retries, fallback behavior, and result quality across failure scenarios. Beyond my wildest dreams, it becomes an open testbed that researchers use to study how networked quantum infrastructure should actually be coordinated, the way distributed systems researchers use cloud testbeds today.

## 8. What might failure look like? What could be some original mistakes of your project?

Failure would look like building something that is architecturally impressive but scientifically unconvincing. The original mistakes would be spending too long polishing the coordinator before building the comparison harness, trusting synthetic planner signals for too long, or mistaking a good demo for a real measurement platform. Another failure mode would be choosing abstractions that are too coordinator-centric and not grounded enough in how future heterogeneous quantum services may actually evolve.

## 9. 1-page action-plan PDF

Use:

- `OSV_ACTION_PLAN_DRAFT.md`

Convert the final version into a 1-page PDF using Arial `11pt` and `1.5` line spacing.

## 10. Describe something you find beautiful in the world

Starter draft. Please personalize this before submission:

I find it beautiful when people decide to build something difficult together before they know whether it will work. I have seen that in hackathons at 2 a.m., in research labs, in classrooms, and in community projects. There is a very human kind of optimism in turning a sketch on a whiteboard into working code and then into something that helps someone real. That moment, where imagination becomes shared effort, never stops amazing me.

## 11. Minimum funding needed to pursue this full-time for a year

My minimum funding need for 12 months is $[insert real number]. That covers living expenses, compute and testing infrastructure, hardware, and a modest buffer for travel or collaboration.

## 12. Have you been part of any accelerators, incubators, grants, or similar programs?

I have participated in Protocol Labs' Dev Guild, where I contributed to decentralized systems work including py-libp2p and related networking components. Other than that, I have not been part of a traditional accelerator for this project.

## 13. Have you received funding for this specific project before?

No. This project has not received dedicated external funding so far. I have been building it through my own time and effort.

## 14. How did you hear about the fellowship?

[replace with the true path: X, LinkedIn, OSV content, founder circles, or a recommendation]

## 15. Optional recommendation

If you include one, the strongest recommender is probably someone who has seen you ship hard things directly:

- an Oracle manager who saw your execution up close
- a Protocol Labs mentor or lead
- a research advisor who can speak to both depth and independence

## Final pass before submission

- keep the third achievement version you want and delete the other one
- make sure the pitch video link works without permissions
- fill the real funding number
- personalize the beauty answer
- replace the "how I heard about OSV" line
- do one read-out-loud pass for tone and rhythm
