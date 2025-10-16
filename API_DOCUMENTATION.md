# Expense Management API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### Health Check

#### GET `/`
Returns API information.

**Response:**
```json
{
  "message": "Expense Management API",
  "version": "1.0.0"
}
```

---

### Categories

#### GET `/api/categories`
Get list of available expense categories.

**Response:**
```json
{
  "categories": [
    "Travel",
    "Meals & Entertainment",
    "Office Supplies",
    ...
  ]
}
```

---

### Expenses

#### POST `/api/expenses`
Create a new expense.

**Request Body:**
```json
{
  "description": "Lunch meeting with client",
  "amount": 45.50,
  "date": "2024-01-15T12:00:00Z",
  "category": "Meals & Entertainment",
  "client_notes": "Business development meeting",
  "request_ai_suggestion": true
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "description": "Lunch meeting with client",
  "amount": 45.50,
  "date": "2024-01-15T12:00:00Z",
  "category": "Meals & Entertainment",
  "client_notes": "Business development meeting",
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z",
  "attachments": [],
  "ai_suggestions": []
}
```

#### GET `/api/expenses`
List all expenses.

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "description": "Lunch meeting with client",
    ...
  }
]
```

#### GET `/api/expenses/{expense_id}`
Get a specific expense.

**Response:** `200 OK`
```json
{
  "id": 1,
  "description": "Lunch meeting with client",
  ...
}
```

#### PUT `/api/expenses/{expense_id}`
Update an expense.

**Request Body:**
```json
{
  "description": "Updated description",
  "amount": 50.00,
  "category": "Travel"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "description": "Updated description",
  ...
}
```

#### DELETE `/api/expenses/{expense_id}`
Delete an expense.

**Response:** `204 No Content`

---

### Attachments

#### POST `/api/expenses/{expense_id}/attachments`
Upload an attachment for an expense.

**Request:**
- Content-Type: `multipart/form-data`
- Body: File upload with field name `file`

**Response:** `200 OK`
```json
{
  "id": 1,
  "expense_id": 1,
  "filename": "receipt.pdf",
  "content_type": "application/pdf",
  "file_size": 12345,
  "uploaded_at": "2024-01-15T12:00:00Z"
}
```

#### GET `/api/expenses/{expense_id}/attachments/{attachment_id}`
Download an attachment.

**Response:** `200 OK`
Returns the file with appropriate Content-Type header.

#### DELETE `/api/expenses/{expense_id}/attachments/{attachment_id}`
Delete an attachment.

**Response:** `204 No Content`

---

### AI Suggestions

#### POST `/api/expenses/ai-suggest`
Get AI suggestions for expense categorization and notes.

**Request Body:**
```json
{
  "description": "Coffee with potential client",
  "amount": 12.50
}
```

**Response:** `200 OK`
```json
{
  "category": "Meals & Entertainment",
  "client_notes": "Client relationship building meeting to discuss potential partnership opportunities."
}
```

#### POST `/api/expenses/{expense_id}/ai-suggestions/{suggestion_id}/approve`
Approve or modify an AI suggestion.

**Request Body:**
```json
{
  "suggestion_id": 1,
  "accept_category": true,
  "accept_notes": true,
  "custom_category": null,
  "custom_notes": null
}
```

**Response:** `200 OK`
Returns the updated expense.

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
Invalid request parameters.

```json
{
  "detail": "Validation error message"
}
```

### 404 Not Found
Resource not found.

```json
{
  "detail": "Expense not found"
}
```

### 500 Internal Server Error
Server error.

```json
{
  "detail": "Internal server error"
}
```

---

## Database Schema

### expenses
- `id`: Integer (Primary Key)
- `description`: String (Required)
- `amount`: Float (Required)
- `date`: DateTime
- `category`: String
- `client_notes`: Text
- `created_at`: DateTime
- `updated_at`: DateTime

### attachments
- `id`: Integer (Primary Key)
- `expense_id`: Integer (Foreign Key → expenses.id)
- `filename`: String
- `file_path`: String
- `content_type`: String
- `file_size`: Integer
- `uploaded_at`: DateTime

### ai_suggestions
- `id`: Integer (Primary Key)
- `expense_id`: Integer (Foreign Key → expenses.id)
- `suggested_category`: String
- `suggested_notes`: Text
- `was_accepted`: Boolean
- `user_modified`: Boolean
- `final_category`: String
- `final_notes`: Text
- `created_at`: DateTime
- `model_used`: String

---

## Audit Trail

The system maintains a complete audit trail of all AI suggestions:

1. **Initial Suggestion**: When an expense is created with `request_ai_suggestion: true`, the AI generates suggestions that are stored in the `ai_suggestions` table.

2. **User Decision**: The system tracks whether the user:
   - Accepted the AI suggestions (`was_accepted: true`)
   - Modified the suggestions (`user_modified: true`)
   - Rejected the suggestions (no approval action)

3. **Final Values**: Both the AI's original suggestions and the user's final choices are stored for compliance and auditing purposes.

This ensures full transparency and traceability of all AI-assisted categorizations.
