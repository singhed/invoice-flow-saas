import os
from openai import OpenAI
from typing import Dict, Optional
import json

_client = None

def get_openai_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        _client = OpenAI(api_key=api_key)
    return _client

EXPENSE_CATEGORIES = [
    "Travel",
    "Meals & Entertainment",
    "Office Supplies",
    "Software & Subscriptions",
    "Professional Services",
    "Marketing & Advertising",
    "Utilities",
    "Equipment",
    "Training & Education",
    "Insurance",
    "Rent & Facilities",
    "Miscellaneous"
]


async def get_ai_suggestions(description: str, amount: float) -> Dict[str, Optional[str]]:
    """
    Get AI-powered category suggestion and client-facing note for an expense.
    
    Args:
        description: The expense description
        amount: The expense amount
        
    Returns:
        Dictionary with 'category' and 'client_notes' keys
    """
    
    client = get_openai_client()
    if not client:
        return {
            "category": None,
            "client_notes": None,
            "error": "OpenAI API key not configured"
        }
    
    try:
        prompt = f"""You are an AI assistant helping with expense management. Given an expense description and amount, 
suggest an appropriate category and generate a professional, client-facing note.

Expense Description: {description}
Amount: ${amount:.2f}

Available Categories: {', '.join(EXPENSE_CATEGORIES)}

Respond with JSON in this exact format:
{{
    "category": "Most appropriate category from the list",
    "client_notes": "A brief, professional note suitable for client reports (1-2 sentences)"
}}

Guidelines for client notes:
- Be concise and professional
- Focus on business value or necessity
- Suitable for client invoices or reports
- Don't include the amount (it's already shown)
"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional expense management assistant. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        result = response.choices[0].message.content.strip()
        
        # Try to parse JSON from the response
        try:
            parsed = json.loads(result)
            return {
                "category": parsed.get("category"),
                "client_notes": parsed.get("client_notes")
            }
        except json.JSONDecodeError:
            # If not valid JSON, try to extract from markdown code blocks
            if "```json" in result:
                json_str = result.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(json_str)
                return {
                    "category": parsed.get("category"),
                    "client_notes": parsed.get("client_notes")
                }
            elif "```" in result:
                json_str = result.split("```")[1].split("```")[0].strip()
                parsed = json.loads(json_str)
                return {
                    "category": parsed.get("category"),
                    "client_notes": parsed.get("client_notes")
                }
            else:
                return {
                    "category": None,
                    "client_notes": None,
                    "error": "Could not parse AI response"
                }
                
    except Exception as e:
        return {
            "category": None,
            "client_notes": None,
            "error": str(e)
        }


def get_available_categories() -> list:
    """Return the list of available expense categories."""
    return EXPENSE_CATEGORIES
