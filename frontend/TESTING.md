# Testing the Jobs UI (Manual)

This document describes how to validate the new Jobs table UI at http://localhost:3000/jobs

## Start the frontend

In the project root (frontend):

```bash
cd frontend
# If you haven't installed deps yet
npm install
# Start dev server
npm run dev
```

Frontend will start (typically at http://localhost:3000). Ensure backend API is running at http://localhost:8080 so the jobs endpoint works.

## What to check

1. Open http://localhost:3000/jobs -> the "Recent Jobs" area should now be shown as a table (not cards).
2. By default the newest job should be at the top (sorted by Created date descending).
3. Pagination controls appear at the bottom: change the rows-per-page dropdown and verify correct items are shown and the summary updates (Showing X - Y of Z).
4. Sorting: click the Date header or the Sort buttons to toggle ascending/descending order. Check IDs sorting by clicking "ID" Sort.
5. Progress values display as a small inline progress bar and percentage.
6. Error or Result values display in-line in the Details column.
7. Use the "Refresh" button at top-right of the panel to reload the latest jobs.
8. Responsive: shrink the viewport and confirm table has an overflow/scroll or looks reasonable on smaller screens.

## Notes

- The backend currently returns all jobs; pagination is performed client-side.
- If you want automated tests added, we can install a test runner (Jest / Vitest) and add component tests for sorting/pagination. Let me know if you want that included in this change.
