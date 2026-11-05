# Performance report

**Not measured.** No Lighthouse run and no API latency benchmark were executed (no authenticated session; shared dev machine at its memory limit). Numbers are deliberately not invented.

What the code does to limit cost (reviewed, not benchmarked):
- Lists are paginated server-side (25 per page, max 100); search is deferred via `useDeferredValue`.
- TanStack Query caches lists; the only polling is the 30 s `/ready` check and the 30 s outbox sync tick (which does nothing when the outbox is empty).
- Production build output: all static pages prerendered; dynamic detail pages use partial prerender.
- Attendance target (< 30 s once the roster is loaded) is supported by the flow design (mark remaining present, one Save); **not timed in a real session.**

To measure before release: Lighthouse mobile on `/login` and `/attendance`; time a 30-student roster save; `/api/v1/students` p95 against Supabase.
