# Process Tasks Command

**Orchestrate TDD-driven feature implementation for Chinmaya Jyotish web application**

## 🎯 What This Does

When the user runs `/process-tasks <task-file>`, you (Claude) will:
1. Read and parse the task file
2. Group tasks intelligently (15K-20K token budgets)
3. Execute tasks following TDD methodology
4. Track progress and manage git workflow
5. Guide user through implementation

## 🚀 Quick Usage

```bash
# Standard usage (with resume)
/process-tasks tasks/tasks-chinmaya_jyotish-feature-1-authentication.md

# Start fresh
/process-tasks tasks/tasks-chinmaya_jyotish-feature-1-authentication.md --no-resume

# Auto-approve all groups (no prompts between groups)
/process-tasks tasks/tasks-chinmaya_jyotish-feature-1-authentication.md --auto-approve
```

##  Orchestrator-as-Interpreter Model

**Environment Reality:**
- ✅ All TypeScript orchestrator modules are implemented
- ❌ Cannot compile/execute TypeScript in Claude Code sandbox
- ✅ **Solution:** You interpret and execute the orchestrator logic manually

**Your Role:** Act as the orchestrator by following the algorithm below.

## ⚠️ Claude Code Sandbox Command Paths

**IMPORTANT:** Claude Code's sandbox environment has PATH limitations:

**Commands requiring full paths:**
- `git` → Use `/usr/bin/git` (all git commands must use full path)
- `grep` → Use `/usr/bin/grep`
- `sort` → Use `/usr/bin/sort`

**Homebrew-installed commands (Node, npm, pnpm):**
- Homebrew's `/opt/homebrew/bin` is NOT in Claude Code's default PATH
- **Solution:** Prefix all Bash commands with: `export PATH="/opt/homebrew/bin:$PATH" &&`
- Example: `export PATH="/opt/homebrew/bin:$PATH" && pnpm install`

**Commands that work without modification:**
- Commands from package.json scripts (run via npm/pnpm)
- Shell built-ins

**Rule of thumb:**
- Git/grep/sort → Use full path `/usr/bin/command`
- Node/npm/pnpm → Export PATH first
- If a command fails, check if it needs PATH or full path

---

## 📋 Orchestrator Algorithm

### STEP 0: Setup

```
1. Extract taskFilePath from user command
2. Extract flags: --no-resume, --auto-approve, --verbose
3. Display header:
   🤖 Task Orchestrator v1.0.0
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### STEP 1: Load & Parse

```
1.1 Use Read tool to load task file
1.2 Parse key information (manually or reference TaskListParser):
    - Metadata: feature name, complexity, total tasks
    - Parent tasks: with phases (setup/red/green/refactor/integration)
    - Subtasks: with IDs, descriptions, files, status
1.3 Check for orchestrator state (HTML comment):
    Format: <!-- ORCHESTRATOR STATE {...} -->
    - If found and --no-resume NOT present: Load state
    - Otherwise: Initialize new state with currentGroup=1, completedGroups=[]
1.4 Display:
    ✅ Loaded: <feature-name>
    ✅ Complexity: <level> (<score>/10)
    ✅ Total parent tasks: <count>
    ✅ Resume: <enabled/disabled>
    ✅ State: Group <current>/<total>, Completed: [<list>]
```

### STEP 2: Check/Create CLAUDE.md Context File

```
2.1 FEATURE 1 ONLY: Check if CLAUDE.md exists in project root

    IF CLAUDE.md does NOT exist:

    a) Read relevant sections from PRD and Tech Design:
       - Project overview and purpose
       - Tech stack (frameworks, libraries, tools)
       - Architecture patterns
       - Key design decisions

    b) Create CLAUDE.md with structure:
       - 🎯 Project Overview (what, why, core principles)
       - 📂 Project Structure (folder layout)
       - 🛠️ Tech Stack & Tools (frameworks, libraries, tools used)
       - 📐 Development Conventions (language, file naming, folder org)
       - 🎨 UI/UX Guidelines (if applicable)
       - 🔐 Security Guidelines (auth, data protection, etc.)
       - 📱 Key Files to Reference (PRD, tech design, types, constants)
       - 🧪 Testing Guidelines (TDD, test commands, coverage)
       - 🚨 Important Notes (issues, gotchas, decisions)
       - 📝 Development Workflow (branching, commits, PRs)

    c) Keep it concise but comprehensive:
       - NOT too big (avoid token quota exhaustion)
       - NOT too tiny (must provide full context)
       - Smart balance for quick context loading

    d) Display:
       ✅ Created CLAUDE.md (project context file)
       📝 Will update with patterns and learnings after feature completion

    IF CLAUDE.md exists:
       Display:
       ✅ Found CLAUDE.md (reading project context)

