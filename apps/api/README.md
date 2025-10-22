# Expense Management API

A comprehensive REST API for managing business expenses, built with Go and SQLite.

## Features

- **Expense Management**: Create, read, update, and delete expenses
- **File Attachments**: Upload and manage receipt/document attachments
- **AI Suggestions**: Intelligent expense categorization and note generation
- **Categories**: Pre-defined expense categories for consistent reporting
- **Audit Trail**: Complete tracking of AI suggestions and user modifications

## Quick Start

### Prerequisites

- Go 1.21 or later
- SQLite (automatically handled)

### Installation

1. Clone the repository and navigate to the API directory:
```bash
cd apps/api
```

2. Install dependencies:
```bash
go mod tidy
```

3. Build the application:
```bash
go build -o api cmd/api/main.go
```

4. Run the server:
```bash
./api
```

The API will start on `http://localhost:8080`

### Configuration

Configure the API using environment variables:

- `API_HOST`: Server host (default: "0.0.0.0")
- `API_PORT`: Server port (default: "8080")
- `API_ALLOWED_ORIGINS`: CORS allowed origins (default: "http://localhost:3000")

Example:
```bash
export API_PORT=9000
export API_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
./api
```

## API Endpoints

### Health Check
- `GET /` - API status and information

### Categories
- `GET /api/categories` - List available expense categories

### Expenses
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses` - List all expenses (supports pagination with `skip` and `limit`)
- `GET /api/expenses/{id}` - Get a specific expense
- `PUT /api/expenses/{id}` - Update an expense
- `DELETE /api/expenses/{id}` - Delete an expense

### AI Suggestions
- `POST /api/expenses/ai-suggest` - Get AI categorization suggestions
- `POST /api/expenses/{id}/ai-suggestions/{suggestion_id}/approve` - Approve/modify suggestions

### Attachments
- `POST /api/expenses/{id}/attachments` - Upload file attachment
- `GET /api/expenses/{id}/attachments/{attachment_id}` - Download attachment
- `DELETE /api/expenses/{id}/attachments/{attachment_id}` - Delete attachment

## Example Usage

### Create an Expense
```bash
curl -X POST http://localhost:8080/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Lunch meeting with client",
    "amount": 45.50,
    "category": "Meals & Entertainment",
    "client_notes": "Business development meeting",
    "request_ai_suggestion": true
  }'
```

### Get AI Suggestions
```bash
curl -X POST http://localhost:8080/api/expenses/ai-suggest \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Coffee with potential client",
    "amount": 12.50
  }'
```

### Upload Attachment
```bash
curl -X POST http://localhost:8080/api/expenses/1/attachments \
  -F "file=@receipt.pdf"
```

## Data Storage

- **Database**: SQLite database (`expenses.db`) for all expense data
- **Files**: Local filesystem (`uploads/` directory) for attachments
- **Auto-migration**: Database schema is automatically created/updated on startup

## Architecture

The API follows a clean architecture pattern:

- `cmd/api/` - Application entry point
- `internal/models/` - Data models and DTOs
- `internal/database/` - Database connection and migration
- `internal/services/` - Business logic layer
- `internal/handlers/` - HTTP request handlers
- `internal/server/` - Server setup and routing

## Development

### Running in Development
```bash
go run cmd/api/main.go
```

### Testing the API
The API includes comprehensive endpoints that match the specification in `API_DOCUMENTATION.md`. All endpoints are fully functional with proper error handling, validation, and CORS support.

## Production Considerations

- Configure proper CORS origins for your frontend domain
- Consider using PostgreSQL for production instead of SQLite
- Implement proper logging and monitoring
- Set up file storage service (S3, etc.) for attachments in distributed environments
- Add authentication and authorization as needed