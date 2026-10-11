import puppeteer from 'puppeteer-core';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\linga\\.gemini\\antigravity-ide\\brain\\7751faed-02fe-4189-9521-c1b235808826';

async function captureStep14Previews() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

  const timestamp = Date.now();
  const testStudent = {
    name: `Sophia Chen`,
    email: `sophia_preview_${timestamp}@example.com`,
    password: 'Password123!',
  };

  await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent),
  });

  // Login via UI
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', testStudent.email);
  await page.type('#password', testStudent.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard-container');

  // Go to /projects
  await page.click('#sidebar-link-project-finder');
  await page.waitForSelector('#project-finder-title');

  // 1. Capture Dark Mode: Project Finder Explore Grid
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('skillsync_theme', 'dark');
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step14_finder_dark.png') });
  console.log('Captured step14_finder_dark.png');

  // 2. Open Create Project Modal & Capture
  await page.click('#create-project-btn');
  await page.waitForSelector('#create-project-modal');
  await page.type('#project-title-input', 'NextGen Campus AI Assistant & Knowledge Graph');
  await page.type(
    '#project-desc-input',
    'Developing a unified conversational intelligence layer for university students, integrating vector search over research archives, class schedule optimization, and multi-agent peer mentoring.'
  );
  await page.type('#project-skill-input', 'React');
  await page.click('#add-project-skill-btn');
  await page.type('#project-skill-input', 'Python');
  await page.click('#add-project-skill-btn');
  await page.type('#project-skill-input', 'FastAPI');
  await page.click('#add-project-skill-btn');
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step14_create_modal.png') });
  console.log('Captured step14_create_modal.png');

  // Submit and create
  await page.click('#create-project-submit-btn');
  await page.waitForFunction(() => !document.querySelector('#create-project-modal'));
  await page.waitForFunction(() => document.body.innerText.includes('NextGen Campus AI Assistant'));

  // 3. Open Details Modal on project to display colored Close and curved Request to Join buttons
  await page.waitForSelector('button[id^="view-project-btn-"]');
  const viewDetailsBtn = await page.$('button[id^="view-project-btn-"]');
  await viewDetailsBtn.click();
  await page.waitForSelector('#project-details-modal');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step14_project_details_modal.png') });
  console.log('Captured step14_project_details_modal.png');
  await page.click('#close-project-details-btn');
  await page.waitForFunction(() => !document.querySelector('#project-details-modal'));

  // 4. Capture Light Mode: Project Finder
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('skillsync_theme', 'light');
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step14_finder_light.png') });
  console.log('Captured step14_finder_light.png');

  // 5. Capture My Projects Tab
  await page.click('#tab-my-projects');
  await page.waitForSelector('#my-projects-grid');
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step14_my_projects.png') });
  console.log('Captured step14_my_projects.png');

  await browser.close();
  console.log('Done capturing all Step 14 showcase previews!');
}

captureStep14Previews().catch((err) => {
  console.error(err);
  process.exit(1);
});