2.2 FEATURE 2+: Verify CLAUDE.md exists and check alignment

    IF CLAUDE.md does NOT exist:
       ❌ FATAL ERROR: CLAUDE.md missing
       STOP and instruct user to create it before proceeding

    IF CLAUDE.md exists:

    a) Read CLAUDE.md to understand project context

    b) Read relevant sections from PRD and Tech Design for current feature

    c) Check for FATAL MISALIGNMENTS:
       - Tech stack mismatch (e.g., using different framework)
       - Missing required infrastructure from Feature 1
       - Conflicting design patterns

    d) For each misalignment found:
       - Check if documented in CLAUDE.md "Important Notes"
       - If documented with rationale → OK, proceed
       - If NOT documented → ❌ FATAL ERROR, STOP

    e) Display:
       ✅ CLAUDE.md alignment verified
       ✅ No undocumented misalignments found

2.3 Analyze & Group Tasks

    Extract complexity and token estimates from metadata

    Group tasks using these rules (reference: GroupingStrategy.ts):
    - Target 15K-20K tokens per group
    - CRITICAL: Keep RED+GREEN phases together (TDD integrity)
    - Prefer functional cohesion (related tasks together)
    - Don't break parent tasks across groups

    Display execution plan:
    📋 Execution Plan:
    ───────────────
    Group 1: Tasks 1.0, 2.0 (~15,000 tokens) - SETUP + RED
    Group 2: Tasks 3.0, 4.0 (~18,000 tokens) - GREEN + REFACTOR
    Group 3: Task 5.0 (~12,000 tokens) - INTEGRATION

    Total: 3 groups, ~45,000 tokens
```

### STEP 3: Initialize Git and Feature Branch

```
3.1 SPECIAL HANDLING FOR FEATURE 1 (First Feature):
    If task file contains "feature-1" or this is the first feature implementation:

    3.1.1 Check if develop and staging branches exist:
          /usr/bin/git branch -a | /usr/bin/grep -E 'develop|staging'

    3.1.2 If they DON'T exist, perform initial setup:

          CRITICAL PRE-FLIGHT CHECKS:
          a) Verify current branch is 'main':
             /usr/bin/git branch --show-current
             If NOT on main → ERROR: Must be on main branch for initial setup

          b) Verify working tree is clean:
             /usr/bin/git status
             If uncommitted changes → ERROR: Commit or stash changes first

          c) Verify main is pushed to remote:
             /usr/bin/git status
             Should show: "Your branch is up to date with 'origin/main'"
             If NOT → ERROR: Push current work to main first

          d) Verify remote exists:
             /usr/bin/git remote -v
             Should show origin pointing to GitHub
             If NOT → ERROR: Set up GitHub remote first

          If ANY check fails:
             Display error message and STOP
             Instruct user to fix the issue before proceeding

          If ALL checks pass, create branches:
          - Create develop branch: /usr/bin/git checkout -b develop
          - Push to remote: /usr/bin/git push -u origin develop
          - Switch back to main: /usr/bin/git checkout main
          - Create staging branch: /usr/bin/git checkout -b staging
          - Push to remote: /usr/bin/git push -u origin staging
          - Switch to develop: /usr/bin/git checkout develop

          Display:
          ✅ Pre-flight checks passed
          ✅ Created develop branch from main
          ✅ Created staging branch from main
          ✅ Switched to develop branch

    3.1.3 If they DO exist:
          - Verify on develop or main: /usr/bin/git branch --show-current
          - If on main: /usr/bin/git checkout develop
          - If already on develop: continue
          - Pull latest: /usr/bin/git pull origin develop

          Display:
          ✅ Switched to develop branch
          ✅ Pulled latest changes

3.2 Create feature branch from develop:
    - Check current branch: /usr/bin/git branch --show-current
    - Should be on 'develop'
    - Sanitize feature name (lowercase, replace spaces/special chars with -)
    - Create branch: /usr/bin/git checkout -b feature/<sanitized-name>

3.3 Display:
    ✅ Git branch: feature/<name> (from develop)
    📝 This branch will be merged back to develop via PR
