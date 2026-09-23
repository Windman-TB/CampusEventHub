# Campus Event Hub

## Project Overview

## Architecture

## Tech Stack

Frontend:
- React
- Vite
- Tailwind CSS

Backend:
- Node.js
- Express

Database:
- PostgreSQL / Supabase

## Prerequisites

- Node.js 22
- npm

## Project Structure

## Local Development

### Run Frontend

cd frontend
npm ci

Copy:
.env.example -> .env

npm run dev

Frontend:
http://localhost:5173

## Frontend Routes

| Route | Page |
|---|---|
| `/` | Event Discovery |
| `/events/:eventId` | Event Details |
| `/tickets/:ticketId` | Ticket & QR |
| `/check-in` | Check-in Scanner |
| `/dashboard` | Organizer Dashboard |

## Frontend Development Rules

- Do not push directly to `main`.
- Create a feature branch for each feature/page.
- Do not hard-code backend URLs.
- Use `src/services/api.js` for API requests.
- Use mock data while backend APIs are unavailable.

### Run Backend

cd backend
npm ci

Copy:
.env.example -> .env

npm run dev

Backend:
http://localhost:5000

Health Check:
GET /api/health

## Environment Variables

## Database Setup

## Available Scripts

## Deployment

## Demo

## Team