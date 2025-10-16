from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List


class AttachmentBase(BaseModel):
    filename: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None


class AttachmentResponse(AttachmentBase):
    id: int
    expense_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AISuggestionBase(BaseModel):
    suggested_category: Optional[str] = None
    suggested_notes: Optional[str] = None


class AISuggestionResponse(AISuggestionBase):
    id: int
    expense_id: int
    was_accepted: bool
    user_modified: bool
    final_category: Optional[str] = None
    final_notes: Optional[str] = None
    created_at: datetime
    model_used: str

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class ExpenseBase(BaseModel):
    description: str
    amount: float = Field(..., gt=0)
    date: Optional[datetime] = None
    category: Optional[str] = None
    client_notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    request_ai_suggestion: bool = False


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[datetime] = None
    category: Optional[str] = None
    client_notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    attachments: List[AttachmentResponse] = []
    ai_suggestions: List[AISuggestionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class AISuggestionRequest(BaseModel):
    description: str
    amount: float


class AISuggestionApproval(BaseModel):
    suggestion_id: int
    accept_category: bool = True
    accept_notes: bool = True
    custom_category: Optional[str] = None
    custom_notes: Optional[str] = None