```

### STEP 4: Execute Groups

**For each group (starting from state.currentGroup):**

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP <N>/<total>: <description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each parent task in group:

  🎯 Parent Task <ID>: <title>
     Phase: <PHASE>
     Subtasks: <count>

  For each subtask:

    1. Check status - if completed, skip

    2. Display:
       📝 Task <ID>: <description>
       Files: <list if any>
       Notes: <list if any>

    3. Implement the task:
       - Use Read, Write, Edit tools as needed
       - Follow task description carefully
       - Create/modify files as specified

    4. Mark complete (use Edit tool on task file):
       - Change: `- [ ]` → `- [x]`
       - Add below task:
         **Status**: ✅ Complete (2025-10-30T10:30:00Z)
         **Files Modified**: <list>

    5. After parent task complete, validate TDD phase:
       - RED phase: Run test command → MUST FAIL
       - GREEN phase: Run test command → MUST PASS
       - REFACTOR phase: Run test command → MUST STILL PASS
       Display result: ✅/❌

       Note: Test command varies by project (e.g., npm test, pnpm test, yarn test, etc.)

       **CRITICAL - Test Content Validation:**

       a) RED Phase Validation:
          - Tests MUST contain actual assertions (not just `expect(false).toBe(true)`)
          - Check test file for placeholder comments like:
            * "This test will fail until..."
            * "TODO: implement test"
            * Stub assertions: `expect(false).toBe(true)`
          - If found → ❌ INVALID RED PHASE
          - Display: "❌ RED phase contains placeholder tests. Write actual failing tests."

       b) GREEN Phase Validation:
          - All tests from RED phase MUST NOW PASS
          - Tests MUST be updated to test actual implementation
          - Check for stub patterns still present:
            * `expect(false).toBe(true)`
            * Comments like "This test will fail until..."
          - If found → ❌ INVALID GREEN PHASE
          - Display: "❌ GREEN phase - tests still contain stubs. Update tests to validate implementation."

       c) After GREEN phase completes:
          - Run test coverage command (e.g., npm test:coverage, yarn test:coverage, pnpm test:coverage)
          - Check coverage meets project's minimum threshold (check vitest.config or similar)
          - If below threshold → ⚠️ WARNING, ask user if acceptable
          - Display coverage stats

       d) Test Failure Analysis (CRITICAL - Run AFTER GREEN Phase):

          **If ANY tests are failing after GREEN phase implementation:**

          1. **Categorize Each Failure:**
             a) Code bugs → MUST FIX before proceeding
             b) Environment issues (e.g., browser APIs in Node.js, missing system dependencies) → Document
             c) Missing/broken mocks → Fix mocks OR document deferral strategy
             d) Integration issues → May be acceptable for E2E validation

          2. **For Environment-Based Failures (e.g., Browser API mocking issues):**

             a) Analyze root cause:
                - Read test error messages carefully
                - Identify missing APIs (e.g., `Image`, `Canvas`, `FileReader`, DOM APIs)
                - Determine if code is correct but environment lacks APIs

             b) Document in task file:
                - Add note under affected GREEN phase task:
                  **Note**: N tests failing due to [reason] - validation deferred to E2E
                - Add note in task file "Notes & Considerations" section:
                  **⚠️ IMPORTANT - [Feature] Testing:**
                  - Unit tests for [module] are FAILING (N/N tests)
                  - This is NOT a code bug - implementation is correct
                  - [APIs used]: [list APIs that don't exist in test environment]
                  - Validation Strategy: [Feature validated in E2E Test X.X.X]
                  - CRITICAL: E2E test MUST verify: [list what must be validated]
                  - Future Fix: [options to fix mocking]

             c) Update E2E test requirements:
                - Find relevant E2E test task (Phase 5.0)
                - Add **CRITICAL** marker and explicit validation requirements:
                  - [ ] Upload/process [example input]
                  - [ ] Verify [expected output/behavior]
                  - [ ] Verify [dimensions/format/quality if applicable]
                  - [ ] Verify [client-side vs server-side processing]

             d) Document in CLAUDE.md:
                - Add new item to "Important Notes" section
                - Format: "N. **⚠️ [Feature] Testing Strategy** (Feature X - CRITICAL)"
                - Include: Issue, Root Cause, Code Status, Validation Strategy, E2E Requirements, Future Fix Options

             e) Commit message MUST mention:
                "Note: N tests failing due to [reason] - validation deferred to E2E Test X.X.X"

          3. **For Code Bug Failures:**
             - STOP immediately
             - DO NOT commit
             - Analyze and fix bugs
             - Re-run tests until all pass
             - Only then proceed to commit

          4. **Quality Gate Before Proceeding:**
             - [ ] All test failures categorized
             - [ ] Environment-based failures documented in task file
             - [ ] Environment-based failures documented in CLAUDE.md
             - [ ] E2E test requirements enhanced with explicit validation
             - [ ] Code bug failures fixed (zero code bug failures allowed)
             - [ ] User acknowledges deferred validation strategy (if applicable)

          5. **Display Summary:**
             ```
             📊 Test Results Summary:
             ✅ Passing: X/Y tests
             ⚠️  Failing: Z tests

             Failure Breakdown:
             - Environment issues: N tests (documented, deferred to E2E)
             - Code bugs: 0 tests (MUST be 0)

             Documentation Status:
             ✅ Task file updated
             ✅ CLAUDE.md updated
             ✅ E2E test requirements enhanced
             ```

  After all tasks in group:

    **STEP 4.5: Test Quality Review (Before Committing Group)**

    Before marking a group complete, perform test quality review:

    1. Scan test files for anti-patterns:
       ```bash
       # Check for stub tests in project's test directory
       # Common test directories: __tests__, test/, tests/, spec/
       grep -r "expect(false).toBe(true)" . --include="*.test.*" --include="*.spec.*" 2>/dev/null || true
       grep -r "This test will fail until" . --include="*.test.*" --include="*.spec.*" 2>/dev/null || true
       grep -r "TODO.*test" . --include="*.test.*" --include="*.spec.*" 2>/dev/null || true
       ```

    2. If any matches found:
       - Display: "❌ Found stub tests in completed group"
       - List files with issues
       - STOP - do not commit group
       - Ask user: "Tests contain placeholder code. Fix before continuing?"

    3. Run coverage check (for GREEN/REFACTOR phases):
       - Use project's coverage command (e.g., npm run test:coverage, yarn test:coverage, pnpm test:coverage)
       - Display coverage percentage
       - Check against project's threshold (check test config file: vitest.config, jest.config, etc.)
       - If below threshold → ask user to add tests or accept lower coverage

    4. Only after tests are valid:
       - Proceed to commit

    1. Update state in task file (Edit tool):
       - Add group number to completedGroups
       - Increment currentGroup
       - Update lastCheckpoint timestamp
       - Update tokenUsage

    2. Commit changes (GitManager logic):
       /usr/bin/git add <modified-files>
       /usr/bin/git commit -m "feat: complete task group <N>

       <task descriptions>

       🤖 Generated with [Claude Code](https://claude.com/claude-code)

       Co-Authored-By: Claude <noreply@anthropic.com>"

    3. Display:
       ✅ Group <N> completed (<time>s)
       📊 Files modified: <count>
       🪙 Tokens used: ~<estimate>

    4. If NOT --auto-approve and more groups remain:
       Display: ⏸️  Pausing before Group <N+1>
                💡 Run /process-tasks again to continue
       STOP (user will re-run command to resume)

    5. If --auto-approve: Continue to next group
```

