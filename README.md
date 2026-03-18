# Injunction Registry

This site publishes a static, read-only dataset indicating whether a company has **obtained an injunction** restraining the publication or dissemination of confidential information, with links to public source records. **Not legal advice.**

## Base URL
`https://ausinjunctionlist.github.io/injunction-registry/`

## Developer API (positive-only model)

- **Detail (exists only if a filing is recorded):**  
  `GET /api/companies/{slug}.json` → **200 OK** + JSON  
  If no record exists for `{slug}`, endpoint returns **404 Not Found** → treat as “No filing recorded in this registry.”

- **Discovery (only positives):**  
  `GET /api/index.json` → array of companies that **have filings** (name, id, slug).

### Examples

**Check by slug**
```bash
# 200 -> filing exists; 404 -> no filing recorded in this registry
curl -i https://ausinjunctionlist.github.io/injunction-registry/api/companies/example-pty-ltd.json
