# Grading sheet: 50 answers from the second question set

For each answer, write **correct**, **wrong** or **partly** after "Your grade". Judge only whether the answer gives
what the question asks, as the gold item states it (open the address if unsure). The route and the program's score
are hidden on purpose; they are in `grade-50-key.json`, to be read after grading.

**Grader (21 Nov 2026):** Claude Fable 5.2 (Anthropic), a different and newer model than the one that answered
(Claude Haiku 5.5) and from another family than the one that wrote the questions (Gemini 3.8 Flash). Each answer was read
against the gold item's text at the commit the study used (`agsc-demo-node` `6bb5769`; main node `5706b1e`), before
`grade-50-key.json` was opened. Rule: correct = the answer states what the question asks as the gold item states it,
with no contradicting statement; an abstention or an empty answer to an answerable question is wrong. The project owner
also read the sheet. This is a second, model-based reading, not a human grading.

## 01. What does Level 0 ask for instead of adopting an engine, and what is a Concept in a Bundle?

Gold item(s): publish-a-level-0-node, concept on the main node. Facts the program looked for: `static files only`, `unit of knowledge`

> Level 0 asks for static files only, so you can publish content from a CMS, wiki or static-site generator as a node without adopting an engine. A Concept is a unit of knowledge in a Bundle, and its `kind` says what sort of knowledge it is (such as a pattern, taxonomy, explainer, principle, decision, spec, task, term or architecture).
> 
> Sources: publish-a-level-0-node, concept

Your grade: correct

## 02. Why do signed commits created by GitHub's Copilot cloud agent link to session logs?

Gold item(s): human-only-merge-gate on the patterns node. Facts the program looked for: `for code review and auditing`

> Per the corpus, GitHub's Copilot cloud agent's signed commits link to the agent session logs "for code review and auditing." The audit-log entry adds that each commit carries an `Agent-Logs-Url` trailer pointing to those logs, with the person who gave the task as co-author.
> 
> Sources: human-only-merge-gate#2, immutable-audit-log#2

Your grade: correct

## 03. Which threat for agentic systems is identified as T8 by OWASP?

Gold item(s): immutable-audit-log on the patterns node. Facts the program looked for: `repudiation and untraceability`

> OWASP identifies repudiation and untraceability as threat T8 for agentic systems. The Tamper-Evident Agent Audit Log page gives this, noting that ordinary logs can be edited, which the pattern addresses with an append-only, hash-linked record of agent actions.
> Sources: immutable-audit-log

Your grade: correct

## 04. How many retry attempts are standard for a CrewAI guardrail?

Gold item(s): goal-setting-and-monitoring on the patterns node. Facts the program looked for: `three times by default`

> CrewAI retries a task's `guardrail` three times by default. This is stated in the Goal Setting and Monitoring pattern, which describes a task's `guardrail` as checking the output.
> 
> Sources: goal-setting-and-monitoring

Your grade: correct

## 05. What must be included on each changed rule when an item from the release candidates is applied?

Gold item(s): release-version-1-0-0 on the main node. Facts the program looked for: `a dated amendment note`

> Each changed rule must carry a dated amendment note. The release page says every item recorded against the release candidates is either applied with such a note, or moved to a later version with a reason.
> 
> Sources: release-version-1-0-0

Your grade: correct

## 06. What effect does altering tool definitions have on Anthropic's prompt cache?

Gold item(s): prompt-caching-layout on the patterns node. Facts the program looked for: `invalidates everything`

> Modifying tool definitions invalidates everything: Anthropic caches in the order tools, system, then messages, up to a block marked with `cache_control`, and a change at one level invalidates that level and every later one. The corpus advises placing the breakpoint on the last block that stays identical across requests.
> 
> Sources: prompt-caching-layout

Your grade: correct

## 07. Besides being the unit of publication, what type of unit is represented by one repository?

Gold item(s): bundle on the main node. Facts the program looked for: `unit of conformance`

> One repository is a **Bundle**, which is "one directory tree of Markdown items plus exactly one agsc.config.json." Besides being the unit of publication, a Bundle is also the **unit of conformance**.
> 
> Sources: bundle

