/**
 * ComparEdge SaaS Price Check — GitHub Action
 * Pure Node.js (no @actions/core dependency)
 */

const https = require('https');
const fs = require('fs');

// GitHub Actions helpers
const core = {
  getInput: (name) => {
    const key = 'INPUT_' + name.toUpperCase().replace(/-/g, '_');
    return (process.env[key] || '').trim();
  },
  setOutput: (name, value) => {
    const file = process.env.GITHUB_OUTPUT;
    if (file) {
      fs.appendFileSync(file, `${name}=${value}\n`);
    } else {
      console.log(`::set-output name=${name}::${value}`);
    }
  },
  info: (msg) => console.log(msg),
  warning: (msg) => console.log(`::warning::${msg}`),
  error: (msg) => console.log(`::error::${msg}`),
  setFailed: (msg) => {
    console.log(`::error::${msg}`);
    process.exitCode = 1;
  }
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'comparedge-saas-price-check/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    const slugs = core.getInput('products').split(',').map(s => s.trim()).filter(Boolean);
    const category = core.getInput('category');
    const maxPriceRaw = core.getInput('max-price');
    const maxPrice = maxPriceRaw ? parseFloat(maxPriceRaw) : Infinity;
    const format = core.getInput('output-format') || 'table';

    const API = 'https://comparedge-api.up.railway.app/api/v1';

    let products = [];

    if (slugs.length > 0) {
      core.info(`Fetching pricing for: ${slugs.join(', ')}`);
      const all = await fetch(`${API}/products?limit=331`);
      products = (all.products || []).filter(p => slugs.includes(p.slug));
    } else if (category) {
      core.info(`Fetching products in category: ${category}`);
      const data = await fetch(`${API}/products?category=${category}&limit=100`);
      products = data.products || [];
    } else {
      core.info('No products or category specified — fetching top 20 products');
      const data = await fetch(`${API}/products?limit=20`);
      products = data.products || [];
    }

    let alerts = 0;
    const results = products.map(p => {
      const pricing = p.pricing || {};
      const plans = pricing.plans || [];
      const paid = plans.filter(pl => pl.price && pl.price > 0);
      const starting = paid.length ? Math.min(...paid.map(pl => pl.price)) : null;
      const rating = p.rating || p.ratings || {};

      if (starting !== null && starting > maxPrice) {
        alerts++;
        core.warning(`${p.name}: $${starting}/mo exceeds max-price threshold of $${maxPrice}/mo`);
      }

      return {
        name: p.name,
        slug: p.slug,
        category: p.category,
        starting_price: starting,
        has_free_tier: pricing.free || false,
        g2_rating: rating.g2 || null,
        url: `https://comparedge.com/tools/${p.slug}`
      };
    });

    if (format === 'table') {
      core.info('');
      core.info('┌─────────────────────────┬────────────┬──────────┬──────┐');
      core.info('│ Product                 │ Price/mo   │ Free     │ G2   │');
      core.info('├─────────────────────────┼────────────┼──────────┼──────┤');
      for (const r of results) {
        const name  = (r.name || '').padEnd(23).slice(0, 23);
        const price = r.starting_price !== null ? `$${r.starting_price}`.padEnd(10) : 'N/A'.padEnd(10);
        const free  = (r.has_free_tier ? 'Yes' : 'No').padEnd(8);
        const g2    = r.g2_rating ? String(r.g2_rating) : '-';
        core.info(`│ ${name} │ ${price} │ ${free} │ ${g2.padEnd(4)} │`);
      }
      core.info('└─────────────────────────┴────────────┴──────────┴──────┘');
      core.info('');
      core.info(`✅ Checked ${results.length} products. 🚨 ${alerts} price alert(s).`);
      core.info(`📊 Data from https://comparedge.com`);
    } else if (format === 'json') {
      core.info(JSON.stringify(results, null, 2));
    } else if (format === 'csv') {
      core.info('name,slug,category,starting_price,has_free_tier,g2_rating,url');
      for (const r of results) {
        core.info(`"${r.name}","${r.slug}","${r.category}",${r.starting_price ?? ''},${ r.has_free_tier},${r.g2_rating ?? ''},"${r.url}"`);
      }
    }

    core.setOutput('products-json', JSON.stringify(results));
    core.setOutput('total-products', String(results.length));
    core.setOutput('alerts', String(alerts));

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
