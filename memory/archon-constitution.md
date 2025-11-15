# Archon Job Application Automation Constitution

## Purpose

This constitution defines the principles, workflows, and standards for using Archon as the primary task management system for the Ronin Job Hunter application. Archon serves as the central knowledge base and task tracking system, integrated with Notion for documentation and Cursor for development.

## Core Principles

### 1. Task-Driven Development

**MANDATORY: Always complete the full Archon task cycle before any coding:**

1. **Check Current Task** → Review task details and requirements in Archon
2. **Research for Task** → Search relevant documentation and examples
3. **Implement the Task** → Write code based on research
4. **Update Task Status** → Move task from "todo" → "doing" → "review"
5. **Get Next Task** → Check for next priority task
6. **Repeat Cycle**

**Never skip the task cycle.** Every code change must be tied to an Archon task.

### 2. Task Status Workflow

Tasks follow a strict status progression:

- **todo**: Task is defined but not started
- **doing**: Task is actively being worked on
- **review**: Task is complete, awaiting review/validation
- **done**: Task is complete and validated

**Rules:**
- Only ONE task should be in "doing" status at a time
- Tasks must pass through "review" before "done"
- Never move directly from "todo" to "done"
- Update task status immediately when transitioning

### 3. Task Documentation

Every task must include:

- **Clear Title**: Descriptive task name
- **Description**: What needs to be done and why
- **Acceptance Criteria**: How to know the task is complete
- **Dependencies**: Other tasks that must complete first
- **Files Affected**: List of files that will be modified/created
- **Implementation Notes**: Technical decisions and research findings

### 4. Knowledge Management

**Archon as Single Source of Truth:**

- All project knowledge stored in Archon knowledge base
- Technical decisions documented in Archon
- Research findings saved to Archon
- Code examples and patterns stored in Archon

**Notion as Documentation Mirror:**

- Archon tasks synced to Notion "My tasks" database
- Spec-kit documentation linked to Notion pages
- Sprint execution logs updated in Notion
- Architecture decisions documented in Notion

### 5. Integration with Spec-Kit

**Spec-Kit Structure:**

- `specs/001-ronin-job-hunter/spec.md` - Feature specification
- `specs/001-ronin-job-hunter/plan.md` - Implementation plan
- `specs/001-ronin-job-hunter/tasks.md` - Task breakdown

**Archon Task Mapping:**

- Each spec-kit task becomes an Archon task
- Archon tasks reference spec-kit documentation
- Implementation notes link back to spec-kit
- Task completion updates spec-kit status

### 6. Research Before Implementation

**MANDATORY Research Steps:**

1. **Search Archon Knowledge Base**: Check for existing solutions/patterns
2. **Search Notion Documentation**: Review architecture and design decisions
3. **Search Codebase**: Find similar implementations
4. **External Research**: Only if internal knowledge is insufficient
5. **Document Findings**: Save research to Archon knowledge base

**Never implement without research.** Always check existing knowledge first.

### 7. Task Dependencies

**Dependency Rules:**

- Tasks with dependencies must wait for dependencies to reach "done"
- Parallel tasks can be worked on simultaneously
- Blocking tasks must be prioritized
- Dependency graph must be clear in task description

**Dependency Tracking:**

- List dependencies in task description
- Update task when dependencies complete
- Verify dependencies before starting work

### 8. Code Quality Standards

**Before Marking Task as "review":**

- ✅ Code follows project constitution standards
- ✅ TypeScript types are correct
- ✅ Error handling is implemented
- ✅ Logging is added where appropriate
- ✅ Tests are written (if applicable)
- ✅ Documentation is updated

**Review Checklist:**

- Code matches task requirements
- Acceptance criteria are met
- No hardcoded values or secrets
- Error handling is robust
- Code is readable and maintainable

### 9. Task Updates

**When to Update Tasks:**

- **Status Changes**: Immediately update status
- **Progress Updates**: Add notes when making significant progress
- **Blockers**: Document blockers immediately
- **Decisions**: Record technical decisions in task notes
- **Completion**: Mark as "review" when code is complete

**Update Format:**

- Use clear, concise language
- Include relevant code snippets or links
- Reference related tasks or documentation
- Note any deviations from plan

### 10. Notion Synchronization

**Bidirectional Sync:**

- Archon tasks → Notion "My tasks" database
- Notion task updates → Archon (manual sync)
- Sprint stories → Archon tasks
- Spec-kit tasks → Archon tasks

**Sync Rules:**

- Archon is the source of truth for task status
- Notion mirrors Archon for visibility
- Manual sync required (no automation yet)
- Sync at least once per day

### 11. Sprint Planning

**Sprint Structure:**

- Sprint stories from Notion → Archon tasks
- Tasks organized by story
- Dependencies mapped
- Priority assigned (P0, P1, P2)

**Sprint Execution:**

- Work through tasks in priority order
- Update Sprint execution log in Notion
- Document deviations from plan
- Link completed tasks to stories

### 12. Error Handling and Recovery

**When Tasks Fail:**

1. **Document Failure**: Add notes to task
2. **Identify Root Cause**: Research and document
3. **Create Follow-up Tasks**: If needed
4. **Update Dependencies**: If task blocks others
5. **Move to "todo"**: If needs rework

**Blocker Resolution:**

- Document blockers immediately
- Research solutions in Archon/Notion
- Create follow-up tasks if needed
- Update task status when unblocked

### 13. Task Completion Criteria

**Task is "review" when:**

- ✅ All code is written
- ✅ Acceptance criteria are met
- ✅ Tests pass (if applicable)
- ✅ Documentation is updated
- ✅ No obvious bugs

**Task is "done" when:**

- ✅ Code is reviewed (self-review or peer review)
- ✅ All acceptance criteria validated
- ✅ Integration tests pass
- ✅ Documentation is complete
- ✅ Task is linked to completed story

### 14. Continuous Improvement

**Regular Reviews:**

- Weekly task workflow review
- Identify bottlenecks
- Improve task descriptions
- Refine acceptance criteria
- Update constitution as needed

**Feedback Loop:**

- Document what works well
- Identify pain points
- Suggest improvements
- Update processes iteratively

## Workflow Summary

### Daily Workflow

1. **Morning**: Check Archon for current task
2. **Research**: Search knowledge base and documentation
3. **Implement**: Write code following standards
4. **Update**: Mark task as "review" when complete
5. **Sync**: Update Notion with progress
6. **Next**: Get next priority task

### Task Lifecycle

```
todo → doing → review → done
  ↑       ↓       ↓
  └───────┴───────┘
   (if rework needed)
```

### Integration Points

- **Archon**: Task tracking and knowledge base
- **Notion**: Documentation and sprint tracking
- **Spec-Kit**: Specifications and plans
- **Cursor**: Development environment
- **Git**: Code version control

## Enforcement

**This constitution is mandatory.** All development work must follow these principles. Violations should be documented and addressed in regular reviews.

## Updates

This constitution should be reviewed and updated regularly based on:
- Team feedback
- Process improvements
- Tool changes
- Project evolution

**Last Updated**: [Current Date]
**Version**: 1.0

