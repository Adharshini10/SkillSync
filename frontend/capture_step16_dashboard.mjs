import puppeteer from 'puppeteer-core';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';
const FRONTEND_BASE = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function captureStep16() {
  console.log('📸 Setting up user and capturing Step 16 Dashboard views...');
  const timestamp = Date.now();
  const email = `visual_student_${timestamp}@test.edu`;
  const name = 'Priya Sharma';

  // 1. Register & Login
  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    name,
    email,
    password: 'Password123!',
  });
  const token = regRes.data.token;
  const user = regRes.data.user || regRes.data;

  // 2. Setup Profile, Skills, Learning Skills
  await axios.put(
    `${API_BASE}/profile`,
    {
      bio: 'Enthusiastic CS student exploring AI & Full-Stack Systems.',
      education: 'B.Tech CSE • 3rd Year',
      location: 'Bangalore, India',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await axios.post(`${API_BASE}/profile/skills`, { name: 'React' }, { headers: { Authorization: `Bearer ${token}` } });
  await axios.post(`${API_BASE}/profile/skills`, { name: 'TypeScript' }, { headers: { Authorization: `Bearer ${token}` } });
  await axios.post(`${API_BASE}/profile/skills`, { name: 'Spring Boot' }, { headers: { Authorization: `Bearer ${token}` } });
  await axios.post(`${API_BASE}/profile/learning-skills`, { name: 'Python' }, { headers: { Authorization: `Bearer ${token}` } });

  // 3. Create a Project
  await axios.post(
    `${API_BASE}/projects`,
    {
      title: 'AI Collaborative Study Assistant',
      description: 'Building a real-time study platform with AI summaries, team flashcards, and group notes.',
      category: 'WEB_DEVELOPMENT',
      maxMembers: 4,
      requiredSkills: ['React', 'Python', 'FastAPI'],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log('✅ User data ready. Launching Edge browser...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  // Navigate to login
  await page.goto(`${FRONTEND_BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('skillsync_jwt_token', tok);
    localStorage.setItem('token', tok);
    localStorage.setItem('skillsync_user_info', JSON.stringify(usr));
    localStorage.setItem('user', JSON.stringify(usr));
  }, token, user);

  // Navigate to Dashboard
  await page.goto(`${FRONTEND_BASE}/dashboard`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Capture Light Mode Desktop
  await page.screenshot({ path: 'dashboard_desktop_light.png', fullPage: false });
  console.log('📸 Saved: dashboard_desktop_light.png');

  // 2. Toggle to Dark Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: 'dashboard_desktop_dark.png', fullPage: false });
  console.log('📸 Saved: dashboard_desktop_dark.png');

  // 3. Capture Mobile View
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'dashboard_mobile_view.png', fullPage: false });
  console.log('📸 Saved: dashboard_mobile_view.png');

  // 4. Capture Notifications Page
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${FRONTEND_BASE}/notifications`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: 'notifications_page_view.png', fullPage: false });
  console.log('📸 Saved: notifications_page_view.png');

  await browser.close();
  console.log('🎉 All visual snapshots completed successfully!');
}

captureStep16().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