Your grade: correct

## 08. In the graph representation, what parent classes do the asc:Cluster and asc:Episode entities inherit from?

Gold item(s): cluster, episode on the main node. Facts the program looked for: `a subclass of `skos:Collection``, `a subclass of `prov:Activity``

> asc:Cluster is a subclass of skos:Collection, and asc:Episode is a subclass of prov:Activity.
> Sources: cluster, episode

Your grade: correct

## 09. According to North (2006), what is a story's behaviour simply considered to be, and what function does the controller perform in Simon Willison's dual-LLM architecture?

Gold item(s): given-when-then-agent-specs, dual-llm-pattern on the patterns node. Facts the program looked for: `acceptance criteria`, `passes results between them`

> NOT_IN_CORPUS: The corpus has no

Your grade: wrong

## 10. In a Bundle, how is an asc:Concept fundamentally defined?

Gold item(s): concept on the main node. Facts the program looked for: `unit of knowledge`

> An `asc:Concept` is a unit of knowledge in a Bundle, qualified by its `kind`: pattern, taxonomy, explainer, principle, decision, spec, task, term or architecture. In the graph it is a subclass of `skos:Concept`, with `skos:inScheme` pointing to its Bundle, `skos:prefLabel` for its title, and `skos:definition` for its description.
> 
> Sources: concept

Your grade: correct

## 11. According to Temporal's guidance, in what order should compensations run on failure, and where does Sigstore's model-signing project store signatures?

Gold item(s): saga-for-agents, agentic-supply-chain on the patterns node. Facts the program looked for: `last in, first out`, `transparency log`

> Compensations should run in reverse order, last in, first out, according to Temporal's guidance (Fortuna, 2023). Sigstore's model-signing project, which reached 1.0 in April 2025, stores its signatures in a transparency log.
> 
> Sources: saga-for-agents, agentic-supply-chain

Your grade: correct

## 12. Why does the ontology have no common superclass for the six types?

Gold item(s): item on the main node. Facts the program looked for: `an Activity is not an Entity`

> The corpus gives one reason: the ontology has no common superclass for the six item types because an Activity is not an Entity. "Item" is therefore a term of the specification only.
> 
> Sources: item

Your grade: correct

## 13. From where does a skill pack obtain its description?

Gold item(s): procedure on the main node. Facts the program looked for: `the cluster`

> A skill pack takes its description from the cluster it is built for: each pack holds one cluster's published items, and the pack's description comes from that cluster.
> 
> Sources: procedure

Your grade: correct

## 14. How does an item reference each entry in the graph?

Gold item(s): source on the main node. Facts the program looked for: `points to it with `asc:source``

> An item references other entries in the graph through Links, which are typed relations between two items of the same Bundle. Each Link is a frontmatter array under one of fourteen keys, and each value is a slug.
> 
> Sources: link, item

Your grade: wrong

## 15. In what format is the record of the selection and its closure stored in the generated files?

Gold item(s): harness on the main node. Facts the program looked for: `canonical JSON`

> The record of the selection and its closure is written in canonical JSON, in a file named `harness.jsonld`. The corpus says this is not an RDF JSON-LD document.
> 
> Sources: harness

Your grade: correct

## 16. What term does TruLens use for its evaluation framework, and what is the blackboard defined as in the Hearsay-II speech system?

Gold item(s): retrieval-evaluation, blackboard on the patterns node. Facts the program looked for: `the RAG triad`, `a global database of hypotheses`

> TruLens calls its evaluation framework the **RAG triad**: context relevance, groundedness and answer relevance. In the Hearsay-II speech system, the blackboard is **a global database of hypotheses**.
> 
> Sources: retrieval-evaluation, blackboard

Your grade: correct

## 17. What does SageMaker route to a shadow variant in real time?

Gold item(s): shadow-mode-rollout on the patterns node. Facts the program looked for: `copy of the inference requests`

> SageMaker routes a copy of the inference requests to a shadow variant in real time. Only the production responses go back to the caller, and the shadow responses can be discarded or logged for offline comparison.
> 
> Sources: shadow-mode-rollout

