import os
import sys
import pytest
import json

# Add the server directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_get_bundles_empty(client):
    response = client.get("/bundles")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "bundles" in data
    assert isinstance(data["bundles"], list)

def test_favorite_bundle(client):
    # Test favoriting a bundle
    bundle_id = "test-bundle-1"
    response = client.post("/bundles/favorite", 
                         json={"bundle_id": bundle_id, "is_favorite": True})
    assert response.status_code == 200
    
    # Verify the bundle is favorited
    response = client.get(f"/bundles/favorite/{bundle_id}")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["is_favorite"] is True

    # Test unfavoriting the bundle
    response = client.post("/bundles/favorite", 
                         json={"bundle_id": bundle_id, "is_favorite": False})
    assert response.status_code == 200

    # Verify the bundle is not favorited
    response = client.get(f"/bundles/favorite/{bundle_id}")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["is_favorite"] is False 