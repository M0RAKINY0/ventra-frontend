# Ventra Frontend Repository Split Plan

## Purpose

Move the existing client-only Events/Ventra Vite frontend from `ticketflow` into `https://github.com/M0RAKINY0/ventra-frontend.git` so frontend work has an independent repository. The current checkout will remain intact until the new repository is verified and pushed.

## Current Boundary

- The current application is a Vite + React + TypeScript frontend.
- It has no backend, API server, database, or server-owned runtime files.
- Frontend source, local event imagery, tests, build configuration, design documentation, and package metadata move together.
- `node_modules` and generated `dist` output are excluded through `.gitignore` and are not transferred.
- Existing frontend behavior and the current `events-ui-redesign` source history are preserved in the source repository; the destination receives a clean frontend repository history unless its existing remote state requires a merge.

## Migration Chunks

1. Inspect the destination repository and determine its default branch and whether it contains any user-owned files.
2. Create a local destination checkout under the workspace, preserving the source checkout and avoiding destructive overwrites.
3. Copy the complete tracked frontend boundary into the destination, including `src`, `public`, Vite/TypeScript config, package manifests, tests, docs, and product/design documentation.
4. Update repository-facing metadata so the new project is named `ventra-frontend` and its README describes the extracted frontend.
5. Install dependencies from the copied lockfile and run tests, lint, and production build in the destination.
6. Review the destination diff, commit only confirmed frontend files, and push the destination branch to the requested GitHub repository.
7. Verify the pushed commit, working-tree cleanliness, and the source checkout's unchanged application state.

## Acceptance Checks

- The destination repository contains the complete frontend and no generated dependency or build directories.
- `npm test`, `npm run lint`, and `npm run build` pass in the destination.
- The destination branch is pushed to `ventra-frontend` and tracks its remote branch.
- The source checkout remains available for the next backend or integration phase.

## Assumptions

- The destination repository is intended to host this frontend as its root project.
- No backend extraction is required because the current repository boundary contains only frontend code.
- A clean destination commit is acceptable; no history rewriting or deletion of the source repository is performed.
