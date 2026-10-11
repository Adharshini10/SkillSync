import puppeteer from 'puppeteer-core';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\linga\\.gemini\\antigravity-ide\\brain\\7751faed-02fe-4189-9521-c1b235808826';

async function capturePreviews() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

  // 1. Capture Login Page
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_login.png') });
  console.log('Captured login preview');

  // 2. Capture Register Page
  await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_register.png') });
  console.log('Captured register preview');

  // Register & login test user
  const timestamp = Date.now();
  const testStudent = {
    name: `Elena Rostova`,
    email: `elena_${timestamp}@example.com`,
    password: 'Password123!',
  };

  await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent),
  });

  const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testStudent.email, password: testStudent.password }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // Add sample profile info & skills
  await fetch(`${BACKEND_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      bio: 'Full-stack developer passionate about building collaborative educational platforms and AI tools.',
      location: 'Bengaluru, India',
      education: 'B.Tech Computer Science, Senior Year',
    }),
  });

  await fetch(`${BACKEND_URL}/profile/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'React' }),
  });
  await fetch(`${BACKEND_URL}/profile/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'JavaScript' }),
  });
  await fetch(`${BACKEND_URL}/profile/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Spring Boot' }),
  });

  await fetch(`${BACKEND_URL}/profile/learning-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Python' }),
  });
  await fetch(`${BACKEND_URL}/profile/learning-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Machine Learning' }),
  });
  await fetch(`${BACKEND_URL}/profile/learning-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Docker' }),
  });

  // Login via UI
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', testStudent.email);
  await page.type('#password', testStudent.password);
  await page.click('button[type="submit"]');

  // 3. Capture Dashboard
  await page.waitForSelector('.dashboard-container, .dashboard-welcome, .dashboard-content, .stats-grid, main', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_dashboard.png') });
  console.log('Captured dashboard preview');

  // 4. Capture Profile
  await page.click('#sidebar-link-my-profile');
  await page.waitForSelector('.profile-container, .profile-card, #profile-skills-section', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_profile.png') });
  console.log('Captured profile preview');

  // 5. Capture Skill Swapper
  await page.click('#sidebar-link-skill-swapper');
  await page.waitForSelector('#find-my-matches-btn', { timeout: 10000 });
  await page.click('#find-my-matches-btn');
  await page.waitForSelector('.match-student-card', { timeout: 10000 });

  // Dark Mode: Swapper Hero
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('skillsync_theme', 'dark');
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_swapper_dark.png') });
  console.log('Captured swapper dark preview');

  // Dark Mode: Swapper Matches Scrolled
  await page.evaluate(() => {
    window.scrollTo(0, 680);
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_matches_cards.png') });
  console.log('Captured matches cards preview');

  // Profile Modal
  const viewProfileBtn = await page.$('button[id^="view-profile-btn-"]');
  if (viewProfileBtn) {
    await viewProfileBtn.click();
    await page.waitForSelector('#student-profile-modal');
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_profile_modal.png') });
    console.log('Captured profile modal preview');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#student-profile-modal'));
  }

  // Light Mode: Swapper
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('skillsync_theme', 'light');
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'preview_swapper_light.png') });
  console.log('Captured swapper light preview');

  await browser.close();
  console.log('Done generating all showcase previews!');
}

capturePreviews().catch((err) => {
  console.error(err);
  process.exit(1);
});
