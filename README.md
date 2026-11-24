# GRC legal metamodel

Local web explorer for `data/FADP_units_v15.yaml` (DSG / FADP and OPDo).
The original YAML is left unchanged and read with `yaml.safe_load`.

## Run the web app

The app reads `data/FADP_units_v15.yaml` when `/api/model` is requested. To run
it in an environment with the project dependencies installed:

```sh
python -m uvicorn metamodel.app:app --host 0.0.0.0 --port 8000 --reload
```

Open **http://localhost:8000**. In VS Code, forward port **8000** if prompted.
To use the provided development container instead, install Docker Desktop and
the **Dev Containers** extension, open this folder, and run
**Dev Containers: Reopen in Container**. The container installs dependencies
from `pyproject.toml`.

## Explore the model

- **Level hierarchy** displays the YAML's 29-level chapter hierarchy as a
  Mermaid diagram. It is shown at 50% width to fit more of the hierarchy in
  view; scroll the diagram area to move through it. Hover over or keyboard-focus
  a level to see its number, parent, matching-unit count, and up to eight
  matching units. Levels with no directly assigned units are identified.
- **Units and relations** groups matching units by `layer`. Choose 12, 24, or
  36 units per page and use **Previous/Next** to browse; edges are drawn only
  when both endpoints are on the current page. Box colors correspond to the
  layer legend, which updates with the page.
- Filter by level or layer, or search unit ID, provision, or summary. Hover
  over or keyboard-focus a diagram unit to preview its attributes. Expand the
  unit's table row to inspect the full record.
- **Download Mermaid** saves the source for the currently selected diagram.
  Refresh the browser after editing the YAML to load the updated data.

Mermaid is loaded from jsDelivr, so browser internet access is required for
diagrams. The API and table are served locally; if Mermaid cannot load, the
unit table and Mermaid source text remain available.

## Packages and isolation

- Python 3.12 runs in a Debian-based development container.
- `fastapi` serves the web UI and JSON model; `uvicorn[standard]` runs the server.
- `PyYAML` reads the source data.
- The `dev` extra adds `pytest` and `httpx` for API checks.
- Mermaid **11.4.1** is a JavaScript library loaded in the browser from jsDelivr;
  it is not a Python package. This initial viewer needs no Node.js installation.
  Browser internet access is required for diagrams; the API and table are local.

Dependencies install inside Docker. The repository is mounted into the
container so source changes persist on the host. Dependency ranges are declared
in TOML; exact transitive versions are not locked yet. After changing dependencies,
run **Dev Containers: Rebuild Container**.

## Checks

Inside the container:

```sh
python -m pytest
```

## Interpretation

This is an explorer of the supplied model, not a legal reasoning engine. Edges
show explicit reference fields, including `applies_if_all`, `applies_if_any`,
`exception_to`, and `implements`. Relation types remain distinct; the UI does
not evaluate their legal logic. The global applicability gate mentioned in the
YAML comment is not expanded into synthetic edges. The table contains all
matching units, including those outside the current diagram page. Unresolved
reference IDs, if present, remain in the API data.

## License

This project is licensed under the [MIT License](./LICENSE).
