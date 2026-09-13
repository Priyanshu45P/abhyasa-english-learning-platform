# Web Application for Learning English with Speech Recognition

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Node.js
- Express.js
- Prisma
- PostgreSQL
- JWT Authentication

## Prerequisites

Install these first:

- Node.js
- npm
- Git
- PostgreSQL or Docker
- Google Chrome or Microsoft Edge

## Environment Setup

Create this file:

```sh
backend/.env
```

Example:

```env
PORT=4000
DATABASE_URL="your_database_connection_url"
JWT_SECRET="your_secret_key"
NODE_ENV="development"
```

Create this file:

```sh
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## How to Run

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Go to the project folder
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the project
npm run dev
```

Open the app here:

```sh
http://localhost:8080/
```

Backend runs here:

```sh
http://localhost:4000/
```

## Build

```sh
npm run build
```

## Test

```sh
npm test
```

## Useful Commands

```sh
npm run dev              # start backend and frontend
npm run dev:backend      # start backend only
npm run dev:frontend     # start frontend only
npm run build            # build full project
npm test                 # run tests
```

## Main Features

- Teacher and student login
- Protected pages based on user role
- Teacher creates classrooms
- Student joins classroom using code
- Teacher creates grammar, stories, vocabulary, pronunciation, and quizzes
- Student completes learning content
- Quiz scoring and feedback
- Pronunciation practice using microphone
- Student progress tracking
- Teacher and student dashboards
- Search and filtering

## Speech Recognition Notes

Use Google Chrome or Microsoft Edge for pronunciation practice.

Allow microphone permission and speak clearly. If speech recognition does not work, use the fallback transcript box.

## Final Check
```sh
npm i
npm run build
npm run dev
```
