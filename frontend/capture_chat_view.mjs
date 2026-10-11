import puppeteer from 'puppeteer-core';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';
const FRONTEND_BASE = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  const timestamp = Date.now();
  const ownerEmail = `chat_owner_${timestamp}@test.edu`;
  const ownerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Chat Founder ${timestamp}`,
    email: ownerEmail,
    password: 'Password123!',
  });
  const ownerToken = ownerRes.data.token;

  const projRes = await axios.post(
    `${API_BASE}/projects`,
    {
      title: `AI Autonomous Delivery Network`,
      description: 'Decentralized drone logistics network built with Spring Boot and React.',
      requiredSkills: ['React', 'Java', 'Spring Boot'],
      maxMembers: 4,
      lookingFor: 'Frontend Lead',
    },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  const projectId = projRes.data.id;

  // Send an initial team welcome message
  await axios.post(
    `${API_BASE}/projects/${projectId}/chat/send`,
    { projectId, content: 'Welcome everyone to the AI Autonomous Delivery Network group chat!' },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  // Login
  await page.goto(`${FRONTEND_BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('#email', ownerEmail);
  await page.type('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard-container', { timeout: 10000 });

  // Open Project Details with auto-open chat
  await page.goto(`${FRONTEND_BASE}/projects/${projectId}?openChat=true`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.group-chat-modal', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: 'C:/Users/linga/.gemini/antigravity-ide/brain/7751faed-02fe-4189-9521-c1b235808826/preview_project_group_chat.png',
  });
  console.log('📸 Captured preview_project_group_chat.png');

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
