# Security Specification for UniTrust

## Data Invariants
1. A user profile must match the authenticated user's UID.
2. Only admins can create or modify policies.
3. Incident reports can be created by any authenticated user (or anonymously if rules allow, but here we require auth for tracking).
4. Users can only read their own incident reports unless they are admins.
5. Training progress is private to the user who owns it.
6. The `role` field in `UserProfile` cannot be changed by the user themselves.

## The "Dirty Dozen" Payloads

1. **Identity Theft (Profile)**: Attempting to create a profile for a different UID.
2. **Privilege Escalation (Role)**: A student attempting to update their role to "admin".
3. **Unauthorized Policy Edit**: A student attempting to modify a policy document.
4. **Data Scraping (Reports)**: A user attempting to list all reports in the system.
5. **Orphaned Report**: Creating a report without a valid description.
6. **Malicious ID**: Injecting a 2KB string as a document ID for a report.
7. **Type Poisoning**: Sending a string for the `progress` number field in a training module.
8. **Shadow Field**: Adding a `secretAdmin: true` field to a report document.
9. **Timestamp Fraud**: Sending a manually crafted `createdAt` timestamp instead of `request.time`.
10. **Cross-User Training Update**: User A attempting to update User B's training progress.
11. **PII Leak**: An unauthenticated user attempting to get user profiles.
12. **Status Shortcut**: A user attempting to set a report status to "resolved" directly upon creation.

## The Test Runner (firestore.rules.test.ts)
(Logic for these tests will be implemented to verify DENIED for all above)
