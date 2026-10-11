import puppeteer from 'puppeteer-core';

async function runTests() {
  console.log('🚀 Starting SkillSync Step 11 End-to-End Tests...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testUser = {
    name: `Student StepEleven_${timestamp}`,
    email: `student11_${timestamp}@example.com`,
    password: 'Password123!',
    wrongPassword: 'WrongPassword999!'
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Registration Form Client-side Validation (Password Mismatch)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Register Form Validation (Mismatch) ---');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.type('#name', testUser.name);
    await page.type('#email', testUser.email);
    await page.type('#password', testUser.password);
    await page.type('#confirmPassword', 'DifferentPassword!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('.field-error', { timeout: 3000 });
    const mismatchError = await page.$eval('.field-error', el => el.textContent);
    console.log('Mismatch validation message displayed:', mismatchError);
    if (!mismatchError.toLowerCase().includes('match')) {
      throw new Error(`Expected password mismatch error, got: ${mismatchError}`);
    }
    console.log('✅ TEST 1 PASSED: Client-side password mismatch caught properly.');

    // -------------------------------------------------------------------------
    // TEST 2: Successful Registration
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Successful Registration ---');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.type('#name', testUser.name);
    await page.type('#email', testUser.email);
    await page.type('#password', testUser.password);
    await page.type('#confirmPassword', testUser.password);
    
    // Submit registration
    await page.click('button[type="submit"]');

    // Wait for success alert or redirect to /login
    await page.waitForSelector('.alert-success', { timeout: 8000 });
    const successMsg = await page.$eval('.alert-success', el => el.textContent);
    console.log('Success banner message:', successMsg);

    // Wait for redirect to /login (happens after 1.5s timeout)
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 8000 });
    console.log('Navigated to after registration:', page.url());
    console.log('✅ TEST 2 PASSED: Successfully registered and redirected to /login.');

    // -------------------------------------------------------------------------
    // TEST 3: Duplicate Registration Error Handling
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Duplicate Registration Handling ---');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.type('#name', testUser.name);
    await page.type('#email', testUser.email);
    await page.type('#password', testUser.password);
    await page.type('#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.alert-danger', { timeout: 5000 });
    const duplicateError = await page.$eval('.alert-danger', el => el.textContent);
    console.log('Duplicate registration error displayed:', duplicateError);
    if (!duplicateError.toLowerCase().includes('already exists') && !duplicateError.toLowerCase().includes('conflict')) {
      throw new Error(`Expected duplicate email error, got: ${duplicateError}`);
    }
    console.log('✅ TEST 3 PASSED: Duplicate registration correctly prevented with user-friendly error.');

    // -------------------------------------------------------------------------
    // TEST 4: Login with Wrong Password
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Login with Wrong Password ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('#email', testUser.email);
    await page.type('#password', testUser.wrongPassword);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.alert-danger', { timeout: 5000 });
    const wrongPassError = await page.$eval('.alert-danger', el => el.textContent);
    console.log('Wrong password error displayed:', wrongPassError);
    if (!wrongPassError.toLowerCase().includes('invalid')) {
      throw new Error(`Expected invalid credentials error, got: ${wrongPassError}`);
    }
    console.log('✅ TEST 4 PASSED: Wrong password rejected with user-friendly error.');

    // -------------------------------------------------------------------------
    // TEST 5: Successful Login & Redirect to /dashboard
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Successful Login ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('#email', testUser.email);
    await page.type('#password', testUser.password);

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 8000 });

    const currentUrlAfterLogin = page.url();
    console.log('Navigated to after login:', currentUrlAfterLogin);

    // Check localStorage token
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('token'));
    console.log('JWT stored in localStorage:', tokenInStorage ? `YES (${tokenInStorage.substring(0, 20)}...)` : 'NO');
    if (!tokenInStorage) {
      throw new Error('JWT token was not found in localStorage after login!');
    }

    // Check dashboard text
    const dashboardText = await page.evaluate(() => document.body.innerText);
    if (!dashboardText.includes('Welcome to SkillSync') || !dashboardText.includes(testUser.email)) {
      throw new Error(`Dashboard content missing expected greeting/email. Got: ${dashboardText}`);
    }
    console.log('✅ TEST 5 PASSED: Login succeeded, JWT stored in localStorage, redirected to Dashboard.');

    // -------------------------------------------------------------------------
    // TEST 6: Session Persistence on Page Refresh
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Refresh Persistence ---');
    await page.reload({ waitUntil: 'networkidle0' });
    const urlAfterRefresh = page.url();
    const tokenAfterRefresh = await page.evaluate(() => localStorage.getItem('token'));
    if (!urlAfterRefresh.includes('/dashboard') || !tokenAfterRefresh) {
      throw new Error('User was not preserved in authenticated state after refresh!');
    }
    console.log('✅ TEST 6 PASSED: Session persists across browser refresh via localStorage.');

    // -------------------------------------------------------------------------
    // TEST 7: Logout Functionality
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Logout ---');
    await page.waitForSelector('#logout-btn', { timeout: 5000 });
    await page.click('#logout-btn');

    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 5000 });
    const urlAfterLogout = page.url();
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('token'));
    console.log('URL after logout:', urlAfterLogout);
    console.log('Token in storage after logout:', tokenAfterLogout);
    if (!urlAfterLogout.includes('/login') || tokenAfterLogout !== null) {
      throw new Error('Logout failed to clear token or navigate to /login!');
    }
    console.log('✅ TEST 7 PASSED: Logout clears token and redirects to /login.');

    // -------------------------------------------------------------------------
    // TEST 8: Protected Route Guard (/dashboard when logged out)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Protected Route Guard ---');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    const urlAfterProtectedAttempt = page.url();
    console.log('Attempted /dashboard while unauthenticated, ended at:', urlAfterProtectedAttempt);
    if (!urlAfterProtectedAttempt.includes('/login')) {
      throw new Error(`Expected redirect to /login for unauthenticated dashboard access, got: ${urlAfterProtectedAttempt}`);
    }
    console.log('✅ TEST 8 PASSED: Protected route blocked unauthenticated access and redirected to /login.');

    console.log('\n======================================================');
    console.log('🎉 ALL 8 STEP 11 AUTHENTICATION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
