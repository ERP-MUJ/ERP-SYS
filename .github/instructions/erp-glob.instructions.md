---
applyTo: "**"
---

# Project Context & AI Coding Guidelines

This document outlines the architecture and development principles for our Turborepo monorepo project. As an AI assistant, you must adhere to these guidelines when generating code, answering questions, or reviewing changes.

## 1. Project Architecture Overview 🗺️

Our project is a Turborepo monorepo using pnpm workspaces. The architecture is designed for type safety and code sharing between the frontend and backend.

- **Frontend (apps/web)**: A Next.js application
- **Backend (apps/server)**: A NestJS application
- **Database (packages/db)**: Managed with Prisma
- **Shared Logic (packages/types)**: A critical package containing shared Zod schemas and TypeScript types, serving as the single source of truth for our data structures
- **UI Components (packages/ui)**: A shared library of shadcn/ui components
- **Tooling**: We enforce code quality with ESLint, Prettier, and Husky pre-commit/pre-push hooks

## 2. Workspace Breakdown

### `apps/web` (Frontend)

- **Framework**: Next.js
- **Data Fetching**: All asynchronous operations and server state management must use TanStack Query
- **Custom Hooks**: Reusable data-fetching logic is located in `apps/web/hooks`. Always check for an existing hook before creating a new one
- **UI**: All UI elements must be built using components from the `packages/ui` library

### `apps/server` (Backend)

- **Framework**: NestJS
- **API Contracts**: Data Transfer Objects (DTOs) are used to define the shape of API requests and responses. These DTOs should be validated using Zod schemas imported from `packages/types`

### `packages/types` (Shared Types & Schemas)

- This is the single source of truth for data models across the entire application
- When a data structure is needed by both the frontend and backend, define its type and a corresponding Zod schema here
- The backend uses these schemas for validation, and the frontend uses them to ensure type safety with API responses

### `packages/ui` (Shared UI Components)

- This package contains our customized shadcn/ui components
- When implementing frontend features, always prioritize using existing components from this package. Do not create one-off components in `apps/web` if the functionality could be generalized and added here

### `packages/db` (Database)

- Contains the Prisma schema (`schema.prisma`) and the generated Prisma Client
- All database model changes must be made directly in the `schema.prisma` file
- After modifying the schema, the Prisma Client must be regenerated

## 3. Core Development Principles & Rules 📜

You must follow these non-negotiable rules before and during implementation.

### Rule #1: Perform Thorough Impact Analysis

Before implementing any modification, you must perform a thorough impact analysis. Assess how your changes to one part of the application (e.g., a backend API) will affect the other (e.g., the frontend that consumes it). Document and communicate any corresponding changes required in other workspaces.

### Rule #2: Obtain Full Context Before Starting

Do not begin work or make technical decisions without a complete understanding of the task. You must have the full context and requirements. Ensure that any change aligns with the overall objective by considering its implications for both the frontend and backend.

### Rule #3: Get Explicit Approval for Breaking Changes

If a proposed change is not backward-compatible and will break existing functionality, you must not implement it. First, you must present the proposal, its justification, and its impact analysis to the team lead or project manager and receive explicit approval to proceed.

### Rule #4: Adhere Strictly to Task Scope

Only implement the changes that have been specifically requested in the task description. Do not introduce new features, refactor unrelated code, or "gold-plate" the solution.

### Rule #5: No Unsolicited UI Changes

Do not modify any User Interface (UI) or visual components unless it is an explicit requirement of the assigned task. Unsolicited design alterations, style tweaks, or layout changes are strictly prohibited.

### Rule #6: Do Not Execute Commands

Do not run terminal commands like `pnpm run dev`, `prisma generate`, or `pnpm install`. I will handle all command execution. You may, however, provide the necessary commands in your response for me to run.
