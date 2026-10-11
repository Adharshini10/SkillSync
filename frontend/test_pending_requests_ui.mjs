import puppeteer from 'puppeteer-core';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';
const FRONTEND_BASE = 'http://localhost:5173';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testUI() {
  console.log('Starting UI verification for pending request badge & applicant profile...');
  const timestamp = Date.now();

  // 1. Setup Data via API
  // Owner
  const ownerEmail = `ui_owner_${timestamp}@test.edu`;
  const ownerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Aarav Owner ${timestamp}`,
    email: ownerEmail,
    password: 'Password123!',
  });
  const ownerToken = ownerRes.data.token;

  // Applicant
  const applicantEmail = `ui_applicant_${timestamp}@test.edu`;
  const appRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Sneha Applicant ${timestamp}`,
    email: applicantEmail,
    password: 'Password123!',
  });
  const appToken = appRes.data.token;

  // Add applicant profile & skills
  await axios.post(
    `${API_BASE}/profile/skills`,
    { name: 'React' },
    { headers: { Authorization: `Bearer ${appToken}` } }
  );
  await axios.post(
    `${API_BASE}/profile/skills`,
    { name: 'Node.js' },
    { headers: { Authorization: `Bearer ${appToken}` } }
  );
  await axios.put(
    `${API_BASE}/profile`,
    {
      bio: 'Final-year CS student interested in distributed systems and AI.',
      education: 'B.E. Computer Science, Class of 2026',
      location: 'Bengaluru, India',
    },
    { headers: { Authorization: `Bearer ${appToken}` } }
  );

  // Owner creates project
  const projRes = await axios.post(
    `${API_BASE}/projects`,
    {
      title: `NextGen Smart Campus ${timestamp}`,
      description: 'Campus automation system with real-time IoT sensors and microservices.',
      requiredSkills: ['React', 'Java', 'Spring Boot'],
      maxMembers: 5,
      lookingFor: 'Frontend Developer, DevOps Engineer',
    },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  const projectId = projRes.data.id;

  // Applicant requests to join
  await axios.post(
    `${API_BASE}/projects/${projectId}/join`,
    {},
    { headers: { Authorization: `Bearer ${appToken}` } }
  );
  console.log('✅ Test data created: Project + 1 Pending Join Request');

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 3. Login as Owner
  await page.goto(`${FRONTEND_BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('#email', ownerEmail);
  await page.type('#password', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard-container', { timeout: 10000 });
  console.log('✅ Owner logged in via browser');

  // 4. Navigate to Project Finder
  await page.goto(`${FRONTEND_BASE}/projects`, { waitUntil: 'networkidle2' });
  console.log('✅ Landed on Project Finder');

  // 5. Switch to My Projects tab
  await page.waitForSelector('#tab-my-projects');
  await page.click('#tab-my-projects');
  await page.waitForSelector('#incoming-join-requests-section', { timeout: 8000 });
  console.log('✅ Incoming join requests banner visible in My Projects tab');

  // 6. Verify Pending Requests badge on Project Card
  const badgeSelector = `#pending-requests-badge-${projectId}`;
  await page.waitForSelector(badgeSelector, { timeout: 5000 });
  const badgeText = await page.$eval(badgeSelector, (el) => el.innerText.trim());
  console.log('✅ Card alert badge found:', badgeText);

  // Take screenshot of My Projects with pending request banner and card badge
  await page.screenshot({
    path: 'C:/Users/linga/.gemini/antigravity-ide/brain/7751faed-02fe-4189-9521-c1b235808826/preview_pending_request_banner.png',
  });
  console.log('📸 Captured screenshot: preview_pending_request_banner.png');

  // 7. Click "View Profile" button
  const viewProfileBtn = await page.$('.btn-applicant-view-profile');
  if (!viewProfileBtn) throw new Error('View Profile button not found!');
  await viewProfileBtn.click();
  await page.waitForSelector('#applicant-profile-modal', { timeout: 5000 });
  console.log('✅ Applicant profile modal opened successfully');

  // Take screenshot of Applicant Profile Modal
  await page.screenshot({
    path: 'C:/Users/linga/.gemini/antigravity-ide/brain/7751faed-02fe-4189-9521-c1b235808826/preview_applicant_profile_modal.png',
  });
  console.log('📸 Captured screenshot: preview_applicant_profile_modal.png');

  // 8. Click Accept directly from modal
  const acceptModalBtn = await page.$('#applicant-modal-accept-btn');
  await acceptModalBtn.click();
  await new Promise((r) => setTimeout(r, 2000));
  console.log('✅ Accepted applicant from modal');

  await browser.close();
  console.log('\n======================================================');
  console.log('🎉 PUPPETEER UI TESTS PASSED AND SCREENSHOTS CAPTURED!');
  console.log('======================================================');
}

testUI().catch((e) => {
  console.error('❌ Puppeteer test failed:', e);
  process.exit(1);
});
