# Installation Guide

## Prerequisites

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend runtime (for React app)
- **OpenAI API Key** - Required for AI features

## Quick Start (Linux/Mac)

### 1. Clone and Setup Backend

```bash
# Navigate to project directory
cd expense-management

# Run the setup script
chmod +x run.sh
./run.sh
```

This will:
- Create a virtual environment
- Install Python dependencies
- Create `.env` file from template
- Start the backend server

### 2. Configure OpenAI API Key

Edit the `.env` file and add your real API key:

```bash
nano .env
```

Change:
```
OPENAI_API_KEY=sk-test-placeholder-key-replace-with-real-key
```

To:
```
OPENAI_API_KEY=your-actual-openai-api-key
```

### 3. Setup and Run Frontend

In a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will be available at: `http://localhost:3000`

---

## Manual Installation (Windows)

### Backend

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and add your OpenAI API key

# Run server
python main.py
```

### Frontend

```powershell
cd frontend
npm install
npm start
```

---

## Docker Installation

### Using Docker Compose

1. Edit `.env` file with your OpenAI API key

2. Run:
```bash
docker-compose up --build
```

This will start both backend and frontend services.

### Using Docker (Backend Only)

```bash
# Build image
docker build -t expense-api .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your-key \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/expenses.db:/app/expenses.db \
  expense-api
```

---

## Verification

### Test Backend

```bash
# Run test suite
python test_api.py

# Or manually test
curl http://localhost:8000/
curl http://localhost:8000/api/categories
```

### Access API Documentation

Open in browser:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

---

## Project Structure

```
expense-management/
├── main.py                 # FastAPI application
├── database.py            # Database models
├── schemas.py             # Pydantic schemas
├── ai_service.py          # OpenAI integration
├── test_api.py            # Test suite
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create from .env.example)
├── run.sh                 # Startup script
├── uploads/               # File storage (created automatically)
├── expenses.db            # SQLite database (created automatically)
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── types.ts       # TypeScript types
│   │   ├── api.ts         # API client
│   │   └── components/    # React components
│   ├── package.json       # Node dependencies
│   └── public/            # Static files
└── docs/
    ├── README.md          # Main documentation
    ├── API_DOCUMENTATION.md
    └── USAGE_EXAMPLES.md
```

---

## Environment Variables

### Backend (.env)

```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional (defaults provided)
DATABASE_URL=sqlite:///./expenses.db
UPLOAD_DIR=./uploads
```

### Frontend (.env)

```bash
# Optional (defaults to http://localhost:8000)
REACT_APP_API_URL=http://localhost:8000
```

---

## Troubleshooting

### "OpenAI API key not configured"

**Problem:** The `.env` file is missing or doesn't have a valid API key.

**Solution:**
1. Ensure `.env` file exists in the project root
2. Add your OpenAI API key to `.env`
3. Restart the backend server

### "Module not found" errors

**Problem:** Dependencies not installed or wrong Python version.

**Solution:**
```bash
# Ensure you're in virtual environment
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Port already in use

**Problem:** Port 8000 (backend) or 3000 (frontend) is already in use.

**Solution:**
```bash
# Find and kill process using the port
# Linux/Mac:
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Or change the port in the code
# Backend: Edit main.py, change port in uvicorn.run()
# Frontend: Set PORT environment variable
PORT=3001 npm start
```

### Database locked error

**Problem:** SQLite database is locked (multiple processes accessing it).

**Solution:**
1. Stop all backend processes
2. Delete `expenses.db` (data will be lost)
3. Restart backend (database will be recreated)

### Frontend can't connect to backend

**Problem:** CORS or network issues.

**Solution:**
1. Ensure backend is running on `http://localhost:8000`
2. Check CORS settings in `main.py`
3. Verify frontend `.env` has correct `REACT_APP_API_URL`

---

## Development Tips

### Hot Reload

- **Backend**: Use `uvicorn main:app --reload` for auto-reload on code changes
- **Frontend**: `npm start` already includes hot reload

### Database Reset

```bash
# Backup current database
cp expenses.db expenses.db.backup

# Delete database
rm expenses.db

# Restart backend (creates fresh database)
python main.py
```

### Viewing Database

```bash
# Install sqlite3
# Linux:
sudo apt install sqlite3

# Mac:
brew install sqlite3

# View database
sqlite3 expenses.db
.tables
.schema expenses
SELECT * FROM expenses;
.quit
```

---

## Next Steps

1. ✅ Complete installation
2. ✅ Verify backend and frontend are running
3. 📖 Read [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) for how to use the system
4. 📖 Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
5. 🚀 Start creating expenses with AI assistance!
