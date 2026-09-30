# Authentication Testing Playbook

1. POST `/api/auth/login` with any account in `/app/memory/test_credentials.md`.
2. Use the returned Bearer token for `GET /api/auth/me` and `GET /api/overview`.
3. Confirm role-specific profile fields and invalid-password rejection.