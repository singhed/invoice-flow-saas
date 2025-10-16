# Usage Examples

## Quick Start

### 1. Setup

```bash
# Clone or navigate to the project directory
cd expense-management

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env
```

### 2. Run the Backend

```bash
python main.py
```

The API will be available at: `http://localhost:8000`

Interactive API docs: `http://localhost:8000/docs`

### 3. Run the Frontend

```bash
cd frontend
npm install
npm start
```

The UI will be available at: `http://localhost:3000`

---

## API Examples

### Create an Expense with AI Suggestions

```bash
curl -X POST "http://localhost:8000/api/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Taxi to client meeting",
    "amount": 25.50,
    "date": "2024-01-15T10:00:00Z",
    "request_ai_suggestion": true
  }'
```

**Response:**
```json
{
  "id": 1,
  "description": "Taxi to client meeting",
  "amount": 25.50,
  "date": "2024-01-15T10:00:00Z",
  "category": null,
  "client_notes": null,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "attachments": [],
  "ai_suggestions": [
    {
      "id": 1,
      "expense_id": 1,
      "suggested_category": "Travel",
      "suggested_notes": "Transportation to client meeting for business development.",
      "was_accepted": false,
      "user_modified": false,
      "final_category": null,
      "final_notes": null,
      "created_at": "2024-01-15T10:00:00Z",
      "model_used": "gpt-4"
    }
  ]
}
```

### Get AI Suggestions Before Creating Expense

```bash
curl -X POST "http://localhost:8000/api/expenses/ai-suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Lunch meeting with potential investor",
    "amount": 75.00
  }'
```

**Response:**
```json
{
  "category": "Meals & Entertainment",
  "client_notes": "Business development lunch meeting to discuss potential investment opportunities and partnership terms."
}
```

### Upload an Attachment

```bash
curl -X POST "http://localhost:8000/api/expenses/1/attachments" \
  -F "file=@receipt.pdf"
```

### Approve AI Suggestion

```bash
curl -X POST "http://localhost:8000/api/expenses/1/ai-suggestions/1/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "suggestion_id": 1,
    "accept_category": true,
    "accept_notes": true
  }'
```

### Approve AI Suggestion with Modifications

```bash
curl -X POST "http://localhost:8000/api/expenses/1/ai-suggestions/1/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "suggestion_id": 1,
    "accept_category": false,
    "accept_notes": true,
    "custom_category": "Marketing & Advertising",
    "custom_notes": null
  }'
```

### List All Expenses

```bash
curl -X GET "http://localhost:8000/api/expenses"
```

### Get a Specific Expense

```bash
curl -X GET "http://localhost:8000/api/expenses/1"
```

### Update an Expense

```bash
curl -X PUT "http://localhost:8000/api/expenses/1" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Travel",
    "client_notes": "Updated notes"
  }'
```

### Delete an Expense

```bash
curl -X DELETE "http://localhost:8000/api/expenses/1"
```

---

## UI Workflow Examples

### Creating an Expense with AI Assistance

1. Click "**+ New Expense**" button
2. Fill in:
   - **Description**: "Coffee meeting with John from TechCorp"
   - **Amount**: 12.50
3. Click "**🤖 Get AI Suggestions**" button
4. Review AI suggestions:
   - Category: "Meals & Entertainment"
   - Client Notes: "Client relationship meeting to discuss potential partnership"
5. Modify if needed or accept as-is
6. Check "**Request AI suggestions on submit**" for audit trail
7. Click "**Create Expense**"

### Managing Attachments

1. Locate the expense in the list
2. Click "**📎 Add Attachment**"
3. Select a file (receipt, invoice, etc.)
4. File uploads and appears in attachments list
5. Click download link to view attachment
6. Click **×** to delete attachment

### Reviewing AI Audit Trail

Each expense card shows:
- **🤖 AI SUGGESTIONS** badge if AI was used
- Original suggestions from AI
- Status: ✓ Accepted or ⏳ Pending
- User modification indicator if suggestions were changed
- "**✓ Accept AI Suggestions**" button for pending suggestions

---

## Python SDK Example

```python
import asyncio
from ai_service import get_ai_suggestions, get_available_categories

async def main():
    # Get available categories
    categories = get_available_categories()
    print(f"Available categories: {categories}")
    
    # Get AI suggestions
    result = await get_ai_suggestions(
        description="Software subscription for project management",
        amount=99.00
    )
    
    print(f"Suggested category: {result['category']}")
    print(f"Suggested notes: {result['client_notes']}")

asyncio.run(main())
```

---

## Testing

### Run Basic Tests

```bash
python test_api.py
```

### Test with curl

Create a test expense:
```bash
curl -X POST http://localhost:8000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"description": "Test", "amount": 10.00}'
```

Get all expenses:
```bash
curl http://localhost:8000/api/expenses
```

---

## Common Scenarios

### Scenario 1: Business Travel

```json
{
  "description": "Flight to NYC for client presentation",
  "amount": 450.00,
  "date": "2024-01-20T08:00:00Z",
  "request_ai_suggestion": true
}
```

AI will likely suggest:
- Category: "Travel"
- Notes: Professional note about business purpose

### Scenario 2: Office Purchase

```json
{
  "description": "Standing desk for home office",
  "amount": 350.00,
  "request_ai_suggestion": true
}
```

AI will likely suggest:
- Category: "Equipment"
- Notes: Note about workspace equipment

### Scenario 3: Software Subscription

```json
{
  "description": "Annual Figma subscription",
  "amount": 144.00,
  "request_ai_suggestion": true
}
```

AI will likely suggest:
- Category: "Software & Subscriptions"
- Notes: Professional note about design tools

---

## Audit Trail Example

When you create an expense with AI suggestions:

1. **Initial State**:
   - Expense created with description and amount
   - AI suggestion stored with `was_accepted: false`
   - Expense has no category/notes yet

2. **User Reviews**:
   - User sees AI suggestions in UI
   - Can accept, modify, or ignore

3. **User Accepts**:
   - Click "Accept AI Suggestions"
   - Expense updated with suggested values
   - AI suggestion updated: `was_accepted: true`
   - Audit trail shows: Original suggestion + final values match

4. **User Modifies**:
   - User changes category or notes
   - Expense updated with custom values
   - AI suggestion updated: `was_accepted: true`, `user_modified: true`
   - Audit trail shows: Original AI suggestion + user's modifications

This ensures complete transparency for compliance and auditing purposes.
