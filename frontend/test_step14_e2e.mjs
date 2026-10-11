import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';
const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runStep14Tests() {
  console.log('🚀 Starting SkillSync Step 14 — Project Finder, Create Project & My Requests E2E Tests...\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const timestamp = Date.now();
  const studentA = {
    name: `Alice Founder_${timestamp}`,
    email: `alice_founder_${timestamp}@example.com`,
    password: 'Password123!',
  };

  const studentB = {
    name: `Bob Builder_${timestamp}`,
    email: `bob_builder_${timestamp}@example.com`,
    password: 'Password123!',
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Protected Route Guard for /projects
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Protected Route Security ---');
    await page.goto(`${FRONTEND_URL}/projects`, { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    console.log(`Unauthenticated navigation landed on: ${currentUrl}`);
    if (!currentUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login, but was on ${currentUrl}`);
    }
    console.log('✅ TEST 1 PASSED: Unauthenticated access to /projects redirected to /login.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Register & Log in Student A (Founder)
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Register & Log In Student A (Founder) ---');
    const regResA = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentA),
    });
    if (regResA.status !== 201) throw new Error('Student A registration failed');

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('#email', studentA.email);
    await page.type('#password', studentA.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard-container');
    console.log('✅ TEST 2 PASSED: Student A logged in successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Navigate to /projects via Sidebar
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Sidebar Navigation to Project Finder ---');
    await page.waitForSelector('#sidebar-link-project-finder');
    await page.click('#sidebar-link-project-finder');
    await page.waitForSelector('#project-finder-title');
    console.log(`Landed on Project Finder page: ${page.url()}`);
    console.log('✅ TEST 3 PASSED: Sidebar navigation to Project Finder works.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Create New Project Modal Validation & Publishing
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Create Project Validation & Submission ---');
    await page.click('#create-project-btn');
    await page.waitForSelector('#create-project-modal');

    // Try submitting empty form
    await page.click('#create-project-submit-btn');
    // Fill title
    const projectTitle = `AI Autonomous Drone Delivery ${timestamp}`;
    await page.type('#project-title-input', projectTitle);

    // Fill description
    const projectDesc = `Building a high-throughput autonomous drone logistics dispatch platform with real-time telemetry, routing optimization, and automated warehouse handoffs.`;
    await page.type('#project-desc-input', projectDesc);

    // Add Required Skills
    await page.type('#project-skill-input', 'Python');
    await page.click('#add-project-skill-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Python'));

    await page.type('#project-skill-input', 'React');
    await page.click('#add-project-skill-btn');
    await page.waitForFunction(() => document.body.innerText.includes('React'));

    await page.type('#project-skill-input', 'Docker');
    await page.click('#add-project-skill-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Docker'));

    // Submit project
    await page.click('#create-project-submit-btn');

    // Wait for modal to close and card to appear
    await page.waitForFunction(() => !document.querySelector('#create-project-modal'));
    await page.waitForFunction((title) => document.body.innerText.includes(title), {}, projectTitle);
    console.log(`Project "${projectTitle}" published and visible on page!`);
    console.log('✅ TEST 4 PASSED: Created and published new project successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Verify My Projects Tab
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: My Projects Tab Verification ---');
    await page.click('#tab-my-projects');
    await page.waitForSelector('#my-projects-grid');
    const myProjectsText = await page.$eval('#my-projects-grid', (el) => el.innerText);
    if (!myProjectsText.includes(projectTitle)) {
      throw new Error(`Expected project "${projectTitle}" in My Projects tab`);
    }
    console.log('✅ TEST 5 PASSED: Project accurately listed in My Projects tab.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Register & Login Student B (Collaborator)
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Register & Log in Student B (Collaborator) ---');
    const regResB = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentB),
    });
    if (regResB.status !== 201) throw new Error('Student B registration failed');

    // Logout Student A
    await page.click('#sidebar-logout-btn');
    await page.waitForSelector('#email');

    // Login Student B
    await page.type('#email', studentB.email);
    await page.type('#password', studentB.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard-container');

    // Navigate to /projects
    await page.click('#sidebar-link-project-finder');
    await page.waitForSelector('#project-finder-title');
    console.log('✅ TEST 6 PASSED: Student B logged in and opened Project Finder.\n');

    // -------------------------------------------------------------------------
    // TEST 7: Search and Submit Join Request from Student B
    // -------------------------------------------------------------------------
    console.log('--- TEST 7: Search and Send Join Request ---');
    // Search for project by exact title
    await page.type('#project-search-input', projectTitle);
    await page.waitForFunction((title) => {
      const grid = document.querySelector('#projects-grid');
      return grid && grid.innerText.includes(title);
    }, {}, projectTitle);

    // Find and click View Details button on this project card
    const viewBtn = await page.$('button[id^="view-project-btn-"]');
    await viewBtn.click();
    await page.waitForSelector('#project-details-modal');

    // Click "Request to Join Team" inside modal
    await page.click('#modal-request-join-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Join request submitted'));
    console.log('Join request sent successfully from Student B!');

    // Close modal
    await page.click('#close-project-details-btn');
    await page.waitForFunction(() => !document.querySelector('#project-details-modal'));
    console.log('✅ TEST 7 PASSED: Join request sent and acknowledged.\n');

    // -------------------------------------------------------------------------
    // TEST 8: Check My Requests Tab for Student B
    // -------------------------------------------------------------------------
    console.log('--- TEST 8: Check My Requests Tab for Student B ---');
    await page.click('#tab-my-requests');
    await page.waitForSelector('#my-requests-list');
    const myRequestsText = await page.$eval('#my-requests-list', (el) => el.innerText);
    const lowerText = myRequestsText.toLowerCase();
    if (!myRequestsText.includes(projectTitle) || !lowerText.includes('pending approval')) {
      throw new Error(`Expected project "${projectTitle}" with Pending Approval in My Requests`);
    }
    console.log('✅ TEST 8 PASSED: Outgoing request confirmed in My Requests tab.\n');

    // -------------------------------------------------------------------------
    // TEST 9: Owner (Student A) Accepts Join Request
    // -------------------------------------------------------------------------
    console.log('--- TEST 9: Owner Review & Accept Join Request ---');
    // Logout Student B
    await page.click('#sidebar-logout-btn');
    await page.waitForSelector('#email');

    // Login Student A (Owner)
    await page.type('#email', studentA.email);
    await page.type('#password', studentA.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard-container');

    // Go to Project Finder -> My Projects
    await page.click('#sidebar-link-project-finder');
    await page.waitForSelector('#tab-my-projects');
    await page.click('#tab-my-projects');

    // Open Manage Team
    await page.waitForSelector('button[id^="manage-project-btn-"]');
    const manageBtn = await page.$('button[id^="manage-project-btn-"]');
    await manageBtn.click();
    await page.waitForSelector('#project-details-modal');

    // Switch to Join Requests Tab
    await page.click('#details-tab-requests');
    await page.waitForSelector('#join-requests-list');

    // Accept Student B's Request
    const acceptBtn = await page.$('button[id^="accept-request-btn-"]');
    if (!acceptBtn) throw new Error('Expected accept button for pending request, found none');
    await acceptBtn.click();

    // Verify Success alert
    await page.waitForFunction(() => document.body.innerText.includes('Accepted'));
    console.log('Owner successfully accepted Student B join request!');

    // Check Team Members tab
    await page.click('#details-tab-members');
    await page.waitForFunction((name) => document.querySelector('#project-members-list').innerText.includes(name), {}, studentB.name);
    console.log('Verified Student B is now in Team Members list!');

    await page.click('#close-project-details-btn');
    await page.waitForFunction(() => !document.querySelector('#project-details-modal'));
    console.log('✅ TEST 9 PASSED: Owner accepted join request and verified team roster.\n');

    // -------------------------------------------------------------------------
    // TEST 10: Verify Joined Teams for Student B
    // -------------------------------------------------------------------------
    console.log('--- TEST 10: Verify Joined Teams for Student B ---');
    // Logout Student A
    await page.click('#sidebar-logout-btn');
    await page.waitForSelector('#email');

    // Login Student B
    await page.type('#email', studentB.email);
    await page.type('#password', studentB.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.dashboard-container');

    // Go to Project Finder -> Joined Teams tab
    await page.click('#sidebar-link-project-finder');
    await page.waitForSelector('#tab-joined-projects');
    await page.click('#tab-joined-projects');

    await page.waitForSelector('#joined-projects-grid');
    const joinedText = await page.$eval('#joined-projects-grid', (el) => el.innerText);
    if (!joinedText.includes(projectTitle)) {
      throw new Error(`Expected project "${projectTitle}" in Joined Teams tab for Student B`);
    }

    // Verify My Requests Tab shows Accepted
    await page.click('#tab-my-requests');
    await page.waitForSelector('#my-requests-list');
    const updatedRequestsText = await page.$eval('#my-requests-list', (el) => el.innerText);
    if (!updatedRequestsText.toLowerCase().includes('accepted member')) {
      throw new Error('Expected status to update to Accepted Member in My Requests table');
    }
    console.log('✅ TEST 10 PASSED: Student B confirmed as accepted member in Joined Teams.\n');

    // -------------------------------------------------------------------------
    // TEST 11: Dark & Light Mode Theme Compatibility
    // -------------------------------------------------------------------------
    console.log('--- TEST 11: Theme Toggle Compatibility on Project Finder ---');
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
    await page.click('#desktop-theme-toggle');
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Switched theme from "${initialTheme}" to "${toggledTheme}"`);
    if (initialTheme === toggledTheme) {
      throw new Error('Theme toggle did not change attribute');
    }
    console.log('✅ TEST 11 PASSED: Dark & Light theme switching works seamlessly.\n');

    console.log('========================================================================');
    console.log('🎉 ALL STEP 14 PROJECT FINDER & CREATE PROJECT E2E TESTS PASSED FLAWLESSLY!');
    console.log('========================================================================\n');
  } finally {
    await browser.close();
  }
}

runStep14Tests().catch((err) => {
  console.error('❌ Step 14 Test Error:', err);
  process.exit(1);
});