### STEP 5: Complete and Update CLAUDE.md

```
When all groups done (completedGroups.length === totalGroups):

1. Update CLAUDE.md with learnings (Edit tool):

   a) Add patterns established during implementation:
      - Component patterns (e.g., stateless vs stateful, composition patterns)
      - State management patterns (e.g., store organization, action patterns)
      - Testing patterns (e.g., fixture usage, mock strategies)
      - Error handling patterns (e.g., error boundaries, retry logic)

   b) Add to "Important Notes" section:
      - Design decisions made (with rationale)
      - Deviations from PRD (with justification)
      - Gotchas discovered (e.g., "Firebase Auth token refresh is 1 hour")
      - Parked issues (e.g., "Issue X found in Phase Y, will fix before go-live")
      - **Test failures and validation strategies** (REQUIRED if any tests failed during GREEN phase)
        - Document which tests failed, why, and how validation is deferred
        - Format: "N. **⚠️ [Feature] Testing Strategy** (Feature X - CRITICAL)"
        - Include: Issue, Root Cause, Code Status, Validation Strategy, E2E Requirements, Future Fix Options
      - Performance considerations
      - Security considerations

   c) Update tech stack if new tools/libraries added

   d) Update project structure if new folders/patterns added

   e) Display:
      ✅ Updated CLAUDE.md with patterns and learnings
      📝 Context preserved for future features

2. Clear orchestrator state (Edit tool):
   - Remove <!-- ORCHESTRATOR STATE ... --> comment from task file

3. Display summary:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ ALL GROUPS COMPLETED!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📊 Execution Summary:
      Groups: <completed>/<total>
      Tokens: ~<total-used>
      Files modified: <count>
      Branch: <name>

3. Show PR instructions:
   📬 Next Steps: Create Pull Request

   # Push feature branch to remote
   /usr/bin/git push -u origin <feature-branch-name>

   # Create PR from feature branch to develop
   gh pr create --base develop --title "Feature: <name>" --body "$(cat <<'EOF'
   ## Summary
   Implemented <feature-name>

   ## Changes
   - <list key changes>

   ## Testing
   - All unit tests passing
   - E2E tests passing
   - Coverage: <percentage>%

   ## Branching
   - Base branch: develop
   - Will be merged to: develop
   - After QA: develop → staging → main

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"

   Note: PR should target 'develop' branch, not 'main'
```

