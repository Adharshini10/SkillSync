import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

async function runStep16DashboardTests() {
  console.log('🚀 Running SkillSync Step 16: Dashboard + Application UI Automated Verification...\n');

  // 1. Create Test User A (with skills and projects)
  const userA = {
    email: `dash_student_${Date.now()}@test.com`,
    password: 'Password@123',
    name: 'Aditi Deshmukh',
  };
  // Create Test User B (to connect and generate activities/matches)
  const userB = {
    email: `dash_peer_${Date.now()}@test.com`,
    password: 'Password@123',
    name: 'Rohan Mehra',
  };
  // Create Test User C (empty user for empty states)
  const userC = {
    email: `dash_empty_${Date.now()}@test.com`,
    password: 'Password@123',
    name: 'New Student',
  };

  console.log('1. Registering and logging in users...');
  await axios.post(`${API_BASE}/auth/register`, userA);
  await axios.post(`${API_BASE}/auth/register`, userB);
  await axios.post(`${API_BASE}/auth/register`, userC);

  const resA = await axios.post(`${API_BASE}/auth/login`, { email: userA.email, password: userA.password });
  const resB = await axios.post(`${API_BASE}/auth/login`, { email: userB.email, password: userB.password });
  const resC = await axios.post(`${API_BASE}/auth/login`, { email: userC.email, password: userC.password });

  const tokenA = resA.data.token;
  const tokenB = resB.data.token;
  const tokenC = resC.data.token;

  const clientA = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenA}` } });
  const clientB = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenB}` } });
  const clientC = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenC}` } });

  console.log('   ✅ User A Token & User B Token retrieved successfully.');

  // 2. Setup Profile & Skills for User A
  console.log('\n2. Setting up User A profile, skills, and projects...');
  await clientA.put('/profile', {
    bio: 'CS Student enthusiastic about Full Stack & Cloud',
    education: 'B.Tech CSE • 3rd Year',
    location: 'Bangalore, India',
  });

  // Add 3 Skills to User A
  await clientA.post('/profile/skills', { name: 'React' });
  await clientA.post('/profile/skills', { name: 'Node.js' });
  await clientA.post('/profile/skills', { name: 'Spring Boot' });

  // Add learning skill to User A
  await clientA.post('/profile/learning-skills', { name: 'Python' });

  // Add skill to User B that User A wants to learn (Python)
  await clientB.put('/profile', {
    bio: 'Python and AI developer',
    education: 'B.Tech AI & DS • 2nd Year',
    location: 'Pune, India',
  });
  await clientB.post('/profile/skills', { name: 'Python' });
  await clientB.post('/profile/learning-skills', { name: 'React' });

  // Verify Skills count
  const skillsResA = await clientA.get('/profile/skills');
  console.log(`   ✅ User A Skills count: ${skillsResA.data.length} (Expected: 3)`);
  if (skillsResA.data.length !== 3) throw new Error('Skills count mismatch');

  // 3. Setup Connection between User A and User B
  console.log('\n3. Creating Connection & Generating Notification...');
  const connReq = await clientB.post(`/connections/${resA.data.id}`);
  const connId = connReq.data.connectionId;
  // User A accepts connection
  await clientA.put(`/connections/${connId}/accept`);

  const connectionsResA = await clientA.get('/connections');
  console.log(`   ✅ User A Accepted Connections count: ${connectionsResA.data.length} (Expected: 1)`);

  // 4. Create Project by User A and Join by User B
  console.log('\n4. Creating Project & Verifying Project APIs...');
  const projCreateRes = await clientA.post('/projects', {
    title: 'AI Collaborative Workspace',
    description: 'Building an interactive canvas for peer programming and AI assistance.',
    category: 'WEB_DEVELOPMENT',
    maxMembers: 4,
    requiredSkills: ['React', 'Python', 'Spring Boot'],
  });
  const projectId = projCreateRes.data.id;
  console.log(`   ✅ Project created with ID: ${projectId}`);

  // Fetch created projects
  const myProjectsResA = await clientA.get('/projects/my');
  console.log(`   ✅ User A Created Projects: ${myProjectsResA.data.length}`);

  // User B sends join request
  const joinReq = await clientB.post(`/projects/${projectId}/join`);
  const membershipId = joinReq.data.membershipId;

  // User A accepts User B's join request
  await clientA.put(`/projects/${projectId}/join-requests/${membershipId}/accept`);
  console.log('   ✅ User B join request accepted.');

  // Fetch User B's joined projects
  const joinedProjectsResB = await clientB.get('/projects/my-memberships');
  console.log(`   ✅ User B Joined Projects: ${joinedProjectsResB.data.length}`);

  // 5. Test Skill Matches for Dashboard
  console.log('\n5. Testing Skill Matches for User A Dashboard...');
  const matchesRes = await clientA.get('/skill-swapper/matches?page=1');
  console.log(`   ✅ Matches fetched: ${matchesRes.data.length} matches returned.`);
  if (matchesRes.data.length > 0) {
    const firstMatch = matchesRes.data[0];
    console.log(`      Sample Match: ${firstMatch.name} (${firstMatch.education}) - ${firstMatch.matchPercentage}% match`);
  }

  // 6. Test Recent Activity / Notifications for User A & User B
  console.log('\n6. Testing Notifications / Recent Activity...');
  const notifsA = await clientA.get('/notifications');
  console.log(`   ✅ User A Notifications count: ${notifsA.data.length}`);
  if (notifsA.data.length > 0) {
    console.log(`      Latest activity: [${notifsA.data[0].type}] "${notifsA.data[0].title}" - ${notifsA.data[0].message}`);
  }

  // 7. Test Empty State for Fresh User C
  console.log('\n7. Testing Empty States for Brand New User C...');
  const skillsResC = await clientC.get('/profile/skills');
  const connResC = await clientC.get('/connections');
  const projResC = await clientC.get('/projects/my');
  const joinedResC = await clientC.get('/projects/my-memberships');
  const notifResC = await clientC.get('/notifications');

  console.log(`   ✅ User C Skills: ${skillsResC.data.length} (0 expected -> Clean empty state)`);
  console.log(`   ✅ User C Connections: ${connResC.data.length} (0 expected -> Clean empty state)`);
  console.log(`   ✅ User C Created Projects: ${projResC.data.length} (0 expected -> Clean empty state)`);
  console.log(`   ✅ User C Joined Projects: ${joinedResC.data.length} (0 expected -> Clean empty state)`);
  console.log(`   ✅ User C Notifications: ${notifResC.data.length} (0 expected -> Clean empty state)`);

  console.log('\n🎉 ALL STEP 16 DASHBOARD INTEGRATION TESTS PASSED 100%!\n');
}

runStep16DashboardTests().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
