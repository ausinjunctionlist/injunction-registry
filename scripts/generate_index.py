import json, os, glob, datetime

COMP_DIR = os.path.join("docs", "api", "companies")
INDEX_PATH = os.path.join("docs", "api", "index.json")

def main():
    companies = []
    for path in sorted(glob.glob(os.path.join(COMP_DIR, "*.json"))):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        slug = os.path.splitext(os.path.basename(path))[0]
        companies.append({
            "slug": slug,
            "company_name": data["company_name"],
            "company_id": data["company_id"],
            "has_injunction": data["has_injunction"]
        })
    index = {
        "last_updated": datetime.date.today().isoformat(),
        "companies": companies
    }
    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Wrote {INDEX_PATH} with {len(companies)} companies.")

if __name__ == "__main__":
    main()