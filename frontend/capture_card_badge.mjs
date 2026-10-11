import puppeteer from 'puppeteer-core';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';
const FRONTEND_BASE = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  const timestamp = Date.now();
  const ownerEmail = `snap_owner_${timestamp}@test.edu`;
  const ownerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Dev Owner ${timestamp}`,
    email: ownerEmail,
    password: 'Password123!',
  });
  const ownerToken = ownerRes.data.token;

  const appEmail = `snap_app_${timestamp}@test.edu`;
  const appRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Aman Sharma ${timestamp}`,
    email: appEmail,
    password: 'Password123!',
  });
  const appToken = appRes.data.token;

  await axios.post(
    `${API_BASE}/profile/skills`,
    { name: 'React' },
    { headers: { Authorization: `Bearer ${appToken}` } }
  );
  await axios.post(
    `${API_BASE}/profile/skills`,
    { name: 'Python' },
    { headers: { Authorization: `Bearer ${appToken}` } }
  );

  const projRes = await axios.post(
    `${API_BASE}/projects`,
    {
      title: `AI Healthcare Assistant`,
      description: 'Building an intelligent diagnostic platform for rural health clinics.',
      requiredSkills: ['React', 'Python', 'FastAPI'],
      maxMembers: 5,
      lookingFor: 'Frontend Developer, ML Engineer',
    },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  const projectId = projRes.data.id;

  // Send request
  await axios.post(
    `${API_BASE}/projects/${projectId}/join`,
    {},
    { headers: { Authorization: `Bearer ${appToken}` } }
  );

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  await page.goto(`${FRONTEND_BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('#email', ownerEmail);
  await page.type('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard-container', { timeout: 10000 });

  await page.goto(`${FRONTEND_BASE}/projects`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#tab-my-projects');
  await page.click('#tab-my-projects');
  await page.waitForSelector('#incoming-join-requests-section', { timeout: 8000 });
  await page.waitForSelector(`#pending-requests-badge-${projectId}`);

  // Scroll into view of the cards
  await page.evaluate(() => {
    document.querySelector('#my-projects-grid')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({
    path: 'C:/Users/linga/.gemini/antigravity-ide/brain/7751faed-02fe-4189-9521-c1b235808826/preview_pending_badge_card.png',
  });
  console.log('📸 Captured preview_pending_badge_card.png');

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
