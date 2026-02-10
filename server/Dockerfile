# GOHIP Backend - Production Dockerfile
# Build trigger: v5 - route ordering fix for batch insight endpoints
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (cache bust: v3)
COPY . .

# Note: Railway assigns PORT dynamically, no need to EXPOSE a fixed port

# Run the application
# Use PORT environment variable (Railway assigns dynamic ports)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