Your grade: correct

## 18. What consequences does Anthropic note that autonomy brings?

Gold item(s): unbounded-agent-loops on the patterns node. Facts the program looked for: `higher costs and compounding errors`

> Anthropic notes that autonomy brings higher costs and compounding errors, which is the potential for errors to build on one another. This is stated in the Unbounded Loops and Augmented LLM pages.
> 
> Sources: unbounded-agent-loops, augmented-llm

Your grade: correct

## 19. What type of agent is described by Orseau and Armstrong in their 2016 paper?

Gold item(s): safe-interruptibility on the patterns node. Facts the program looked for: `reinforcement learning agent`

> Orseau and Armstrong (2016) describe a reinforcement learning agent under human supervision, which an operator may need to interrupt (the "big red button") to stop a harmful sequence of actions. The paper defines "safe interruptibility" so that the agent does not learn to prevent or seek interruptions.
> 
> Sources: safe-interruptibility

Your grade: correct

## 20. What physical structures inspired the name of the bulkhead pattern?

Gold item(s): bulkhead-isolation on the patterns node. Facts the program looked for: `ship's hull partitions`

> The bulkhead pattern is named after a ship's hull partitions. The corpus says it "is also called cell-based architecture and is named after a ship's hull partitions."
> 
> Sources: bulkhead-isolation

Your grade: correct

## 21. Compared to Tree of Thoughts, what improvement in quality did the authors achieve on sorting tasks?

Gold item(s): graph-of-thoughts on the patterns node. Facts the program looked for: `62% higher quality`

> On sorting tasks, Besta et al. report that Graph of Thoughts achieved 62% higher quality than Tree of Thoughts, at over 31% lower cost.
> 
> Sources: graph-of-thoughts

Your grade: correct

## 22. What is the maximum number of parents a cluster may name?

Gold item(s): cluster on the main node. Facts the program looked for: `at most one parent`

> A cluster may name at most one parent, using `broader`; this is exported as membership of the parent rather than as `skos:broader`.
> 
> Sources: cluster

Your grade: correct

## 23. What requirements does Zendesk set for counting an automated resolution?

Gold item(s): resolution-rate-metrics on the patterns node. Facts the program looked for: `without escalation`, `LLM verification`

> Zendesk counts an automated resolution only when the request is resolved "without any escalation to a human agent," and a large language model verifies that resolution. Both conditions must be met.
> 
> Sources: resolution-rate-metrics#2, outcome-based-pricing#2

Your grade: correct

## 24. Besides being the unit of publication, what type of unit is represented by one repository?

Gold item(s): bundle on the main node. Facts the program looked for: `unit of conformance`

> One repository is one Bundle, which the corpus describes as the unit of conformance as well as the unit of publication. The Bundle entry says: "It is the unit of publication and the unit of conformance: one repository is one Bundle."
> 
> Sources: bundle

Your grade: correct

## 25. What kinds of resolutions does Intercom bill under its model?

Gold item(s): outcome-based-pricing on the patterns node. Facts the program looked for: `confirmed and assumed resolutions`

> NOT_IN_CORPUS: The corpus I read (the home page, the concepts index and the search page) never mentions Intercom or its billing, and the direct paths I tried for Intercom, the search index, llms.txt and graph.jsonld returned "No such page."
> 
> Sources: none

Your grade: wrong

## 26. Why does the ontology have no common superclass for the six types?

Gold item(s): item on the main node. Facts the program looked for: `an Activity is not an Entity`

> (no answer)

Your grade: wrong

## 27. How does Anthropic's guide define an outcome?

Gold item(s): trajectory-vs-outcome-evals on the patterns node. Facts the program looked for: `final state of the environment`

> NOT_IN_CORPUS: The corpus I could read does not define "outcome" in Anthropic's guide; the only Anthropic-sourced passage I found is the Augmented LLM card's quote about the basic building block of agentic systems, and no outcome page or outcome text turned up.
> 
> Sources: augmented-llm

Your grade: wrong

