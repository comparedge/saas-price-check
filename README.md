# ComparEdge SaaS Price Check

> GitHub Action that checks current SaaS pricing data from the [ComparEdge](https://comparedge.com) API.
> 331 products · 28 categories · No API key required.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-ComparEdge%20SaaS%20Price%20Check-blue?logo=github)](https://github.com/marketplace/actions/comparedge-saas-price-check)

---

## Why use this?

Modern engineering teams use 20–50 SaaS tools. Prices change quietly. This action:

- 🔍 Monitors pricing for your exact tech stack
- 🚨 Alerts when a tool exceeds your budget threshold
- 📊 Generates cost reports in your CI logs
- 🆓 Completely free — powered by the open ComparEdge API

---

## Quick start

```yaml
- uses: comparedge/saas-price-check@v1
  with:
    products: 'notion,slack,linear,github'
    max-price: '50'
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `products` | No | `''` | Comma-separated product slugs to check |
| `category` | No | `''` | Category slug (e.g. `crm`, `llm`, `project-management`) |
| `max-price` | No | `''` | Alert if starting price exceeds this USD/mo amount |
| `output-format` | No | `'table'` | Output format: `table`, `json`, or `csv` |

> If neither `products` nor `category` is specified, the top 20 products are returned.

---

## Outputs

| Output | Description |
|--------|-------------|
| `products-json` | JSON array of checked products with current pricing |
| `total-products` | Number of products checked |
| `alerts` | Number of price alerts triggered |

---

## Examples

### Weekly price monitor

```yaml
name: SaaS Price Monitor
on:
  schedule:
    - cron: '0 9 * * 1'   # Every Monday at 9am UTC

jobs:
  check-prices:
    runs-on: ubuntu-latest
    steps:
      - name: Check SaaS prices
        uses: comparedge/saas-price-check@v1
        with:
          products: 'notion,slack,linear,figma,vercel,github,datadog'
          max-price: '30'
```

### Check entire category

```yaml
- uses: comparedge/saas-price-check@v1
  with:
    category: 'llm'
    output-format: 'json'
```

### Use outputs in subsequent steps

```yaml
- uses: comparedge/saas-price-check@v1
  id: prices
  with:
    products: 'notion,slack'

- name: Show results
  run: |
    echo "Products checked: ${{ steps.prices.outputs.total-products }}"
    echo "Alerts: ${{ steps.prices.outputs.alerts }}"
    echo '${{ steps.prices.outputs.products-json }}' | jq '.'
```

---

## Available product slugs

Browse all 331 products at **[comparedge.com](https://comparedge.com)** or query the API directly:

```
GET https://comparedge-api.up.railway.app/api/v1/products?limit=331
```

**Popular slugs:** `notion`, `slack`, `linear`, `figma`, `vercel`, `github`, `gitlab`, `datadog`, `pagerduty`, `jira`, `confluence`, `asana`, `monday`, `hubspot`, `salesforce`, `intercom`, `zendesk`, `stripe`, `twilio`, `sendgrid`

---

## Categories

`crm` · `llm` · `project-management` · `analytics` · `monitoring` · `communication` · `devtools` · `marketing` · `finance` · `hr` · `security` · `storage` · `email` · `payment` · `video` · `support`

---

## Data source

[comparedge.com](https://comparedge.com) — independent SaaS comparison platform. Data is updated regularly from public sources.

---

## License

MIT
