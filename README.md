# GRC legal metamodel

Local web explorer for `data/FADP_units_v15.yaml` (DSG / FADP and OPDo).
The original YAML is left unchanged and read with `yaml.safe_load`.

## Start in the devcontainer

1. Install/start Docker Desktop and install the **Dev Containers** extension in VS Code.
2. Open this folder in VS Code and run **Dev Containers: Reopen in Container**.
3. The image installs the runtime and development packages declared in `pyproject.toml`. The creation hook installs this project in editable mode.
4. In the container terminal, run:

   ```sh
   python -m uvicorn metamodel.app:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Open **http://localhost:8000** through the forwarded port.

Use **Level hierarchy** for the structural overview or **Units and relations**
for a diagram grouped by layer. Filter by level, layer, or search text; expand
table rows to inspect all attributes, or hover/focus diagram units for a quick
attribute preview. Download the current Mermaid source for reuse. Refresh the
browser after editing the YAML. In the relation view, choose 12, 24, or 36
units per page to balance diagram detail against the number of visible units.
In the relations diagram, boxes are colored by their existing model layer; the
legend shows the layer colors for the current page.

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
`exception_to`, and `implements`. These relation types remain distinct; the UI
does not evaluate their logic. The global applicability gate mentioned in the
YAML comment is not expanded into synthetic edges. Unit diagrams show 12, 24, or 36 matching nodes per page and only edges whose
endpoints are visible. Use Previous/Next to browse; the diagram viewport stays
bounded. The table contains
all matching units. Unresolved reference IDs remain in the API data.
