# AGENTS.md - AI Coding Agent Instructions

## Project Overview

**API-CELL** is an Express.js API with user authentication and Telegram bot integration.

- **Type**: REST API + Telegram Bot
- **Main file**: `server.js`
- **Start command**: `npm start` or `node server.js`

---

## Key Technologies

| Technology | Purpose |
|------------|---------|
| Express.js | Web framework |
| bcryptjs | Password hashing |
| node-telegram-bot-api | Telegram bot |
| JSON file (database.json) | Local database |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | User registration |
| POST | `/login` | User login |
| POST | `/generate-otp` | Generate OTP code |
| POST | `/verify-otp` | Verify OTP code |
| GET | `/user/:telefono` | Get user by phone |

---

## Environment Variables

Create a `.env` file with:

```env
BOT_TOKEN=your_telegram_bot_token
PORT=3000
```

---

## Telegram Bot Commands

- `/start` - Start bot and show menu
- `/otp` - Generate new OTP
- `/verificar` - Verify OTP
- `/cuenta` - View account info
- `/ayuda` - Help menu

---

## Important Patterns

1. **Database**: Uses local `database.json` file (not MongoDB despite mongoose dependency)
2. **User schema**: `{ nombre, pais, estado, telefono, email, password, isBlocked, otp, otpExp, createdAt }`
3. **OTP expiration**: 5 minutes
4. **Registration via Telegram**: Format `nombre|pais|estado|telefono|email|password`

---

## Common Issues

- Bot won't connect without valid `BOT_TOKEN` in `.env`
- Server exits on error - check port availability
- JSON database must be valid format

---

## Related Documentation

- [server.js](server.js) - Main application code
- [package.json](package.json) - Dependencies and scripts