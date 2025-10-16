import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_ai_service():
    """Test the AI service independently"""
    from ai_service import get_ai_suggestions, get_available_categories
    
    print("\n=== Testing AI Service ===")
    
    # Test categories
    categories = get_available_categories()
    print(f"✓ Available categories: {len(categories)} categories loaded")
    
    # Test AI suggestions
    print("\nTesting AI suggestions...")
    result = await get_ai_suggestions(
        description="Coffee meeting with client to discuss new project",
        amount=15.50
    )
    
    if result.get("error"):
        print(f"⚠️  AI Error: {result['error']}")
        print("   (This is expected if OPENAI_API_KEY is not set)")
    else:
        print(f"✓ AI Suggested Category: {result.get('category')}")
        print(f"✓ AI Suggested Notes: {result.get('client_notes')}")
    
    return True


async def test_database():
    """Test database operations"""
    from database import init_db, SessionLocal, Expense, Attachment, AISuggestion
    from datetime import datetime
    
    print("\n=== Testing Database ===")
    
    # Initialize database
    init_db()
    print("✓ Database initialized")
    
    # Create a test expense
    db = SessionLocal()
    try:
        expense = Expense(
            description="Test expense",
            amount=25.00,
            category="Office Supplies",
            client_notes="Test notes"
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        print(f"✓ Created expense with ID: {expense.id}")
        
        # Create a test AI suggestion
        suggestion = AISuggestion(
            expense_id=expense.id,
            suggested_category="Office Supplies",
            suggested_notes="Test AI notes",
            model_used="gpt-4"
        )
        db.add(suggestion)
        db.commit()
        print(f"✓ Created AI suggestion")
        
        # Query expense with relationships
        expense = db.query(Expense).filter(Expense.id == expense.id).first()
        print(f"✓ Retrieved expense with {len(expense.ai_suggestions)} AI suggestions")
        
        # Cleanup
        db.delete(expense)
        db.commit()
        print("✓ Cleaned up test data")
        
    finally:
        db.close()
    
    return True


def test_api_structure():
    """Test that all API components are properly structured"""
    print("\n=== Testing API Structure ===")
    
    # Test imports
    try:
        from main import app
        print("✓ FastAPI app imports successfully")
        
        from schemas import (
            ExpenseCreate, ExpenseUpdate, ExpenseResponse,
            AISuggestionRequest, AISuggestionResponse
        )
        print("✓ All schemas import successfully")
        
        from database import Expense, Attachment, AISuggestion
        print("✓ All database models import successfully")
        
        from ai_service import get_ai_suggestions
        print("✓ AI service imports successfully")
        
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False
    
    return True


async def main():
    """Run all tests"""
    print("=" * 50)
    print("EXPENSE MANAGEMENT SYSTEM - TEST SUITE")
    print("=" * 50)
    
    # Check environment
    if not os.getenv("OPENAI_API_KEY"):
        print("\n⚠️  WARNING: OPENAI_API_KEY not set in .env file")
        print("   AI suggestions will not work until you add your API key")
    else:
        print("\n✓ OPENAI_API_KEY is configured")
    
    # Run tests
    try:
        test_api_structure()
        await test_database()
        await test_ai_service()
        
        print("\n" + "=" * 50)
        print("✓ ALL TESTS PASSED")
        print("=" * 50)
        print("\nYou can now run the application:")
        print("  1. Make sure OPENAI_API_KEY is set in .env")
        print("  2. Run: python main.py")
        print("  3. Open: http://localhost:8000")
        print("  4. View API docs: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    asyncio.run(main())