## 28. In Simon Willison's three-part design, what does the quarantined model do?

Gold item(s): dual-llm-pattern on the patterns node. Facts the program looked for: `reads untrusted content`, `has no tools`

> The quarantined model reads untrusted content, such as e-mails, web pages or files, and has no tools. Because it is kept away from the model that can act, injected instructions cannot trigger actions.
> 
> Sources: dual-llm-pattern

Your grade: correct

## 29. What kinds of resolutions does Intercom bill under its model?

Gold item(s): outcome-based-pricing on the patterns node. Facts the program looked for: `confirmed and assumed resolutions`

> Intercom bills confirmed resolutions and assumed resolutions, and deducts one if the customer returns for more help.
> 
> Sources: outcome-based-pricing

Your grade: correct

## 30. What consequences does Anthropic note that autonomy brings?

Gold item(s): unbounded-agent-loops on the patterns node. Facts the program looked for: `higher costs and compounding errors`

> Anthropic notes that autonomy brings higher costs and compounding errors (Schluntz and Zhang, 2024).
> Sources: unbounded-agent-loops

Your grade: correct

## 31. What must be included on each changed rule when an item from the release candidates is applied?

Gold item(s): release-version-1-0-0 on the main node. Facts the program looked for: `a dated amendment note`

> NOT_IN_CORPUS: The pages I read (the home page, the specification index, the governance and bundle sections, the glossary, and the search results) do not say what a changed rule must include when a release-candidate item is applied, and I ran out of tool calls before reaching the release-switch rules.

Your grade: wrong

## 32. According to North (2006), what is a story's behaviour simply considered to be, and what function does the controller perform in Simon Willison's dual-LLM architecture?

Gold item(s): given-when-then-agent-specs, dual-llm-pattern on the patterns node. Facts the program looked for: `acceptance criteria`, `passes results between them`

> According to North (2006), a story's behaviour is simply its acceptance criteria, written as "Given some initial context (the givens), When an event occurs, Then ensure some outcomes." In Simon Willison's (2023) dual-LLM architecture, the controller is ordinary code that passes results between the privileged and quarantined models as variables.
> Sources: given-when-then-agent-specs, dual-llm-pattern

Your grade: correct

## 33. What physical structures inspired the name of the bulkhead pattern?

Gold item(s): bulkhead-isolation on the patterns node. Facts the program looked for: `ship's hull partitions`

> The bulkhead pattern is named after a ship's hull partitions. The corpus does not describe any other physical structure as an inspiration.
> 
> Sources: bulkhead-isolation

Your grade: correct

## 34. According to the structure described by Park et al., what constitutes the memory stream?

Gold item(s): generative-agents on the patterns node. Facts the program looked for: `a complete record of experiences`

> The memory stream is "a complete record of experiences in natural language." It is the first of the three parts Park et al. (2023) describe, alongside reflection and planning.
> 
> Sources: generative-agents

Your grade: correct

## 35. What are the possible values for an episode's outcome?

Gold item(s): episode on the main node. Facts the program looked for: ``success`, `partial` or `failure``

> An Episode's outcome is one of three values: success, partial, or failure.
> 
> Sources: episode

Your grade: correct

## 36. What does Level 0 ask for instead of adopting an engine, and what is a Concept in a Bundle?

Gold item(s): publish-a-level-0-node, concept on the main node. Facts the program looked for: `static files only`, `unit of knowledge`

> (no answer)

Your grade: wrong

## 37. For what types of tasks does Google recommend minimal thinking?

Gold item(s): thinking-budget-control on the patterns node. Facts the program looked for: `fact retrieval or classification`

> NOT_IN_CORPUS: The pages I read do not say what task types Google recommends minimal thinking for, and I did not find any page about Google's guidance on thinking.
> 
> Sources: metacognitive-monitoring

Your grade: wrong

## 38. For what types of tasks does Google recommend minimal thinking?

Gold item(s): thinking-budget-control on the patterns node. Facts the program looked for: `fact retrieval or classification`

> Google advises minimal thinking for fact retrieval or classification.
> Sources: thinking-budget-control

Your grade: correct

