"""Serve the repository YAML as data; its text is never executed."""

from pathlib import Path

import yaml
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
STATIC = Path(__file__).resolve().parent / "static"
DATA = ROOT / "data" / "FADP_units_v15.yaml"
RELATIONS = (
    "alternative_to", "applies_if_all", "applies_if_any", "cites", "evidences",
    "example_of", "exception_to", "implements", "input_to", "leads_to", "limits",
    "part_of", "sanctioned_by", "serves",
)

app = FastAPI(title="GRC Legal Metamodel")
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/api/model")
def model():
    # Read on request so edits to the YAML are visible on browser refresh.
    with DATA.open(encoding="utf-8") as stream:
        data = yaml.safe_load(stream)
    edges = [
        {"source": unit["id"], "target": target, "relation": relation}
        for unit in data["units"]
        for relation in RELATIONS
        for target in unit.get(relation, [])
    ]
    return {**data, "edges": edges, "relation_types": list(RELATIONS)}
