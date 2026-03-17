import json, os, glob, sys
from jsonschema import validate, Draft202012Validator

SCHEMA_PATH = os.path.join("schema", "company.schema.json")
COMP_DIR = os.path.join("docs", "api", "companies")

def main():
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)

    errors_found = 0
    for path in sorted(glob.glob(os.path.join(COMP_DIR, "*.json"))):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        v = Draft202012Validator(schema)
        errors = sorted(v.iter_errors(data), key=lambda e: e.path)
        if errors:
            print(f"❌ {path}")
            for e in errors:
                loc = "/".join([str(p) for p in e.path])
                print(f"  - {loc}: {e.message}")
            errors_found += 1
        else:
            print(f"✅ {path}")
    if errors_found:
        sys.exit(1)

if __name__ == "__main__":
    main()