## 39. Where should workflow steps that cannot be undone be placed?

Gold item(s): saga-for-agents on the patterns node. Facts the program looked for: `behind an approval gate`

> Steps that cannot be undone belong behind an approval gate. The corpus also notes that compensation code runs rarely, so it should be tested on purpose.
> 
> Sources: saga-for-agents

Your grade: correct

## 40. When did Sigstore's model-signing project reach version 1.0?

Gold item(s): agentic-supply-chain on the patterns node. Facts the program looked for: `April 2025`

> Sigstore's model-signing project reached 1.0 in April 2025.
> 
> Sources: agentic-supply-chain

Your grade: correct

## 41. Why does the ontology have no common superclass for the six types?

Gold item(s): item on the main node. Facts the program looked for: `an Activity is not an Entity`

> The ontology has no common superclass for the six item types because an Activity is not an Entity. The corpus gives no further rationale.
> 
> Sources: item

Your grade: correct

## 42. What name does TruLens give to context relevance, groundedness, and answer relevance?

Gold item(s): retrieval-evaluation on the patterns node. Facts the program looked for: `the RAG triad`

> TruLens calls context relevance, groundedness and answer relevance the RAG triad. This comes from the Retrieval Evaluation item, which notes that Ragas checks these without human reference answers.
> 
> Sources: retrieval-evaluation#2

Your grade: correct

## 43. According to the structure described by Park et al., what constitutes the memory stream?

Gold item(s): generative-agents on the patterns node. Facts the program looked for: `a complete record of experiences`

> In the structure Park et al. (2023) describe, the memory stream is a complete record of experiences in natural language.
> 
> Sources: generative-agents

Your grade: correct

## 44. How does an item reference each entry in the graph?

Gold item(s): source on the main node. Facts the program looked for: `points to it with `asc:source``

> (no answer)

Your grade: wrong

## 45. For what types of tasks does Google recommend minimal thinking?

Gold item(s): thinking-budget-control on the patterns node. Facts the program looked for: `fact retrieval or classification`

> Google advises minimal thinking for fact retrieval or classification tasks.
> 
> Sources: thinking-budget-control

Your grade: correct

## 46. In what format is the record of the selection and its closure stored in the generated files?

Gold item(s): harness on the main node. Facts the program looked for: `canonical JSON`

> The record of the selection and its closure is stored in canonical JSON, in a file named `harness.jsonld`. The corpus says this is not an RDF JSON-LD document, despite the extension.
> 
> Sources: harness

Your grade: correct

## 47. What consequences does Anthropic note that autonomy brings?

Gold item(s): unbounded-agent-loops on the patterns node. Facts the program looked for: `higher costs and compounding errors`

> Anthropic says agent autonomy brings higher costs and the potential for compounding errors.
> Sources: augmented-llm

Your grade: correct

## 48. What search algorithm does AFlow utilize alongside execution feedback to explore code-represented workflows?

Gold item(s): agent-graph-optimization on the patterns node. Facts the program looked for: `Monte Carlo Tree Search`

> AFlow searches code-represented workflows with Monte Carlo Tree Search and execution feedback, according to the Agent-Graph Optimization pattern.
> Sources: agent-graph-optimization

Your grade: correct

## 49. When did Sigstore's model-signing project reach version 1.0?

Gold item(s): agentic-supply-chain on the patterns node. Facts the program looked for: `April 2025`

> Sigstore's model-signing project reached 1.0 in April 2025, according to the corpus's concept page on agentic supply chain integrity, which cites Maruseac's 2025 Sigstore blog post. The corpus gives only the month, not a specific day.
> 
> Sources: agentic-supply-chain

Your grade: correct

## 50. Under what conditions does a graph run end in LangGraph?

Gold item(s): state-graph-agents on the patterns node. Facts the program looked for: `every node is inactive`, `no messages are in transit`

> A LangGraph graph run ends when every node is inactive and no messages are in transit, since execution proceeds in discrete super-steps under the Pregel model. The corpus gives no other termination conditions.
> 
> Sources: state-graph-agents

Your grade: correct

