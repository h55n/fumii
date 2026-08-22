# fumii — Hackathon Challenge Submission: Provenance (Confirmation Step)

**Project Name:** fumii — Physical AI Companion with Local Memory & Provenance Intelligence  
**Track:** Agentic Autonomous Systems  
**Team Members:** Mrunmayee Daware, Hassan Rehman, Yash Gadhave, Tanishq Mhetras  
**GitHub Repository:** [https://github.com/h55n/fumii](https://github.com/h55n/fumii)  
**Latest Release:** [fumii v2.0.0](https://github.com/h55n/fumii/releases/tag/v2.0.0)  

---

## 1. Challenge Statement & Motivation

> **Challenge Prompt:** *Extend the MVP with a capability related to origin and lineage of important information. Specifically, add a confirmation step for important actions affected by this concept. Teams should be free to decide the implementation approach while demonstrating a complete user flow.*

### The Problem in Companion AI
In personalized AI companions, conversational memory forms the foundation of empathy and continuity. However, standard LLM applications treat memory as a hidden, uninspected black box. Users have no transparency into:
1. **Which memories** actively influenced past responses.
2. **How frequently** a specific memory has been cited in prompt generation.
3. **What contextual intelligence will be permanently lost** if a memory is deleted or if memory is reset.

When destructive actions occur (such as deleting an episodic memory or performing a factory reset), traditional apps either perform the deletion silently or use a blind browser `confirm("Are you sure?")` modal with zero contextual disclosure.

---

## 2. The Solution: Provenance & Lineage Architecture

In **fumii**, we engineered an end-to-end memory lineage tracking system that connects real-time LLM prompt assembly to transparent, provenance-aware user confirmation flows.

```
                           PROVENANCE DATA FLOW IN FUMII
                           
     User Input ───▶ Memory Search (profile search)
                            │
                            ▼
              [Assembled Memory Context] ──────────┐
                            │                      │
                            ▼                      ▼
              LLM Prompt Builder (LAC)    recordMemoryCitations() (Fire-and-forget)
                            │                      │
                            ▼                      ▼
                 Streaming Tokens         memory_interactions Table
                                          (cite_count, first_cited, last_cited)
                                                   │
                            ┌──────────────────────┴──────────────────────┐
                            ▼                                             ▼
                   Single Memory Delete                          Clear All Memories
                            │                                             │
                            ▼                                             ▼
                   [ ProvenanceSheet ]                         [ ProvenanceAuditModal ]
           - Origin Date / Creation Age                 - Total memories & days of context
           - Citation Count: "shaped responses X×"      - Oldest to most recent timeline span
           - Context consequence explanation            - Top knowledge tags & influence bar
           - Dual Action: [keep it] vs [forget it]      - Dual Action: [go back] vs [erase everything]
```

---

## 3. Technical Implementation Details

### A. Database Layer (`electron/db/schema.ts`, `electron/db/queries.ts`)
We extended fumii's local SQLite database with a migration-safe `memory_interactions` table:
```sql
CREATE TABLE IF NOT EXISTS memory_interactions (
  memory_id TEXT PRIMARY KEY,
  cite_count INTEGER NOT NULL DEFAULT 0,
  first_cited TEXT,
  last_cited TEXT
);
```

- **`recordMemoryCitations(db, memoryIds)`**: Increments the `cite_count` and updates `last_cited` using atomic SQLite `ON CONFLICT DO UPDATE` queries.
- **`getMemoryProvenance(db, memoryId)`**: Fetches granular citation metrics for any single memory.
- **`getMemorySummary(db, allMemories)`**: Computes aggregate statistics across the entire memory graph, including timeline span (oldest to newest), days of context, top topic tag frequency, and total prompt citation influence.
- **`deleteMemoryProvenance(db, memoryId)`**: Cascades cleanup on memory deletion.

### B. Non-Blocking Citation Tracking (`electron/ipc/llmHandlers.ts`)
When relevant memories are assembled via `memory.profile()` during chat streaming, their IDs are dispatched to `recordMemoryCitations()` asynchronously. This guarantees **zero added latency** to real-time LLM token streaming.

### C. Confirmation User Flow 1: `ProvenanceSheet` (`src/dashboard/components/ProvenanceSheet.tsx`)
When a user clicks "delete" on an individual memory card:
1. The app intercepts the action and presents a slide-up confirmation sheet instead of deleting the data blindly.
2. Surfaces:
   - Creation date and age of the memory.
   - Total number of conversation responses it has actively shaped (`shaped responses 4×`).
   - The timestamp it was last cited in prompt context.
   - Associated topic tags.
   - A contextual impact statement: *"deleting this means fumii will forget this context in future conversations."*
3. Dual explicit action buttons: `keep it` (cancel) vs `forget it` (confirm deletion).

### D. Confirmation User Flow 2: `ProvenanceAuditModal` (`src/dashboard/components/ProvenanceAuditModal.tsx`)
When a user attempts to "Clear all memories":
1. The app opens a full-screen lineage audit modal.
2. Surfaces:
   - Total memories stored and total days of conversational context covered.
   - Timeline comparison between the oldest remembered memory and the most recent interaction.
   - Top knowledge topics fumii knows about the user.
   - A visual memory influence depth meter.
   - An optional text field: *"why are you starting over?"* (for qualitative user feedback).
3. Dual explicit action buttons: `go back` (safe cancel) vs `erase everything` (destructive wipe).

### E. Visual Badges & Automated Self-Test
- **`cited X×` Badges**: Memory cards in the dashboard dynamically display citation counts so users can see which knowledge is most influential.
- **Automated Self-Test (`electron/ipc/systemTestHandlers.ts`)**: Integrated Test 9 (`Memory Provenance & Lineage`) into the 9-point system test suite to verify database citation tracking, summary computation, and deletion cleanup automatically.

---

## 4. Verification & Testing
- **TypeScript Typecheck**: Verified zero errors across both main and renderer processes (`npm run typecheck` exit code 0).
- **Subsystem Test**: Test 9 executes in <10ms with 100% pass rate.
- **Desktop & Binary Package**: Shipped in `fumii v2.0.0` Windows Setup installer, Windows Portable zip, and Linux packages.
