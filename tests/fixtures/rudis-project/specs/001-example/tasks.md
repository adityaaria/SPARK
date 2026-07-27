# Tasks: Invoice Drafts

## Phase 1: Setup

- [ ] T001 Confirm invoice module paths in src/invoice/ and tests/invoice/

## Phase 3: User Story 1 - Create invoice draft (Priority: P1)

**Goal**: Finance user can create an invoice draft.

**Independent Test**: Submit valid invoice details and see a draft invoice in the list.

- [ ] T010 [P] [US1] Add invoice draft validation test in tests/invoice/create-draft.test.ts
- [ ] T011 [US1] Implement invoice draft service in src/invoice/invoice.service.ts
- [ ] T012 [US1] Wire create draft endpoint in src/invoice/invoice.controller.ts

## Dependencies & Execution Order

- T001 before all user story tasks.
- T010 should fail before T011 and T012 are implemented.
- T011 before T012.
