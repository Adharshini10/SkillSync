import puppeteer from 'puppeteer-core';

async function runStep12Tests() {
  console.log('🚀 Starting SkillSync Step 12 End-to-End Profile & Skills Tests...\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const timestamp = Date.now();

  const studentA = {
    name: `Alice StepTwelve_${timestamp}`,
    email: `alice_${timestamp}@example.com`,
    password: 'Password123!',
    bio: 'Full-stack enthusiast passionate about distributed systems.',
    location: 'Bengaluru, India',
    education: 'B.Tech Information Technology, 3rd Year'
  };

  const studentB = {
    name: `Bob StepTwelve_${timestamp}`,
    email: `bob_${timestamp}@example.com`,
    password: 'Password123!',
    bio: 'Mobile and UI specialist.',
    location: 'Hyderabad, India',
    education: 'B.E. Computer Science'
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Register Student A & Student B
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Register Student A ---');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.type('#name', studentA.name);
    await page.type('#email', studentA.email);
    await page.type('#password', studentA.password);
    await page.type('#confirmPassword', studentA.password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });
    console.log('Registered Student A:', studentA.email);

    // -------------------------------------------------------------------------
    // TEST 1: Login Student A & Profile Loading
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Profile Loading ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    // Use select all and backspace to ensure field is truly empty
    await page.click('#email');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('#email', studentA.email);

    await page.click('#password');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('#password', studentA.password);

    console.log('Submitting email:', await page.$eval('#email', el => el.value));
    console.log('Submitting password length:', (await page.$eval('#password', el => el.value)).length);
    await page.click('button[type="submit"]');

    try {
      await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 6000 });
    } catch (e) {
      const currentUrl = page.url();
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('Login failed to redirect. Current URL:', currentUrl);
      console.log('Page content:', pageText);
      throw e;
    }
    console.log('Logged in Student A. Navigating to /profile...');

    // Use Dashboard's "My Profile" button to test dashboard navigation
    await page.waitForSelector('#my-profile-btn', { timeout: 5000 });
    await page.click('#my-profile-btn');
    await page.waitForFunction(() => window.location.pathname === '/profile', { timeout: 5000 });

    // Verify profile details loaded from backend
    await page.waitForSelector('#profile-user-name', { timeout: 5000 });
    const loadedName = await page.$eval('#profile-user-name', el => el.textContent.trim());
    const loadedEmail = await page.$eval('#profile-user-email', el => el.textContent.trim());
    console.log(`Loaded Profile -> Name: "${loadedName}", Email: "${loadedEmail}"`);

    if (loadedName !== studentA.name || loadedEmail !== studentA.email) {
      throw new Error(`Profile name/email mismatch! Expected: ${studentA.name} / ${studentA.email}, Got: ${loadedName} / ${loadedEmail}`);
    }
    console.log('✅ TEST 1 PASSED: Profile loaded accurately with authenticated student data.');

    // -------------------------------------------------------------------------
    // TEST 2: Edit Profile & Refresh Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Edit Profile & Persist on Refresh ---');
    await page.click('#edit-profile-btn');
    await page.waitForSelector('#bio', { timeout: 3000 });

    await page.type('#bio', studentA.bio);
    await page.type('#location', studentA.location);
    await page.type('#education', studentA.education);
    await page.click('#save-profile-btn');

    // Wait for success alert
    await page.waitForSelector('#profile-success-alert', { timeout: 5000 });
    const updateSuccessMsg = await page.$eval('#profile-success-alert', el => el.textContent);
    console.log('Update alert message:', updateSuccessMsg);

    // Verify updated values displayed in view mode
    const displayedBio = await page.$eval('#display-bio', el => el.textContent.trim());
    const displayedLoc = await page.$eval('#display-location', el => el.textContent.trim());
    const displayedEdu = await page.$eval('#display-education', el => el.textContent.trim());
    console.log(`Displayed -> Bio: "${displayedBio}", Location: "${displayedLoc}", Education: "${displayedEdu}"`);

    if (!displayedBio.includes(studentA.bio) || !displayedLoc.includes(studentA.location) || !displayedEdu.includes(studentA.education)) {
      throw new Error('Profile fields do not match saved values in view mode!');
    }

    // Refresh browser to verify MySQL backend persistence
    console.log('Refreshing page to check persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#display-bio', { timeout: 5000 });
    const refreshedBio = await page.$eval('#display-bio', el => el.textContent.trim());
    const refreshedLoc = await page.$eval('#display-location', el => el.textContent.trim());
    const refreshedEdu = await page.$eval('#display-education', el => el.textContent.trim());

    if (!refreshedBio.includes(studentA.bio) || !refreshedLoc.includes(studentA.location) || !refreshedEdu.includes(studentA.education)) {
      throw new Error('Profile data was not persisted in database after reload!');
    }
    console.log('✅ TEST 2 PASSED: Profile updated and successfully persisted across page refresh.');

    // -------------------------------------------------------------------------
    // TEST 3: Add Skills & Refresh Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Add Skills & Refresh Persistence ---');
    const skillsToAdd = ['React', 'Java', 'Spring Boot'];
    for (const skill of skillsToAdd) {
      await page.waitForSelector('#skill-name-input', { timeout: 3000 });
      await page.type('#skill-name-input', skill);
      await page.click('#add-skill-btn');
      await page.waitForSelector('#profile-success-alert', { timeout: 5000 });
      console.log(`Added skill: "${skill}"`);
      await page.waitForFunction(
        (expectedSkill) => {
          const chips = Array.from(document.querySelectorAll('.skill-chip-name'));
          return chips.some(c => c.textContent.trim() === expectedSkill);
        },
        { timeout: 5000 },
        skill
      );
    }

    // Test duplicate skill prevention
    console.log('Testing duplicate skill validation ("React")...');
    await page.type('#skill-name-input', 'React');
    await page.click('#add-skill-btn');
    await page.waitForSelector('#profile-error-alert', { timeout: 5000 });
    const dupSkillError = await page.$eval('#profile-error-alert', el => el.textContent);
    console.log('Duplicate skill alert:', dupSkillError);
    if (!dupSkillError.toLowerCase().includes('already have')) {
      throw new Error(`Expected duplicate skill error, got: ${dupSkillError}`);
    }
    console.log('Duplicate skill properly rejected with user-friendly alert.');

    // Refresh page to verify skills persistence in database
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.skills-grid', { timeout: 5000 });
    const savedSkills = await page.$$eval('.skill-chip-name', els => els.map(e => e.textContent.trim()));
    console.log('Skills present after refresh:', savedSkills);
    for (const skill of skillsToAdd) {
      if (!savedSkills.includes(skill)) {
        throw new Error(`Skill ${skill} was not persisted after reload!`);
      }
    }
    console.log('✅ TEST 3 PASSED: Skills added and persisted across browser refresh.');

    // -------------------------------------------------------------------------
    // TEST 4: Delete Skill & Refresh Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Delete Skill & Refresh Persistence ---');
    // Find skill chip for "Java" and click its remove button
    const removedSkill = 'Java';
    const deleteButtonSelector = await page.evaluate((targetSkill) => {
      const chips = Array.from(document.querySelectorAll('.skill-chip'));
      for (const chip of chips) {
        if (chip.querySelector('.skill-chip-name').textContent.trim() === targetSkill) {
          const btn = chip.querySelector('.skill-chip-remove');
          return btn ? `#${btn.id}` : null;
        }
      }
      return null;
    }, removedSkill);

    if (!deleteButtonSelector) {
      throw new Error(`Could not find remove button for skill: ${removedSkill}`);
    }

    console.log(`Clicking remove button: ${deleteButtonSelector} for "${removedSkill}"...`);
    await page.click(deleteButtonSelector);
    await page.waitForSelector('#profile-success-alert', { timeout: 5000 });
    const removeSuccessMsg = await page.$eval('#profile-success-alert', el => el.textContent);
    console.log('Remove alert message:', removeSuccessMsg);

    // Refresh page and confirm "Java" is gone and remaining skills intact
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.skills-grid', { timeout: 5000 });
    const remainingSkills = await page.$$eval('.skill-chip-name', els => els.map(e => e.textContent.trim()));
    console.log('Remaining skills after deletion and reload:', remainingSkills);

    if (remainingSkills.includes(removedSkill)) {
      throw new Error(`Skill "${removedSkill}" was not removed from backend database!`);
    }
    if (!remainingSkills.includes('React') || !remainingSkills.includes('Spring Boot')) {
      throw new Error('Other skills were improperly affected!');
    }
    console.log('✅ TEST 4 PASSED: Skill removed successfully and confirmed via database refresh.');

    // -------------------------------------------------------------------------
    // TEST 5: Different User Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Different User Isolation ---');
    // Logout Student A
    await page.click('.btn-nav-logout');
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 5000 });

    // Register & Login Student B
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.type('#name', studentB.name);
    await page.type('#email', studentB.email);
    await page.type('#password', studentB.password);
    await page.type('#confirmPassword', studentB.password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.click('#email');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('#email', studentB.email);

    await page.click('#password');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('#password', studentB.password);

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });

    // Navigate to /profile as Student B
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#profile-user-name', { timeout: 5000 });

    const studentBName = await page.$eval('#profile-user-name', el => el.textContent.trim());
    const studentBEmail = await page.$eval('#profile-user-email', el => el.textContent.trim());
    const studentBBio = await page.$eval('#display-bio', el => el.textContent.trim());
    const studentBSkills = await page.$$eval('.skill-chip-name', els => els.map(e => e.textContent.trim()));

    console.log(`Student B Profile -> Name: "${studentBName}", Email: "${studentBEmail}", Skills: [${studentBSkills.join(', ')}]`);

    if (studentBName !== studentB.name || studentBEmail !== studentB.email) {
      throw new Error(`Expected Student B profile, got: ${studentBName} / ${studentBEmail}`);
    }
    if (studentBBio.includes(studentA.bio)) {
      throw new Error("Student B incorrectly displays Student A's bio!");
    }
    if (studentBSkills.includes('React') || studentBSkills.includes('Spring Boot')) {
      throw new Error("Student B incorrectly displays Student A's skills!");
    }

    // Add unique skill for Student B
    await page.type('#skill-name-input', 'Python');
    await page.click('#add-skill-btn');
    await page.waitForSelector('#profile-success-alert', { timeout: 5000 });
    console.log('Added "Python" to Student B. Isolation verified!');
    console.log('✅ TEST 5 PASSED: Strict user isolation confirmed. JWT is the sole source of user identity.');

    // -------------------------------------------------------------------------
    // TEST 6: Unauthorized Access to /profile
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Unauthorized Access to /profile ---');
    await page.click('.btn-nav-logout');
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 5000 });

    // Attempt direct access to /profile while logged out
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    console.log('Navigated to /profile while logged out, landed on:', currentUrl);
    if (!currentUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login, but ended at: ${currentUrl}`);
    }
    console.log('✅ TEST 6 PASSED: Protected route blocked unauthenticated access to /profile.');

    // -------------------------------------------------------------------------
    // TEST 7: Expired / Invalid JWT Handling
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Expired / Invalid JWT Handling ---');
    // Set a corrupted/fake JWT in localStorage
    await page.evaluate(() => {
      localStorage.setItem('skillsync_jwt_token', 'fake.corrupted.token');
      localStorage.setItem('token', 'fake.corrupted.token');
    });

    // Navigate to /profile - backend returns 401 Unauthorized
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 5000 });
    console.log('After invalid token on /profile, redirected to:', page.url());
    const tokenAfter401 = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token in storage after 401:', tokenAfter401);

    if (tokenAfter401 !== null && tokenAfter401 !== undefined) {
      throw new Error('Invalid token was not cleared on 401 response!');
    }
    console.log('✅ TEST 7 PASSED: 401 token invalidation caught, cleared localStorage, redirected to /login.');

    console.log('\n=============================================================');
    console.log('🎉 ALL STEP 12 PROFILE & SKILLS TESTS PASSED FLAWLESSLY!');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runStep12Tests();
