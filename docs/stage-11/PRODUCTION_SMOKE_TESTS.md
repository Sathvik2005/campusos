# Production smoke tests

**None run: nothing is deployed.** Checklist to execute on the live URLs with synthetic demo accounts only (no destructive actions):

- [ ] Frontend loads over HTTPS; no request to `localhost`; no console errors
- [ ] `GET <api>/health` 200; `GET <api>/ready` shows `database: ok`
- [ ] Faculty login; Admin login; logout; direct visit to a protected page while signed out redirects to login
- [ ] Faculty cannot open Academics/Fees/Insights/Audit; API returns 403 for them
- [ ] Students list and detail (sample student ENG-24-CSE-0412: 81.5%, 33/40, fee due 0)
- [ ] Academics create/duplicate message
- [ ] Attendance online save; then offline save, reload, reconnect, sync; replay creates no duplicate
- [ ] Marks: enter, submit, moderate, lock, unlock with reason
- [ ] Fees: partial demo payment, receipt, overpay blocked
- [ ] Insights with and without AI; mentor task requires approval
- [ ] Audit shows the above actions
- [ ] 390 px and 1440 px layouts; no horizontal overflow
Record each result with date and URL in `DEPLOYMENT_STATUS.md`.
