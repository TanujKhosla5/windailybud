# Test Credentials

## Active test users
- Email: `adhd_test_1777256972@test.com`
- Password: `Test1234`
- Name: `ADHD Tester`
- User ID: `f851c213-024a-4d05-afd0-7a064782cea8`

- Email: `test_activities_1776734729@test.com`
- Password: `Test1234`
- Name: `Tester`

## Auth notes
- Token key in localStorage: `windailybud_token`
- Registration endpoint: `POST /api/auth/register` body `{email, password, name}`
- Backend URL (preview): `https://first-steps-113.preview.emergentagent.com`

## Useful localStorage keys for ADHD-feature testing
- `windailybud_anchor_seen_<userId>_<YYYY-MM-DD>` = `1` → suppresses auto-open of Daily Anchor modal for that user/day
- `windailybud_weekly_reset_<userId>_<weekStartDate>` = `1` → suppresses Sunday auto-open of Weekly Reset modal
- `windailybud_focus_mode` = `1` → Focus view persisted on
- `windailybud_stale_days` = `0` → makes any Do First todo immediately stale (for visual ring testing)
