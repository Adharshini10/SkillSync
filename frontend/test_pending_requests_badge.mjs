import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

async function runTest() {
  console.log('Testing Owner Pending Requests & Profile Feature...');
  const timestamp = Date.now();

  // 1. Register Owner (Student A)
  const ownerEmail = `owner_${timestamp}@test.edu`;
  const ownerRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Owner Prof ${timestamp}`,
    email: ownerEmail,
    password: 'Password123!',
  });
  const ownerToken = ownerRes.data.token;
  console.log('✅ 1. Owner registered');

  // 2. Register Applicant (Student B)
  const applicantEmail = `applicant_${timestamp}@test.edu`;
  const applicantRes = await axios.post(`${API_BASE}/auth/register`, {
    name: `Kavya Dev ${timestamp}`,
    email: applicantEmail,
    password: 'Password123!',
  });
  const applicantToken = applicantRes.data.token;
  console.log('✅ 2. Applicant registered');

  // 3. Add skills and profile to Applicant
  await axios.post(
    `${API_BASE}/profile/skills`,
    { name: 'React' },
    { headers: { Authorization: `Bearer ${applicantToken}` } }
  );
  await axios.post(
    `${API_BASE}/profile/skills`,
    { name: 'TypeScript' },
    { headers: { Authorization: `Bearer ${applicantToken}` } }
  );
  await axios.put(
    `${API_BASE}/profile`,
    {
      bio: 'Enthusiastic full-stack student looking for exciting projects',
      education: 'B.Tech IT',
      location: 'Hyderabad, India',
    },
    { headers: { Authorization: `Bearer ${applicantToken}` } }
  );
  console.log('✅ 3. Applicant profile & skills configured');

  // 4. Owner creates project
  const projectRes = await axios.post(
    `${API_BASE}/projects`,
    {
      title: `Cloud Vision AI ${timestamp}`,
      description: 'An AI-powered image recognition project for smart attendance.',
      requiredSkills: ['React', 'Python'],
      maxMembers: 4,
      lookingFor: 'Frontend Developer',
    },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  const projectId = projectRes.data.id;
  console.log(`✅ 4. Project created: ID ${projectId} ("Cloud Vision AI ${timestamp}")`);

  // 5. Applicant sends join request
  const joinRes = await axios.post(
    `${API_BASE}/projects/${projectId}/join`,
    {},
    { headers: { Authorization: `Bearer ${applicantToken}` } }
  );
  console.log('✅ 5. Join request submitted by applicant. Status:', joinRes.data.status);

  // 6. Owner fetches GET /api/projects/owner/pending-requests
  const pendingRes = await axios.get(`${API_BASE}/projects/owner/pending-requests`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log(`✅ 6. Owner fetched pending requests: Count = ${pendingRes.data.length}`);
  if (pendingRes.data.length !== 1) {
    throw new Error(`Expected 1 pending request, got ${pendingRes.data.length}`);
  }

  const req = pendingRes.data[0];
  console.log('   - Applicant Name:', req.userName);
  console.log('   - Project Title:', req.projectTitle);
  console.log('   - Applicant Bio:', req.userBio);
  console.log('   - Applicant Education:', req.userEducation);
  console.log('   - Applicant Location:', req.userLocation);
  console.log('   - Applicant Skills:', req.userSkills);

  if (!req.userName.startsWith('Kavya Dev')) {
    throw new Error(`Unexpected user name: ${req.userName}`);
  }
  if (!req.projectTitle.startsWith('Cloud Vision AI')) {
    throw new Error(`Unexpected project title: ${req.projectTitle}`);
  }
  if (!req.userSkills.includes('React') || !req.userSkills.includes('TypeScript')) {
    throw new Error(`Applicant skills missing React/TypeScript: ${req.userSkills}`);
  }

  // 7. Owner accepts request
  const acceptRes = await axios.put(
    `${API_BASE}/projects/${projectId}/join-requests/${req.membershipId}/accept`,
    {},
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  console.log('✅ 7. Owner accepted request:', acceptRes.data.status);

  // 8. Owner checks pending requests again -> should be 0
  const afterAccept = await axios.get(`${API_BASE}/projects/owner/pending-requests`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log('✅ 8. Pending requests after acceptance:', afterAccept.data.length);
  if (afterAccept.data.length !== 0) {
    throw new Error('Expected 0 pending requests after accept');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL PENDING REQUESTS & APPLICANT PROFILE TESTS PASSED!');
  console.log('======================================================');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
