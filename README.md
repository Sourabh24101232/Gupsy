# Gupsy

Gupsy is a full-stack, real-time messaging application. It provides passwordless email authentication, one-to-one conversations, image messages, delivery/read state, and live presence through a service-oriented Node.js backend and a Next.js frontend.

## Highlights

- Passwordless sign-in with email one-time passwords (OTPs)
- JWT-protected user and chat APIs
- One-to-one chat creation and conversation history
- Text and image messages, with Cloudinary-backed uploads
- Real-time messages, read receipts, typing indicators, and online presence via Socket.IO
- OTP rate limiting and temporary OTP storage with Redis
- Asynchronous email delivery with RabbitMQ and Nodemailer
- Paginated user, chat, and message endpoints

## Architecture

```text
Next.js frontend (port 3000)
        |
        +--> User service (port 5000) --> MongoDB, Redis, RabbitMQ
        |
        +--> Chat service (port 5002) --> MongoDB, Cloudinary, Socket.IO
                                            |
                                            +--> User service

RabbitMQ --> Mail service --> Gmail SMTP
```

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Axios |
| Real-time | Socket.IO |
| Backend | Node.js, Express 5, TypeScript |
| Data | MongoDB/Mongoose and Redis |
| Messaging | RabbitMQ (`amqplib`) |
| Email | Nodemailer with Gmail SMTP |
| Media | Multer and Cloudinary |
| Authentication | JWT and email OTPs |

## Repository layout

```text
Gupsy/
├── frontend/       # Next.js client application
└── backend/
    ├── user/       # Authentication, profiles, users, OTP publishing
    ├── chat/       # Conversations, messages, uploads, Socket.IO server
    └── mail/       # RabbitMQ OTP-email consumer
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB instance
- Redis instance
- RabbitMQ instance
- Cloudinary account for image uploads
- Gmail account with an app password for OTP delivery

## Local setup

### 1. Install dependencies

Install dependencies separately for every deployable application:

```bash
cd frontend && npm install
cd ../backend/user && npm install
cd ../chat && npm install
cd ../mail && npm install
```

### 2. Configure environment variables

Create a `.env` file in each backend service directory. Never commit these files or production credentials.

`backend/user/.env`

```env
PORT=5000
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<long-random-secret>
REDIS_URL=<redis-connection-url>
Rabbitmq_Host=<rabbitmq-hostname>
Rabbitmq_User=<rabbitmq-username>
Rabbitmq_Password=<rabbitmq-password>
```

`backend/chat/.env`

```env
PORT=5002
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<same-secret-used-by-user-service>
USER_SERVICE=http://localhost:5000
Cloud_Name=<cloudinary-cloud-name>
Api_Key=<cloudinary-api-key>
Api_Secret=<cloudinary-api-secret>
```

`backend/mail/.env`

```env
PORT=5001
Rabbitmq_Host=<rabbitmq-hostname>
Rabbitmq_User=<rabbitmq-username>
Rabbitmq_Password=<rabbitmq-password>
USER=<gmail-address>
PASSWORD=<gmail-app-password>
```

The user and chat services must share the same `JWT_SECRET`. The configured RabbitMQ host is used on the default AMQP port (`5672`).

### 3. Start the applications

Open four terminals from the repository root and run:

```bash
# Terminal 1 — user service
cd backend/user
npm run dev
```

```bash
# Terminal 2 — chat service
cd backend/chat
npm run dev
```

```bash
# Terminal 3 — mail service
cd backend/mail
npm run dev
```

```bash
# Terminal 4 — frontend
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The frontend currently targets the user service at `http://localhost:5000` and the chat service at `http://localhost:5002`.

## Available scripts

Run these commands inside the relevant application directory.

| Command | Description |
| --- | --- |
| `npm run dev` | Compile/watch and run the application in development mode |
| `npm run build` | Compile TypeScript services or create a production Next.js build |
| `npm start` | Run the compiled backend service or production frontend |
| `npm run lint` | Run the frontend ESLint checks |

## API overview

All endpoints use the `/api/v1` base path. Endpoints marked as protected require `Authorization: Bearer <token>`.

### User service — `http://localhost:5000/api/v1`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/login` | Public | Request an email OTP |
| `POST` | `/verify` | Public | Verify an OTP and receive a JWT |
| `GET` | `/me` | Protected | Retrieve the current profile |
| `GET` | `/user/all` | Protected | List users with pagination |
| `GET` | `/user/:id` | Public | Retrieve a user by ID |
| `POST` | `/update/user` | Protected | Update the current user's name |

### Chat service — `http://localhost:5002/api/v1`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/chat/new` | Protected | Create or retrieve a one-to-one chat |
| `GET` | `/chat/all` | Protected | List a user's chats with pagination |
| `POST` | `/message` | Protected | Send a text or image message |
| `GET` | `/message/:chatId` | Protected | Retrieve a chat's messages with pagination |

## Real-time events

The chat service accepts authenticated Socket.IO connections using the JWT in `auth.token`. It supports the following events:

| Event | Direction | Purpose |
| --- | --- | --- |
| `getOnlineUser` | Server → client | Publish currently online user IDs |
| `newMessage` | Server → client | Deliver a newly created message |
| `messagesSeen` | Server → client | Notify a participant that messages were read |
| `joinChat` / `leaveChat` | Client → server | Join or leave a chat room |
| `typing` / `stopTyping` | Client → server | Broadcast typing state to a chat room |
| `userTyping` / `userStoppedTyping` | Server → client | Receive a participant's typing state |

## OTP flow

1. A client submits an email address to the user service.
2. The user service generates a six-digit OTP, stores it in Redis for five minutes, and applies a one-minute per-email request limit.
3. It publishes the OTP email request to RabbitMQ.
4. The mail service consumes the request and sends it using Gmail SMTP.
5. The client submits the OTP for verification; the user service issues a JWT and creates a user record when needed.

## Security notes

- Keep `.env` files private and rotate any credential that is exposed.
- Use a long, unique `JWT_SECRET`; both the user and chat services must use the same value.
- Configure restrictive CORS origins and secure service credentials before deploying to production.
- Use a Gmail app password rather than an account password for SMTP authentication.

## License

No license file is currently included. Add one before distributing or open-sourcing the project.
