"""
Tests for {{WORKSPACE_NAME}} service
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "{{WORKSPACE_NAME}}"
    assert data["version"] == "{{VERSION}}"

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "{{WORKSPACE_NAME}}"

def test_process_data():
    """Test the process data endpoint"""
    test_data = {
        "data": {"test": "value"},
        "options": {"flag": True}
    }
    
    response = client.post("/process", json=test_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["processed"] is True
    assert data["message"] == "Data processed successfully"

def test_process_data_minimal():
    """Test the process data endpoint with minimal data"""
    test_data = {
        "data": {"minimal": True}
    }
    
    response = client.post("/process", json=test_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True