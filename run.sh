#!/bin/bash

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OpenAI API key!"
fi

# Create uploads directory
mkdir -p uploads

echo ""
echo "================================"
echo "Starting backend server..."
echo "API: http://localhost:8000"
echo "Docs: http://localhost:8000/docs"
echo "================================"
echo ""

# Run the backend server
python main.py