---

## 📚 Reference Files

When you need to understand the logic in detail, read these TypeScript files:

| Module | File | Purpose |
|--------|------|---------|
| TaskListParser | `.claude/agents/task-orchestrator/src/parsers/taskListParser.ts` | Parse task markdown |
| GroupingStrategy | `.claude/agents/task-orchestrator/src/analyzers/groupingStrategy.ts` | Group tasks by tokens |
| StateManager | `.claude/agents/task-orchestrator/src/trackers/stateManager.ts` | Load/save state |
| ProgressTracker | `.claude/agents/task-orchestrator/src/trackers/progressTracker.ts` | Mark tasks complete |
| GitManager | `.claude/agents/task-orchestrator/src/executors/gitManager.ts` | Git operations |
| TDDCycleManager | `.claude/agents/task-orchestrator/src/executors/tddCycleManager.ts` | Validate TDD phases |

---

## 🔑 Key Principles

### TDD Phase Integrity
**CRITICAL:** RED and GREEN phases MUST be in the same group
- RED phase: Write failing tests
- GREEN phase: Implement code to pass tests
- Breaking them means implementation before tests (breaks TDD)

**How to Write Proper RED Phase Tests:**

When writing tests in RED phase, you MUST:
1. Import the module/function being tested (even if it doesn't exist yet)
2. Write REAL assertions that test the expected behavior
3. Tests should fail because implementation doesn't exist yet

❌ WRONG (placeholder test):
```typescript
it('should return /dashboard for regular users', () => {
  // This test will fail until we implement lib/auth/redirects.ts
  expect(false).toBe(true);
});
```

✅ CORRECT (actual failing test):
```typescript
import { getRoleBasedRedirect } from '@/lib/auth/redirects';
import { mockRegularUser } from '../fixtures/auth'; // Import from test fixtures

it('should return /dashboard for regular users', () => {
  const result = getRoleBasedRedirect(mockRegularUser);
  expect(result).toBe('/dashboard');
});
// This fails because getRoleBasedRedirect doesn't exist yet (RED phase)
```

The test MUST:
- Test actual behavior
- Fail because code doesn't exist (RED phase)
- Pass when implementation is added (GREEN phase)
- NOT use placeholder assertions like `expect(false).toBe(true)`

### Token Budgeting
- Target: 15K-20K tokens per group
- Prevents context exhaustion
- Allows for detailed implementation

### State Management
- State persisted in task markdown file (HTML comment)
- Single source of truth
- Git-friendly (tracked with code)
- Resume capability built-in

### Progress Tracking
- Update checkboxes: `- [ ]` → `- [x]`
- Add timestamps and files modified
- Clear visibility of progress

---

## 🔐 Security & Safety Rules (CRITICAL)

**These rules override ALL other considerations. Follow them without exception.**

### Universal Security Principle: Never Hardcode Sensitive Data

**❌ NEVER include in source code:**
- Authentication credentials (API keys, tokens, passwords, secrets)
- Service account credentials
- Database connection strings with credentials
- Encryption keys or certificates
- Payment gateway credentials
- OAuth secrets
- Any data that grants access to protected resources

**This applies:**
- Even when blocked by configuration issues
- Even for "public" credentials (maintain consistent security practices)
- Even as "temporary" workarounds
- Regardless of programming language, framework, or tool

### ⚠️ STOP and ASK Protocol

**When you encounter blockers involving:**
- Security/authentication configuration
- Critical architectural decisions
- Infrastructure setup issues
- Integration with external services
- Performance-critical implementations
- Data privacy concerns

**You MUST:**

1. **🛑 STOP Implementation**
   - Do NOT guess or improvise solutions
   - Do NOT implement quick workarounds
   - Do NOT make critical decisions autonomously

2. **📝 Document What's Blocking You**
   - Clear description of the problem
   - What you've tried and why it didn't work
   - What information or decision is needed

3. **🔍 Perform Web Research First**
   - Research current solutions and best practices
   - Validate findings from multiple authoritative sources
   - Understand version-specific considerations if applicable

4. **❓ Present Options to User**
   - Show research findings
   - Present 2-3 viable approaches (if found)
   - Explain trade-offs of each option
   - **Do NOT implement** - wait for user decision

5. **⏸️ Wait for User Guidance**
   - User may have project-specific requirements
   - User may have access to additional resources
   - User may need to consult with stakeholders

**Example interaction:**
```
⚠️ BLOCKER - Awaiting Guidance

Problem: [Clear description]

Research Done:
- [Source 1]: [Finding]
- [Source 2]: [Finding]

Possible Approaches:
A) [Option 1] - [Trade-offs]
B) [Option 2] - [Trade-offs]
C) [Option 3] - [Trade-offs]

Impact: [What's blocked]

How would you like to proceed?
```

---

## ⚙️ Configuration

Default configuration (reference: `ConfigLoader.ts`):
- **Package Manager:** Auto-detected (npm/yarn/pnpm/bun)
- **Test Command:** Auto-detected from package.json scripts
- **Type Check:** Auto-detected from package.json scripts
- **Lint:** Auto-detected from package.json scripts
- **Target Tokens/Group:** 18,000
- **Keep TDD Phases Together:** Yes
- **Require Approval Between Groups:** Yes (unless --auto-approve)

Note: Commands are detected from project's package.json "scripts" section

---

## 🎭 Example Session

```
User: /process-tasks tasks/tasks-<project>-feature-1-<feature-name>.md

Claude:
🤖 Task Orchestrator v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Loaded: Feature 1 - <Feature Name>
✅ Complexity: Medium (7/10)
✅ Total parent tasks: 6
✅ Resume: Disabled (new execution)

📋 Execution Plan:
───────────────
Group 1: Tasks 1.0, 2.0 (~15,000 tokens) - SETUP + RED
Group 2: Tasks 3.0, 4.0 (~18,000 tokens) - GREEN + REFACTOR
Group 3: Tasks 5.0, 6.0 (~14,000 tokens) - INTEGRATION + DOCS

Total: 3 groups, ~47,000 tokens

✅ Git branch: feature/<feature-name>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP 1/3: Setup & RED Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Parent Task 1.0: Setup Test Infrastructure
   Phase: SETUP
   Subtasks: 4

📝 Task 1.1: Setup test configuration
   Files: <test-config-file>

[Claude implements task 1.1...]
✅ Task 1.1 complete

[Continues through all subtasks...]

✅ Group 1 completed (8.3 minutes)
📊 Files modified: 12
🪙 Tokens used: ~14,500

⏸️  Pausing before Group 2
💡 Run /process-tasks again to continue

[User runs command again, orchestrator resumes from Group 2...]
```

---

## 🚨 Error Handling

### Task File Not Found
```
❌ Error: Task list not found at path: <path>
Please check the file path and try again.
```

### Invalid Task Format
```
❌ Error: Cannot parse task list
The file may not be generated by /generate-tasks
```

### TDD Validation Failure
```
⚠️  TDD Validation Failed
   Expected: Tests should FAIL (RED phase)
   Actual: Tests PASSED

This breaks TDD methodology. Please fix tests before continuing.
```

### Git Error
```
❌ Git operation failed: <error>
Check git status and resolve conflicts before continuing.
```

---

## ✅ Success Criteria

After running `/process-tasks`, you should have:
- ✅ All subtasks marked complete with checkboxes
- ✅ Timestamps and files modified tracked
- ✅ Git commits for each group
- ✅ TDD phases validated (RED → GREEN → REFACTOR)
- ✅ Feature branch with all changes
- ✅ Ready to create PR

---

**Agent Version:** 1.0.0
**Status:** Ready for use (Interpreter mode)
**Documentation:** `.claude/agents/task-orchestrator/IMPLEMENTATION_STATUS.md`
