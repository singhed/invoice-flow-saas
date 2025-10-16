from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager
import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

from database import get_db, init_db, Expense, Attachment, AISuggestion
from schemas import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    AISuggestionRequest, AISuggestionResponse, AISuggestionApproval,
    AttachmentResponse
)
from ai_service import get_ai_suggestions, get_available_categories

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Expense Management API", version="1.0.0", lifespan=lifespan)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


@app.get("/")
async def root():
    return {"message": "Expense Management API", "version": "1.0.0"}


@app.get("/api/categories")
async def get_categories():
    """Get available expense categories."""
    return {"categories": get_available_categories()}


@app.post("/api/expenses/ai-suggest", response_model=dict)
async def suggest_expense_details(request: AISuggestionRequest):
    """Get AI suggestions for expense category and notes."""
    suggestions = await get_ai_suggestions(request.description, request.amount)
    return suggestions


@app.post("/api/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense with optional AI suggestions."""
    
    # Create the expense
    db_expense = Expense(
        description=expense.description,
        amount=expense.amount,
        date=expense.date,
        category=expense.category,
        client_notes=expense.client_notes
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # If AI suggestions are requested, generate and store them
    if expense.request_ai_suggestion:
        ai_result = await get_ai_suggestions(expense.description, expense.amount)
        
        if not ai_result.get("error"):
            ai_suggestion = AISuggestion(
                expense_id=db_expense.id,
                suggested_category=ai_result.get("category"),
                suggested_notes=ai_result.get("client_notes"),
                model_used="gpt-4"
            )
            db.add(ai_suggestion)
            db.commit()
            db.refresh(db_expense)
    
    return db_expense


@app.get("/api/expenses", response_model=List[ExpenseResponse])
async def list_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all expenses."""
    expenses = db.query(Expense).offset(skip).limit(limit).all()
    return expenses


@app.get("/api/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: int, db: Session = Depends(get_db)):
    """Get a specific expense by ID."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: int, expense_update: ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an expense."""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.delete("/api/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense and its attachments."""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Delete associated files
    for attachment in db_expense.attachments:
        file_path = Path(attachment.file_path)
        if file_path.exists():
            file_path.unlink()
    
    db.delete(db_expense)
    db.commit()
    return None


@app.post("/api/expenses/{expense_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    expense_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload an attachment for an expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Create expense-specific directory
    expense_dir = Path(UPLOAD_DIR) / str(expense_id)
    expense_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = expense_dir / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create attachment record
    attachment = Attachment(
        expense_id=expense_id,
        filename=file.filename,
        file_path=str(file_path),
        content_type=file.content_type,
        file_size=file_path.stat().st_size
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment


@app.get("/api/expenses/{expense_id}/attachments/{attachment_id}")
async def download_attachment(
    expense_id: int,
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Download an attachment."""
    attachment = db.query(Attachment).filter(
        Attachment.id == attachment_id,
        Attachment.expense_id == expense_id
    ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = Path(attachment.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=attachment.filename,
        media_type=attachment.content_type
    )


@app.delete("/api/expenses/{expense_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    expense_id: int,
    attachment_id: int,
    db: Session = Depends(get_db)
):
    """Delete an attachment."""
    attachment = db.query(Attachment).filter(
        Attachment.id == attachment_id,
        Attachment.expense_id == expense_id
    ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Delete file from disk
    file_path = Path(attachment.file_path)
    if file_path.exists():
        file_path.unlink()
    
    db.delete(attachment)
    db.commit()
    return None


@app.post("/api/expenses/{expense_id}/ai-suggestions/{suggestion_id}/approve", response_model=ExpenseResponse)
async def approve_ai_suggestion(
    expense_id: int,
    suggestion_id: int,
    approval: AISuggestionApproval,
    db: Session = Depends(get_db)
):
    """Approve or modify an AI suggestion and apply it to the expense."""
    suggestion = db.query(AISuggestion).filter(
        AISuggestion.id == suggestion_id,
        AISuggestion.expense_id == expense_id
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="AI suggestion not found")
    
    expense = suggestion.expense
    
    # Apply category
    if approval.accept_category:
        expense.category = suggestion.suggested_category
        suggestion.final_category = suggestion.suggested_category
    elif approval.custom_category:
        expense.category = approval.custom_category
        suggestion.final_category = approval.custom_category
        suggestion.user_modified = True
    
    # Apply notes
    if approval.accept_notes:
        expense.client_notes = suggestion.suggested_notes
        suggestion.final_notes = suggestion.suggested_notes
    elif approval.custom_notes:
        expense.client_notes = approval.custom_notes
        suggestion.final_notes = approval.custom_notes
        suggestion.user_modified = True
    
    suggestion.was_accepted = True
    
    db.commit()
    db.refresh(expense)
    
    return expense


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
