# Expense Management System with OpenAI Integration

A full-stack expense management application with AI-powered categorization and note generation.

## Features

- **CRUD Operations**: Complete expense management (Create, Read, Update, Delete)
- **Attachment Support**: Upload and manage receipts and supporting documents
- **AI-Powered Categorization**: OpenAI suggests expense categories automatically
- **Smart Notes Generation**: AI generates client-facing notes from expense descriptions
- **Manual Override**: Accept or edit AI suggestions with full control
- **Audit Trail**: Track all AI suggestions and user decisions for compliance

## Tech Stack

- **Backend**: Python FastAPI
- **Frontend**: React with TypeScript
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: OpenAI API (GPT-4)

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_actual_api_key
```

4. Run the backend:
```bash
python main.py
```

5. Install frontend dependencies:
```bash
cd frontend
npm install
```

6. Run the frontend:
```bash
npm start
```

## API Endpoints

- `POST /api/expenses` - Create new expense with optional AI suggestions
- `GET /api/expenses` - List all expenses
- `GET /api/expenses/{id}` - Get specific expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `POST /api/expenses/{id}/attachments` - Upload attachment
- `GET /api/expenses/{id}/attachments/{attachment_id}` - Download attachment
- `DELETE /api/expenses/{id}/attachments/{attachment_id}` - Delete attachment
- `POST /api/expenses/ai-suggest` - Get AI suggestions for categorization

## Database Schema

- **expenses**: Main expense records
- **attachments**: File attachments for expenses
- **ai_suggestions**: Audit trail of AI-generated suggestions
