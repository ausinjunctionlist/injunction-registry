# Injunction Registry

A static, read-only dataset published via GitHub Pages that indicates whether a company has an injunction filed against it, with links to public source records. **Not legal advice.**

## How it works
- Each company: `docs/api/companies/{slug}.json`
- Central index: `docs/api/index.json` (auto-generated)
- UI: `docs/` (static, client-side)

## Add or update a company
1. Create or edit a file in `docs/api/companies/` following `schema/company.schema.json`.
2. Run local checks:
   ```bash
   pip install jsonschema
   python scripts/validate_data.py
   python scripts/generate_index.py