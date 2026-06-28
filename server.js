const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Helper to rewrite absolute URLs to our local dev server paths
function rewriteContent(content, host) {
  if (typeof content !== 'string') {
    content = content.toString('utf8');
  }

  const localOrigin = `http://${host}`;

  const REWRITE_DOMAINS = [
    { target: 'framerusercontent.com', replacement: `${localOrigin}/framerusercontent.com` },
    { target: 'app.framerstatic.com', replacement: `${localOrigin}/app.framerstatic.com` },
    { target: 'fonts.gstatic.com', replacement: `${localOrigin}/fonts.gstatic.com` },
    { target: 'framer.com', replacement: `${localOrigin}/framer.com` },
    { target: 'events.framer.com', replacement: `${localOrigin}/events.framer.com` },
    { target: 'antony.framer.media', replacement: localOrigin }
  ];

  let rewritten = content;
  for (const { target, replacement } of REWRITE_DOMAINS) {
    const escapedTarget = target.replace(/\./g, '\\.');

    // 1. Unescaped: https://domain, http://domain, //domain
    rewritten = rewritten.replace(new RegExp(`https://${escapedTarget}`, 'g'), replacement);
    rewritten = rewritten.replace(new RegExp(`http://${escapedTarget}`, 'g'), replacement);
    rewritten = rewritten.replace(new RegExp(`//${escapedTarget}`, 'g'), replacement.replace('http:', ''));

    // 2. Escaped: https:\/\/domain, http:\/\/domain, \/\/domain
    const escapedReplacement = replacement.replace(/\//g, '\\/');
    rewritten = rewritten.replace(new RegExp(`https?:\\\\/\\\\/${escapedTarget}`, 'g'), escapedReplacement);
    rewritten = rewritten.replace(new RegExp(`\\\\/\\\\/${escapedTarget}`, 'g'), escapedReplacement.replace('http:', ''));
  }

  // Inject Brand Overrides Style Tag in HTML
  if (rewritten.includes('</head>')) {
    const overrideCss = `
    <style data-arclane-overrides="true">
      /* Hide Awards Section */
      #awards-section, [id="awards-section"], .framer-s0XrdyT6m {
        display: none !important;
      }
      /* Hide Made in Framer Badge */
      #framer-badge-container, #__framer-badge-container, .__framer-badge {
        display: none !important;
      }

      /* Apply Anton Font to the Heading and Stats Card Numbers */
      .framer-styles-preset-1ebwvl3,
      [data-styles-preset="hsdRkcIWv"],
      .framer-16t60qb h1,
      .framer-sJfpg .framer-fmbn00 h3,
      .framer-sJfpg .framer-xccf0m h3,
      .framer-sJfpg .framer-14hhjjk h3,
      .framer-sJfpg .framer-1arge8z-container h3,
      .framer-sJfpg .framer-nqz92w-container h3,
      .framer-sJfpg .framer-120z4wj-container h3 {
        font-family: "Anton", sans-serif !important;
        --framer-font-family: "Anton", sans-serif !important;
        text-transform: uppercase !important;
        line-height: 1em !important;
        letter-spacing: -0.02em !important;
      }

      /* Fix Alignment & Layout Spacing - Side-by-Side (No wrap on desktop) */
      .framer-sJfpg .framer-vs2fu9 {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 32px !important;
        width: 100% !important;
      }
      .framer-sJfpg .framer-1hjuwqf {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 20px !important;
        flex: none !important;
        width: auto !important;
        max-width: 500px !important;
      }
      .framer-sJfpg .framer-8h0uxh {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        flex: 1 1 auto !important;
        width: auto !important;
      }
      .framer-sJfpg .framer-16t60qb {
        white-space: normal !important;
        width: 100% !important;
      }
      .framer-sJfpg .framer-16t60qb h1 {
        white-space: normal !important;
        word-break: break-word !important;
      }
      .framer-sJfpg .framer-1n3synj {
        flex: 1 0 0px !important;
        max-width: 312px !important;
        width: 312px !important;
        min-width: 200px !important;
      }
      .framer-sJfpg .framer-1w6bg9g p {
        white-space: normal !important;
      }

      /* Ensure Stats Cards have exactly the same size, height, flex, and borders */
      .framer-sJfpg .framer-u0mpqf {
        align-items: stretch !important;
      }
      .framer-sJfpg .framer-1ox530 {
        align-items: stretch !important;
        height: 100% !important;
      }
      .framer-sJfpg .framer-fmbn00,
      .framer-sJfpg .framer-xccf0m,
      .framer-sJfpg .framer-14hhjjk {
        height: 100% !important;
        box-sizing: border-box !important;
        --border-width: 0px !important;
        --border-top-width: 0px !important;
        --border-bottom-width: 0px !important;
        --border-left-width: 0px !important;
        --border-right-width: 0px !important;
        border-radius: 16px !important;
      }
      .framer-sJfpg .framer-fmbn00,
      .framer-sJfpg .framer-14hhjjk {
        border: 1px dashed var(--token-dbca97e3-b39a-45a6-9f6a-8b5f2df1bae7, #d6d6d6) !important;
      }
      .framer-sJfpg .framer-xccf0m {
        border: 1px dashed rgba(255, 255, 255, 0.4) !important;
      }

      /* Stack on Mobile (under 810px) */
      @media (max-width: 809.98px) {
        .framer-sJfpg .framer-vs2fu9 {
          flex-direction: column !important;
          flex-wrap: wrap !important;
          gap: 32px !important;
        }
        .framer-sJfpg .framer-1hjuwqf {
          width: 100% !important;
          max-width: 100% !important;
        }
        .framer-sJfpg .framer-1n3synj {
          width: 100% !important;
          max-width: 100% !important;
        }
        .framer-sJfpg .framer-1ox530 {
          height: auto !important;
          width: 100% !important;
        }
        .framer-sJfpg .framer-fmbn00,
        .framer-sJfpg .framer-xccf0m,
        .framer-sJfpg .framer-14hhjjk {
          height: auto !important;
          min-height: 388px !important;
          width: 100% !important;
        }
      }
    </style>
    `;
    rewritten = rewritten.replace('</head>', `${overrideCss}</head>`);
  }

  return rewritten;
}


const server = http.createServer((req, res) => {
  // Decode URL path
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  
  // Normalize root path to antony.framer.media/index.html
  if (reqPath === '/' || reqPath === '/index.html') {
    reqPath = '/antony.framer.media/index.html';
  }

  // Determine local file path
  let localPath = '';
  let isKnownDomain = false;

  const knownDomains = [
    'framerusercontent.com',
    'app.framerstatic.com',
    'fonts.gstatic.com',
    'framer.com',
    'events.framer.com',
    'antony.framer.media'
  ];

  for (const domain of knownDomains) {
    if (reqPath.startsWith(`/${domain}/`)) {
      localPath = path.join(__dirname, reqPath);
      isKnownDomain = true;
      break;
    }
  }

  // If path is not starting with a known domain, default to antony.framer.media site root
  if (!isKnownDomain) {
    const ext = path.extname(reqPath);
    if (!ext) {
      // SPA fallback route - serve index.html directly from local site root
      localPath = path.join(__dirname, 'antony.framer.media', 'index.html');
    } else {
      localPath = path.join(__dirname, 'antony.framer.media', reqPath);
    }
  }

  const ext = path.extname(localPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isText = contentType.startsWith('text/') || 
                 contentType.includes('javascript') || 
                 contentType.includes('json');

  // Log request
  console.log(`[REQUEST] ${req.method} ${req.url} -> Mapping to: .${path.relative(__dirname, localPath)}`);

  // Check if file exists locally
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    try {
      if (isText) {
        const fileContent = fs.readFileSync(localPath, 'utf8');
        const rewritten = rewriteContent(fileContent, req.headers.host || `localhost:${PORT}`);
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(rewritten);
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(localPath).pipe(res);
      }
    } catch (err) {
      console.error(`[ERROR] Reading file ${localPath}:`, err.message);
      res.writeHead(500);
      res.end(`Internal Server Error: ${err.message}`);
    }
  } else {
    // Self-healing proxy: download missing assets from live servers
    let remoteUrl = '';
    
    // Find matching domain for the request
    let matchedDomain = '';
    for (const domain of knownDomains) {
      if (reqPath.startsWith(`/${domain}/`)) {
        matchedDomain = domain;
        break;
      }
    }

    if (matchedDomain) {
      // Request starts with a known domain directory name
      const relativePart = reqPath.slice(matchedDomain.length + 2); // strip /domain/
      remoteUrl = `https://${matchedDomain}/${relativePart}`;
    } else {
      // Default to main site
      const relativePart = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
      remoteUrl = `/${relativePart}`;
    }

    console.log(`[PROXY FETCH] File not found locally. Fetching: ${remoteUrl}`);

    https.get(remoteUrl, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        console.log(`[PROXY FAIL] Upstream status ${proxyRes.statusCode} for: ${remoteUrl}`);
        res.writeHead(proxyRes.statusCode);
        res.end(`Asset not found locally and upstream failed: ${proxyRes.statusCode}`);
        return;
      }

      // Ensure directory exists
      fs.mkdirSync(path.dirname(localPath), { recursive: true });

      if (isText) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          // Write to local cache
          fs.writeFileSync(localPath, body, 'utf8');
          console.log(`[PROXY CACHED] Saved text file: .${path.relative(__dirname, localPath)}`);

          // Rewrite content and serve
          const rewritten = rewriteContent(body, req.headers.host || `localhost:${PORT}`);
          res.writeHead(200, { 
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
          });
          res.end(rewritten);
        });
      } else {
        // Binary asset (images, fonts, etc)
        const fileStream = fs.createWriteStream(localPath);
        proxyRes.pipe(fileStream);

        fileStream.on('finish', () => {
          console.log(`[PROXY CACHED] Saved binary asset: .${path.relative(__dirname, localPath)}`);
        });

        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      }
    }).on('error', (err) => {
      console.error(`[PROXY ERROR] Fetching ${remoteUrl}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502);
        res.end(`Bad Gateway (Proxy Error): ${err.message}`);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(`🚀 Framer Local Dev Server running at:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log('======================================================');
  console.log('Serving local files with on-the-fly URL rewrites.');
  console.log('Missing assets will be downloaded and cached dynamically.\n');
});
