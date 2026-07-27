# Feature Specification: Invoice Drafts

## User Stories

### User Story 1 - Create invoice draft (Priority: P1)

Finance users can submit invoice details and create a draft invoice.

**Acceptance Criteria**

1. Given valid invoice details, when the user submits the form, then a draft invoice appears in the invoice list.
2. Given missing required fields, when the user submits the form, then validation errors are shown.

## Requirements

- The system must validate required invoice fields before saving.
- The system must preserve the existing response envelope.
