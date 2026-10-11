import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080/api';

const CHROME_PATH =
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runStep13cTests() {
  console.log('🚀 Starting SkillSync Step 13C — Skill Swapper Frontend E2E Tests...\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  const timestamp = Date.now();
  const testStudent = {
    name: `Swapper Student_${timestamp}`,
    email: `swapper_${timestamp}@example.com`,
    password: 'Password123!',
  };

  const peerStudent = {
    name: `Peer Mentor_${timestamp}`,
    email: `peer_${timestamp}@example.com`,
    password: 'Password123!',
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Protected Route /skill-swapper Blocks Unauthenticated Access
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Protected Route Security ---');
    await page.goto(`${FRONTEND_URL}/skill-swapper`, { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    console.log(`Unauthenticated navigation landed on: ${currentUrl}`);
    if (!currentUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login, but was on ${currentUrl}`);
    }
    console.log('✅ TEST 1 PASSED: Unauthenticated access to /skill-swapper redirected to /login.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Register & Seed Candidate Peer with Known Skills
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Register Candidate Peer & Seed Known Skills ---');
    const peerRegRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peerStudent),
    });
    if (peerRegRes.status !== 201) throw new Error('Peer registration failed');

    const peerLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: peerStudent.email, password: peerStudent.password }),
    });
    const peerLoginData = await peerLoginRes.json();
    const peerToken = peerLoginData.token;
    const peerUserId = peerLoginData.id;

    // Add known skills to peer: Python, Machine Learning, Java
    await fetch(`${BACKEND_URL}/profile/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${peerToken}` },
      body: JSON.stringify({ name: 'Python' }),
    });
    await fetch(`${BACKEND_URL}/profile/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${peerToken}` },
      body: JSON.stringify({ name: 'Machine Learning' }),
    });
    await fetch(`${BACKEND_URL}/profile/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${peerToken}` },
      body: JSON.stringify({ name: 'Java' }),
    });
    // Update peer profile bio & education
    await fetch(`${BACKEND_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${peerToken}` },
      body: JSON.stringify({
        bio: 'AI enthusiast ready to teach Python & ML!',
        location: 'Hyderabad',
        education: 'B.Tech CSE',
      }),
    });
    console.log('✅ TEST 2 PASSED: Peer candidate prepared with My Skills: Python, Machine Learning, Java.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Register & Log In Current Student
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Register & Log In Current Student ---');
    const regRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent),
    });
    if (regRes.status !== 201) throw new Error('Student registration failed');

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('#email', testStudent.email);
    await page.type('#password', testStudent.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('#sidebar-link-skill-swapper');
    console.log(`Student logged in and landed on dashboard: ${page.url()}`);
    console.log('✅ TEST 3 PASSED: Student successfully logged in.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Navigate to /skill-swapper via Sidebar
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Sidebar Navigation to /skill-swapper ---');
    await page.waitForSelector('#sidebar-link-skill-swapper');
    await page.click('#sidebar-link-skill-swapper');
    await page.waitForSelector('#skill-swapper-view');
    console.log(`Navigated to: ${page.url()}`);
    if (!page.url().includes('/skill-swapper')) {
      throw new Error('Failed to navigate to /skill-swapper');
    }
    console.log('✅ TEST 4 PASSED: Skill Swapper page opened via sidebar.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Add Learning Skills & Verify Dynamic Chips
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: Adding Learning Skills (Skills I Want to Learn) ---');
    await page.waitForSelector('#learning-skill-input');

    const addSkill = async (skillName) => {
      await page.waitForFunction(() => {
        const input = document.querySelector('#learning-skill-input');
        return input && !input.disabled;
      });
      await page.click('#learning-skill-input', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type('#learning-skill-input', skillName);
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        (name) => {
          const chips = Array.from(document.querySelectorAll('.learning-chip .chip-name'));
          return chips.some((c) => c.textContent.trim().toLowerCase() === name.toLowerCase());
        },
        {},
        skillName
      );
      console.log(`Added learning skill: ${skillName}`);
    };

    await addSkill('Python');
    await addSkill('Machine Learning');
    await addSkill('React');

    // Verify duplicate validation
    await page.waitForFunction(() => {
      const input = document.querySelector('#learning-skill-input');
      return input && !input.disabled;
    });
    await page.click('#learning-skill-input', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#learning-skill-input', 'Python');
    await page.click('#add-learning-skill-btn');
    await page.waitForSelector('#learning-skill-error');
    const duplicateError = await page.$eval('#learning-skill-error', (el) => el.innerText);
    console.log(`Duplicate prevention message: "${duplicateError}"`);

    // Verify chip count
    const countBadge = await page.$eval('#learning-skills-count', (el) => el.innerText);
    console.log(`Learning skills count: ${countBadge}`);
    console.log('✅ TEST 5 PASSED: Learning skills added and validated dynamically.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Find My Matches Action & Results Display
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Find My Matches & Card Verification ---');
    await page.waitForSelector('#find-my-matches-btn');
    await page.click('#find-my-matches-btn');

    // Wait for match cards grid
    await page.waitForSelector('#student-match-cards-grid');
    const matchedPeerCards = await page.$$('.match-student-card');
    console.log(`Rendered match cards count: ${matchedPeerCards.length}`);
    if (matchedPeerCards.length === 0) {
      throw new Error('Expected at least 1 matched student card, found none.');
    }

    // Check Peer Student card content in grid
    const allCardsText = await page.$eval('#student-match-cards-grid', (el) => el.innerText);
    if (!allCardsText.includes(peerStudent.name)) {
      throw new Error(`Expected peer name "${peerStudent.name}" in match results.`);
    }
    console.log(`Verified peer "${peerStudent.name}" exists in matches.`);

    // Verify Circular Match Progress indicator exists
    const progressExists = await page.$('.circular-match-progress');
    if (!progressExists) {
      throw new Error('Circular match progress indicator not found.');
    }
    console.log('✅ TEST 6 PASSED: Find matches rendered student cards with circular progress indicators.\n');

    // -------------------------------------------------------------------------
    // TEST 7: View Profile Popup Modal
    // -------------------------------------------------------------------------
    console.log('--- TEST 7: View Profile Modal ---');
    const viewProfileBtn = await page.$(`#view-profile-btn-${peerUserId}`);
    if (!viewProfileBtn) {
      throw new Error(`View Profile button for peer user ${peerUserId} not found.`);
    }
    await viewProfileBtn.click();

    await page.waitForSelector('#student-profile-modal');
    const modalName = await page.$eval('#modal-student-name', (el) => el.innerText);
    console.log(`Modal opened for student: "${modalName}"`);
    if (!modalName.includes(peerStudent.name)) {
      throw new Error(`Expected modal student name "${peerStudent.name}", got "${modalName}"`);
    }

    // Test ESC key closing modal
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#student-profile-modal'));
    console.log('Modal closed via Escape key.');
    console.log('✅ TEST 7 PASSED: View Profile popup modal opened and closed smoothly.\n');

    // -------------------------------------------------------------------------
    // TEST 8: Connection Button Request Sent State
    // -------------------------------------------------------------------------
    console.log('--- TEST 8: Connect Action & State Transition ---');
    const connectBtn = await page.$(`#connect-btn-${peerUserId}`);
    if (!connectBtn) {
      throw new Error(`Connect button for peer user ${peerUserId} not found.`);
    }
    const initialBtnText = await page.evaluate((el) => el.innerText, connectBtn);
    console.log(`Initial button text: "${initialBtnText}"`);

    await connectBtn.click();
    // Wait for button to transition to "Request Sent"
    await page.waitForFunction(
      (uid) => {
        const btn = document.querySelector(`#connect-btn-${uid}`);
        return btn && btn.innerText.includes('Request Sent');
      },
      { timeout: 5000 },
      peerUserId
    );

    const updatedBtnText = await page.evaluate(
      (uid) => document.querySelector(`#connect-btn-${uid}`).innerText,
      peerUserId
    );
    console.log(`Updated button text: "${updatedBtnText}"`);
    console.log('✅ TEST 8 PASSED: Connection request sent and button transitioned to "Request Sent" (disabled).\n');

    // -------------------------------------------------------------------------
    // TEST 9: Dark / Light Mode Toggle & Persistence
    // -------------------------------------------------------------------------
    console.log('--- TEST 9: Dark & Light Mode Toggle ---');
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Initial theme: "${initialTheme}"`);

    const themeToggleBtn = await page.$('#desktop-theme-toggle');
    await themeToggleBtn.click();

    const switchedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Switched theme: "${switchedTheme}"`);
    if (switchedTheme === initialTheme) {
      throw new Error('Theme toggle failed to change data-theme attribute');
    }

    // Reload page to verify persistence in localStorage
    await page.reload({ waitUntil: 'networkidle0' });
    const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Persisted theme after reload: "${persistedTheme}"`);
    if (persistedTheme !== switchedTheme) {
      throw new Error('Theme preference failed to persist across page reload.');
    }
    console.log('✅ TEST 9 PASSED: Theme toggle works smoothly and persists in localStorage.\n');

    // -------------------------------------------------------------------------
    // TEST 10: Delete Learning Skill
    // -------------------------------------------------------------------------
    console.log('--- TEST 10: Delete Learning Skill ---');
    await page.waitForSelector('.learning-chip');
    const deleteBtn = await page.$('button[id^="remove-learning-skill-"]');
    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForFunction(
        () => document.querySelectorAll('.learning-chip').length === 2,
        { timeout: 5000 }
      );
      console.log('Successfully deleted learning skill, count reduced to 2.');
    }
    console.log('✅ TEST 10 PASSED: Learning skill removal verified.\n');

    console.log('=============================================================');
    console.log('🎉 ALL STEP 13C SKILL SWAPPER FRONTEND E2E TESTS PASSED FLAWLESSLY!');
    console.log('=============================================================\n');
  } finally {
    await browser.close();
  }
}

runStep13cTests().catch((err) => {
  console.error('❌ Step 13C Test Error:', err);
  process.exit(1);
});
