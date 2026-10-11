import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('   SKILLSYNC STEP 14 PART 2 - COMPREHENSIVE E2E TESTS   ');
  console.log('========================================================\n');

  const timestamp = Date.now();
  let studentAToken, studentBToken, studentCToken, studentDToken;
  let studentAId, studentBId, studentCId, studentDId;
  let testProjectId, studentBMembershipId;

  // 1. Register Student A
  console.log('1. Registering Student A...');
  const resRegA = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: `Ananya Sharma ${timestamp}`,
    email: `ananya_${timestamp}@test.edu`,
    password: 'Password123!',
  });
  console.log(`   Student A status: ${resRegA.status}`);
  studentAToken = resRegA.data.token;
  studentAId = resRegA.data.id;

  // 2. Register Student B
  console.log('2. Registering Student B...');
  const resRegB = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: `Rahul Verma ${timestamp}`,
    email: `rahul_${timestamp}@test.edu`,
    password: 'Password123!',
  });
  console.log(`   Student B status: ${resRegB.status}`);
  studentBToken = resRegB.data.token;
  studentBId = resRegB.data.id;

  // 3. Register Student C and Student D for capacity testing
  const resRegC = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: `Priya Patel ${timestamp}`,
    email: `priya_${timestamp}@test.edu`,
    password: 'Password123!',
  });
  studentCToken = resRegC.data.token;
  studentCId = resRegC.data.id;

  const resRegD = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: `Karan Malhotra ${timestamp}`,
    email: `karan_${timestamp}@test.edu`,
    password: 'Password123!',
  });
  studentDToken = resRegD.data.token;
  studentDId = resRegD.data.id;

  // 4. Student A creates a Project with capacity = 3 and Looking For roles
  console.log('\n3. Student A creates project with maxMembers=3 and lookingFor roles...');
  const resCreateProj = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/projects',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentAToken}`,
    },
  }, {
    title: `AI Study Assistant ${timestamp}`,
    description: 'Build an AI-powered learning platform with smart recommendations and peer study groups.',
    requiredSkills: ['React', 'Java', 'MySQL'],
    maxMembers: 3,
    lookingForRoles: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer'],
  });
  console.log(`   Create Project status: ${resCreateProj.status}`);
  console.log(`   Project ID: ${resCreateProj.data.id}`);
  console.log(`   Max Members: ${resCreateProj.data.maxMembers}`);
  console.log(`   Current Members: ${resCreateProj.data.currentMembers}`);
  console.log(`   Looking For: ${resCreateProj.data.lookingFor}`);
  testProjectId = resCreateProj.data.id;

  if (resCreateProj.status !== 201) {
    throw new Error(`Failed to create project: ${JSON.stringify(resCreateProj.data)}`);
  }

  // 5. Verify GET /api/projects returns correct capacity & roles
  console.log('\n4. Verifying GET /api/projects returns capacity and roles...');
  const resGetProjects = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/projects',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentBToken}` },
  });
  const foundProj = resGetProjects.data.find(p => p.id === testProjectId);
  console.log(`   Found in list: ${!!foundProj}`);
  console.log(`   Max: ${foundProj.maxMembers}, Current: ${foundProj.currentMembers}`);
  if (foundProj.maxMembers !== 3 || foundProj.currentMembers !== 1) {
    throw new Error('Member count calculation mismatch!');
  }

  // 6. Student B sends Join Request
  console.log('\n5. Student B requests to join project...');
  const resJoinB = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/join`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentBToken}` },
  });
  console.log(`   Student B join status: ${resJoinB.status}`);
  console.log(`   Membership status: ${resJoinB.data.status}`);
  studentBMembershipId = resJoinB.data.membershipId;

  // 7. Student B checks My Requests
  console.log('\n6. Student B checks GET /api/projects/my-requests...');
  const resMyReqB = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/projects/my-requests',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentBToken}` },
  });
  console.log(`   My Requests count: ${resMyReqB.data.length}`);
  const reqItemB = resMyReqB.data.find(r => r.projectId === testProjectId);
  console.log(`   Request Item Status: ${reqItemB.status}`);
  console.log(`   Owner Name on Request: ${reqItemB.ownerName}`);
  if (reqItemB.status !== 'PENDING' || !reqItemB.ownerName) {
    throw new Error('Owner name or status missing on join request!');
  }

  // 8. Student A views Join Requests and accepts Student B
  console.log('\n7. Student A views requests and accepts Student B...');
  const resPendingA = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/join-requests`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentAToken}` },
  });
  console.log(`   Pending requests visible to owner: ${resPendingA.data.length}`);

  const resAcceptB = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/join-requests/${studentBMembershipId}/accept`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${studentAToken}` },
  });
  console.log(`   Accept status: ${resAcceptB.status}`);
  console.log(`   Accepted member status: ${resAcceptB.data.status}`);

  // 9. Verify member count is now 2 (Student A + Student B)
  console.log('\n8. Checking project member count after acceptance...');
  const resGetProjUpdated = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentBToken}` },
  });
  console.log(`   Current Members: ${resGetProjUpdated.data.currentMembers} / ${resGetProjUpdated.data.maxMembers}`);
  if (resGetProjUpdated.data.currentMembers !== 2) {
    throw new Error(`Expected currentMembers=2 but got ${resGetProjUpdated.data.currentMembers}`);
  }

  // 10. Test Group Chat between Student A (owner) and Student B (accepted member)
  console.log('\n9. Testing Project Group Chat...');
  const resSendChatA = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/chat/send`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentAToken}`,
    },
  }, {
    projectId: testProjectId,
    content: 'Welcome to the AI Study Assistant team, Rahul! Let us start building the frontend in React.',
  });
  console.log(`   Chat message sent status: ${resSendChatA.status}`);

  const resChatHistoryB = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/chat`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentBToken}` },
  });
  console.log(`   Student B fetched chat messages: ${resChatHistoryB.data.length}`);
  console.log(`   Latest message: "${resChatHistoryB.data[resChatHistoryB.data.length - 1].content}"`);

  // 11. Student C joins and is accepted -> project reaches capacity (3/3)
  console.log('\n10. Student C joins and is accepted to reach full capacity (3/3)...');
  const resJoinC = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/join`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentCToken}` },
  });
  const resAcceptC = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/join-requests/${resJoinC.data.membershipId}/accept`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${studentAToken}` },
  });
  console.log(`   Student C accepted. Total members should be 3.`);

  // 12. Student D tries to join full project -> capacity rejection
  console.log('\n11. Student D attempts to join full project (capacity=3)...');
  const resJoinD = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/join`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentDToken}` },
  });
  console.log(`   Student D join status: ${resJoinD.status} (Expected 400 capacity rejection)`);
  console.log(`   Error message: "${resJoinD.data.message}"`);
  if (resJoinD.status !== 400 || !resJoinD.data.message?.toLowerCase().includes('capacity')) {
    throw new Error('Project capacity limit was not enforced!');
  }

  // 13. Owner Security: Student B tries to update or delete Student A's project
  console.log('\n12. Testing Owner Security (Student B tries to edit Project A)...');
  const resSecUpdate = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentBToken}`,
    },
  }, {
    title: 'Hacked Project Title',
  });
  console.log(`   Student B update status: ${resSecUpdate.status} (Expected 403 Forbidden)`);
  if (resSecUpdate.status !== 403) {
    throw new Error('Owner authorization check failed on project update!');
  }

  // 14. Skill Swapper Connection Requests test:
  console.log('\n13. Testing Skill Swapper Sent Connection Requests...');
  const resConnReq = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/connections/${studentBId}`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentAToken}` },
  });
  console.log(`   Connection request sent status: ${resConnReq.status}`);

  const resSentConn = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/connections/requests/sent',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentAToken}` },
  });
  console.log(`   Sent connection requests: ${resSentConn.data.length}`);
  const connToB = resSentConn.data.find(c => c.userId === studentBId);
  console.log(`   Target User: ${connToB.userName}`);
  console.log(`   Connection Status: ${connToB.status}`);
  if (!connToB || connToB.status !== 'PENDING') {
    throw new Error('Sent connection request missing or incorrect status!');
  }

  // 15. Student A removes Student B from Project:
  console.log('\n14. Testing Member Removal by Owner...');
  const resRemoveB = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/members/${studentBMembershipId}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${studentAToken}` },
  });
  console.log(`   Remove member status: ${resRemoveB.status}`);

  // After removal, Student B loses chat access
  const resChatAfterRemoval = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: `/api/projects/${testProjectId}/chat`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentBToken}` },
  });
  console.log(`   Student B chat access after removal: ${resChatAfterRemoval.status} (Expected 403 Forbidden)`);
  if (resChatAfterRemoval.status !== 403) {
    throw new Error('Removed member still had access to project group chat!');
  }

  console.log('\n========================================================');
  console.log('   >>> ALL STEP 14 PART 2 E2E TESTS PASSED (14/14) <<<   ');
  console.log('========================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
