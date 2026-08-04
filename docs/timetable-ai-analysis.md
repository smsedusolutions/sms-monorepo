# Analysis: Timetable Generation Algorithm & Architecture

This document provides a technical overview of the AI-powered timetable generation system, its implementation, and design decisions.

## 1. System Architecture

The system follows a standard client-server architecture with a specific service dedicated to the scheduling logic.

### Frontend Components
- **TimetableMaster.tsx**: The main management interface with AI Auto-Generate button.
- **AITimetableGenerateDialog.tsx**: The wizard UI for configuring subject rules (Periods/Week, Max/Day, Morning Priority) and global options (Half-day Saturday). Includes user-friendly instructions and parent/sub-subject filtering.
- **Timetable Queries**: TanStack Query hooks (`useValidateAITimetable`, `useGenerateAITimetable`) connecting to the backend.

### Backend Components
- **Routes**: Defines `/ai/validate` and `/ai/generate` endpoints in `sm-academics-service`.
- **AI Controller**: Orchestrates data fetching (Teachers, Classes, Config) and calls the AI service.
- **AI Service**: The core engine containing the generation logic (`timetable-ai.service.js`).

---

## 2. Core Algorithm — Backtracking Constraint Satisfaction Solver

The engine uses a **Backtracking Solver** with the **Most Constrained Variable (MCV)** heuristic and **O(1) conflict detection** via lookup maps.

### Generation Logic (`attemptGeneration`)

1. **Subject Filtering**: Parent subjects that have sub-subjects (e.g., "Science" with Biology, Chemistry, Physics) are automatically excluded. Only leaf/schedulable subjects are processed. Subjects with `periodsPerWeek = 0` are skipped. Teachers with no subject assignments are excluded.

2. **Job Preparation**: All required periods are flattened into a "jobs" list — one job per `(section × subject × period-instance)`.

3. **MCV Ordering**: Jobs are sorted by constraint density:
   - Subjects with the fewest eligible teachers come first (hardest to place)
   - Within same constraint level, subjects with higher `periodsPerWeek` come first
   - Morning-priority subjects are prioritized
   - Within the same group, jobs are shuffled to avoid section bias

4. **Slot Pre-computation**: Available periods per day are pre-computed respecting `dayLimits` (e.g., Saturday cutoff). Morning/afternoon periods are identified per day.

5. **O(1) Conflict Detection**: Instead of scanning the schedule array (O(n)), the solver uses lookup maps:
   - `sectionSlots`: `"classId|sectionId|day|period"` → occupied
   - `teacherSlots`: `"teacherId|day|period"` → occupied
   - `sectionDailyCounts`: `"classId|sectionId|day|subjectId"` → count

6. **Smart Slot Ordering** for each job:
   - Days are shuffled for even distribution
   - `maxPeriodsPerDay` is checked before considering any slots on a day
   - Morning-priority periods are tried first (if the rule has `morningPriority`)
   - Teachers are sorted by least-workload-first (load balancing)

7. **Backtracking**: For each job, the solver tries all valid `(day, period, teacher)` combinations. If placing a job leads to a dead-end for a later job, the placement is **undone** (backtracked) and the next option is tried. This guarantees a valid solution is found if one exists.

8. **Safety limits**: Maximum 50,000 backtracks per attempt, maximum 50 retry attempts with different random seeds.

### Guarantees
- ✅ **No teacher double-booking** — same teacher cannot be in two classes at the same time
- ✅ **No class double-booking** — same class/section cannot have two subjects at the same time
- ✅ **maxPeriodsPerDay respected** — checked as hard constraint before slot consideration
- ✅ **dayLimits respected** — Saturday cutoff enforced as hard constraint
- ✅ **Morning priority** — used as preference for slot ordering, not a hard gate
- ✅ **Teacher workload balancing** — least-loaded teacher is preferred

---

## 3. Validation (`validateConstraints`)

Pre-generation validation checks:

1. **Per-subject availability**: For each subject, calculates total periods needed across all classes/sections vs. total slots available from assigned teachers. Reports shortages.

2. **Shared-teacher bottleneck detection**: Identifies teachers who are the sole teacher for multiple subjects and whose combined demand exceeds their available slots.

3. **Parent subject filtering**: Skips parent subjects that have sub-subjects (same as generation).

---

## 4. Subject Hierarchy Handling

### Parent/Sub-Subject Rules
- If a subject (e.g., "Science") has sub-subjects (Biology, Chemistry, Physics), the parent subject is **hidden** from the AI configuration UI
- Only the sub-subjects appear, labeled as `"Biology (Science)"` format
- Sub-subjects are visually grouped under a parent header with indentation
- Main subjects without any sub-subjects appear normally

### Frontend Implementation
- `getSchedulableSubjects()` function filters and groups subjects
- Grouped display with section headers and visual indentation
- Collapsible help panel with clear explanations of each input

---

## 5. Previous Issues (Resolved)

| Issue | Resolution |
|-------|-----------|
| Lack of Backtracking (greedy algorithm) | ✅ Full backtracking solver implemented |
| Deadlocks in Shuffling | ✅ MCV ordering + controlled shuffling within groups |
| Teacher Overlap Blindness | ✅ Shared-teacher bottleneck validation added |
| Morning Priority Conflicts | ✅ Morning priority is now a slot-ordering preference, not a hard gate |
| Parent/Sub-subject confusion | ✅ Parent subjects auto-hidden when sub-subjects exist |
| O(n) schedule scanning | ✅ O(1) lookup maps for conflict detection |
