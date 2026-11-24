from fastapi.testclient import TestClient

from metamodel.app import app

client = TestClient(app)


def test_viewer_and_assets():
    assert client.get("/").status_code == 200
    assert client.get("/static/app.js").status_code == 200


def test_yaml_relations_and_hierarchy():
    response = client.get("/api/model")
    assert response.status_code == 200
    model = response.json()
    units = {unit["id"]: unit for unit in model["units"]}
    assert len(units) == len(model["units"])
    assert {"source": "FADP-2-1-a", "target": "FADP-3-1", "relation": "applies_if_all"} in model["edges"]
    assert units["FADP-2-2-a"]["layer"] == "EXCEPTION"
    assert any(level.get("parent") == "SCOPE_OF_APPLICATION" for level in model["levels"])
