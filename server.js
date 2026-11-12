/**
 * Codrxs Academy - Production-Grade Secure Backend Server with PostgreSQL Support
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const db = require('./db');

const PORT = process.env.PORT || 3000;

// Admin Credentials
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Codrxs@2026';

// Store active authenticated session tokens in memory
const activeSessions = new Map();

// Helper to generate secure session token
function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  activeSessions.set(token, { user, expiresAt });
  return token;
}

// Helper to verify token from Authorization header
function isAuthenticated(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);
  if (!session) return false;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return session;
}

// MIME types dictionary for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Helper: Parse request body (JSON)
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        resolve(json);
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Server Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const reqPath = parsedUrl.pathname;
  const method = req.method;

  // CORS headers — set ALLOWED_ORIGIN in .env for production (e.g. https://yourdomain.com)
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (reqPath.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // 1. Health check & database connection status
    if (reqPath === '/api/health' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        service: 'Codrxs Academy API Server',
        database: db.getStatus(),
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // 2. Admin Authentication / Login Endpoint
    if (reqPath === '/api/admin/login' && method === 'POST') {
      try {
        const { username, password } = await parseRequestBody(req);
        if (username === ADMIN_USER && password === ADMIN_PASS) {
          const token = createSession(username);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Authentication successful',
            token,
            user: username
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid credentials. Access denied.'
          }));
        }
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: 'Invalid login request' }));
      }
      return;
    }

    // 3. Register Candidate Interest (Saved to Database)
    if (reqPath === '/api/register' && method === 'POST') {
      try {
        const payload = await parseRequestBody(req);

        // Validation
        const { fullName, email, phone, city, education, experience, timeSlot } = payload;
        if (!fullName || !email || !phone || !city || !education || !experience || !timeSlot) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'All mandatory fields (Full Name, Email, Phone, City, Education, Experience, Time Slot) must be provided.'
          }));
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            message: 'Please provide a valid email address.'
          }));
          return;
        }

        // Create new candidate record
        const newCandidate = {
          id: 'CDX-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000),
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          city: city.trim(),
          education,
          experience,
          timeSlot,
          startDate: payload.startDate || 'immediate',
          interests: Array.isArray(payload.interests) ? payload.interests : [],
          comments: (payload.comments || '').trim(),
          status: 'New Lead',
          assignedAdvisor: 'Senior Placement Coordinator',
          createdAt: new Date().toISOString()
        };

        // Persist via Database layer
        const saveResult = await db.saveCandidate(newCandidate);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          message: 'Candidate interest successfully registered with Codrxs Admissions.',
          candidateId: newCandidate.id,
          storage: saveResult.storage,
          candidate: newCandidate
        }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          message: err.message || 'Internal Server Error'
        }));
      }
      return;
    }

    // 4. Admin: Fetch Registered Candidates (PROTECTED ROUTE - Reads from Database)
    if (reqPath === '/api/candidates' && method === 'GET') {
      const session = isAuthenticated(req);
      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized. Please log in as staff.' }));
        return;
      }

      const candidates = await db.getAllCandidates();
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        count: candidates.length,
        candidates
      }));
      return;
    }

    // 5. Admin: Export CSV of candidate leads (PROTECTED ROUTE)
    if (reqPath === '/api/candidates/export' && method === 'GET') {
      const session = isAuthenticated(req);
      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized. Please log in as staff.' }));
        return;
      }

      const candidates = await db.getAllCandidates();
      const headers = ['ID', 'Full Name', 'Email', 'Phone', 'City', 'Education', 'Experience', 'Batch Slot', 'Target Start', 'Interests', 'Submitted At'];
      
      const rows = candidates.map(c => [
        `"${c.id}"`,
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        `"${(c.education || '').replace(/"/g, '""')}"`,
        `"${(c.experience || '').replace(/"/g, '""')}"`,
        `"${(c.timeSlot || '').replace(/"/g, '""')}"`,
        `"${(c.startDate || '').replace(/"/g, '""')}"`,
        `"${(c.interests || []).join('; ')}"`,
        `"${c.createdAt || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="Codrxs_Candidates_' + Date.now() + '.csv"');
      res.writeHead(200);
      res.end(csvContent);
      return;
    }

    // 5b. Admin: Get Admin Account Info (PROTECTED ROUTE — NEVER exposes password)
    if (reqPath === '/api/admins' && method === 'GET') {
      const session = isAuthenticated(req);
      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized. Please log in as staff.' }));
        return;
      }

      // Build admin list from environment — passwords are NEVER sent to client
      const admins = [
        {
          id: 'ADM-001',
          username: ADMIN_USER,
          role: 'Super Admin',
          status: 'Active',
          access: ['Candidates', 'Export CSV', 'Admin Panel'],
          configuredVia: '.env / Environment Variable',
          lastLogin: new Date().toISOString()
        }
      ];

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: admins.length, admins }));
      return;
    }

    // 404 for unhandled API routes
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, message: 'API route not found' }));
    return;
  }

  // Static File Serving
  let safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      fs.readFile(path.join(__dirname, 'index.html'), (err404, data404) => {
        if (err404) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(data404);
        }
      });
      return;
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server File Read Error');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Initialize database connection and listen
db.initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Codrxs Academy Database Server Live on http://localhost:${PORT}`);
    console.log(` PostgreSQL Configured: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
    console.log(` Admin User: ${ADMIN_USER}`);
    console.log(` Admin Login Page: http://localhost:${PORT}/login.html`);
    console.log(` Protected Admin CRM: http://localhost:${PORT}/admin.html`);
    console.log(`====================================================`);
  });
});
