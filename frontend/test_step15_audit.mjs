import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

async function runStep15Audit() {
  console.log('🔍 Starting Comprehensive SkillSync Step 15 Audit...\n');

  // 1. Authenticate two test users (or register them if needed)
  const userA = { email: `alice_${Date.now()}@test.com`, password: 'Password@123', name: 'Alice Walker' };
  const userB = { email: `bob_${Date.now()}@test.com`, password: 'Password@123', name: 'Bob Roberts' };
  const userC = { email: `carol_${Date.now()}@test.com`, password: 'Password@123', name: 'Carol Danvers' };

  console.log('1. Registering test users...');
  await axios.post(`${API_BASE}/auth/register`, userA);
  await axios.post(`${API_BASE}/auth/register`, userB);
  await axios.post(`${API_BASE}/auth/register`, userC);

  const resA = await axios.post(`${API_BASE}/auth/login`, { email: userA.email, password: userA.password });
  const resB = await axios.post(`${API_BASE}/auth/login`, { email: userB.email, password: userB.password });
  const resC = await axios.post(`${API_BASE}/auth/login`, { email: userC.email, password: userC.password });

  const tokenA = resA.data.token;
  const tokenB = resB.data.token;
  const tokenC = resC.data.token;
  const idA = resA.data.id;
  const idB = resB.data.id;
  const idC = resC.data.id;
  console.log(`✅ Users created: Alice (ID: ${idA}), Bob (ID: ${idB}), Carol (ID: ${idC})\n`);

  const clientA = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenA}` } });
  const clientB = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenB}` } });
  const clientC = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenC}` } });

  // 2. Setup profiles
  await clientA.put('/profile', { bio: 'Alice bio', education: 'MIT', location: 'Boston' });
  await clientB.put('/profile', { bio: 'Bob bio', education: 'Stanford', location: 'SF' });
  await clientC.put('/profile', { bio: 'Carol bio', education: 'Harvard', location: 'Cambridge' });

  // ── 3. TEST PRIVATE CHAT & CONNECTION NOTIFICATIONS ─────────────────────────
  console.log('2. Testing Connection Flow & Notifications...');
  // Alice sends connection request to Bob
  const connRes = await clientA.post(`/connections/${idB}`);
  const connId = connRes.data.connectionId;
  console.log(`  -> Alice sent connection request (ID: ${connId}) to Bob.`);

  // Check Bob's notifications
  const bNotifs1 = await clientB.get('/notifications');
  const foundConnReq = bNotifs1.data.find(n => n.type === 'CONNECTION_REQUEST');
  if (!foundConnReq) throw new Error('Bob did not receive CONNECTION_REQUEST notification');
  console.log(`  ✅ Bob received notification: "${foundConnReq.title}" - "${foundConnReq.message}"`);

  // Bob accepts connection request
  await clientB.put(`/connections/${connId}/accept`);
  console.log(`  -> Bob accepted Alice's request.`);

  // Check Alice's notifications
  const aNotifs1 = await clientA.get('/notifications');
  const foundConnAccepted = aNotifs1.data.find(n => n.type === 'CONNECTION_ACCEPTED');
  if (!foundConnAccepted) throw new Error('Alice did not receive CONNECTION_ACCEPTED notification');
  console.log(`  ✅ Alice received notification: "${foundConnAccepted.title}" - "${foundConnAccepted.message}"\n`);

  // ── 4. TEST PRIVATE CHAT ───────────────────────────────────────────────────
  console.log('3. Testing Private Chat Between Alice and Bob...');
  // Alice sends message to Bob
  const msgRes = await clientA.post('/chat/send', { receiverId: idB, content: 'Hello Bob! Excited to swap skills.' });
  const msgId = msgRes.data.id;
  console.log(`  -> Alice sent message (ID: ${msgId}) to Bob: "${msgRes.data.content}"`);

  // Bob checks notification for message
  const bNotifs2 = await clientB.get('/notifications');
  const foundMsgNotif = bNotifs2.data.find(n => n.type === 'PRIVATE_MESSAGE');
  if (!foundMsgNotif) throw new Error('Bob did not receive PRIVATE_MESSAGE notification');
  console.log(`  ✅ Bob received message notification: "${foundMsgNotif.title}" - "${foundMsgNotif.message}"`);

  // Bob loads conversation history
  const historyBob = await clientB.get(`/chat/${idA}`);
  if (historyBob.data.length === 0 || historyBob.data[0].content !== 'Hello Bob! Excited to swap skills.') {
    throw new Error('Failed to load message in conversation history');
  }
  console.log(`  ✅ Bob loaded conversation history with Alice (Count: ${historyBob.data.length})`);

  // Bob marks messages as read
  await clientB.put(`/chat/${idA}/read`);
  console.log(`  ✅ Bob marked messages as read.`);

  // Alice deletes the message
  await clientA.delete(`/chat/messages/${msgId}`);
  const historyAfterDelete = await clientB.get(`/chat/${idA}`);
  if (historyAfterDelete.data.length !== 0) throw new Error('Message was not deleted from database');
  console.log(`  ✅ Alice successfully deleted message; history now empty.\n`);

  // ── 5. TEST SECURITY: Unconnected User Chat Access ─────────────────────────
  console.log('4. Testing Private Chat Security (Unconnected User)...');
  try {
    await clientC.post('/chat/send', { receiverId: idA, content: 'Hey Alice, I am not connected with you' });
    throw new Error('Expected 403 Forbidden for unconnected user private chat');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✅ Security verified: Unconnected user Carol received 403 Forbidden on private chat.');
    } else {
      throw err;
    }
  }

  // ── 6. TEST PROJECT GROUP CHAT & NOTIFICATIONS ─────────────────────────────
  console.log('\n5. Testing Project Group Chat & Authorization...');
  // Alice creates a project
  const projRes = await clientA.post('/projects', {
    title: 'FullStack Cloud Platform',
    description: 'Building a microservices cloud platform with Spring Boot and React',
    requiredSkills: ['Java', 'Spring Boot', 'React'],
    maxMembers: 4,
  });
  const projId = projRes.data.id;
  console.log(`  -> Alice created Project (ID: ${projId}): "${projRes.data.title}"`);

  // Bob requests to join project
  const joinReq = await clientB.post(`/projects/${projId}/join`);
  const membershipId = joinReq.data.membershipId;
  console.log(`  -> Bob requested to join project (Membership ID: ${membershipId})`);

  // Alice checks notification for join request
  const aNotifs2 = await clientA.get('/notifications');
  const foundJoinReqNotif = aNotifs2.data.find(n => n.type === 'PROJECT_JOIN_REQUEST');
  if (!foundJoinReqNotif) throw new Error('Alice did not receive PROJECT_JOIN_REQUEST notification');
  console.log(`  ✅ Alice received notification: "${foundJoinReqNotif.title}" - "${foundJoinReqNotif.message}"`);

  // Test Security: Bob (PENDING) tries to access project group chat -> should be DENIED (403)
  try {
    await clientB.get(`/projects/${projId}/chat`);
    throw new Error('Expected 403 Forbidden for PENDING member');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✅ Security verified: PENDING member Bob received 403 Forbidden on group chat access.');
    } else {
      throw err;
    }
  }

  // Alice accepts Bob's join request
  await clientA.put(`/projects/${projId}/join-requests/${membershipId}/accept`);
  console.log(`  -> Alice accepted Bob's membership request.`);

  // Bob checks notification for acceptance
  const bNotifs3 = await clientB.get('/notifications');
  const foundAcceptedNotif = bNotifs3.data.find(n => n.type === 'PROJECT_JOIN_ACCEPTED');
  if (!foundAcceptedNotif) throw new Error('Bob did not receive PROJECT_JOIN_ACCEPTED notification');
  console.log(`  ✅ Bob received notification: "${foundAcceptedNotif.title}" - "${foundAcceptedNotif.message}"`);

  // Now Bob (ACCEPTED) sends a message to project group chat
  const groupMsgRes = await clientB.post(`/projects/${projId}/chat/send`, { content: 'Hello team! Happy to join the cloud platform project.' });
  console.log(`  ✅ Bob sent project group message: "${groupMsgRes.data.content}"`);

  // Alice loads project group chat history
  const groupHistory = await clientA.get(`/projects/${projId}/chat`);
  if (groupHistory.data.length === 0 || groupHistory.data[0].content !== 'Hello team! Happy to join the cloud platform project.') {
    throw new Error('Failed to load project group chat history');
  }
  console.log(`  ✅ Alice successfully loaded group chat history (Count: ${groupHistory.data.length})`);

  // Test Security: Unrelated user Carol tries to access project group chat -> 403 Forbidden
  try {
    await clientC.get(`/projects/${projId}/chat`);
    throw new Error('Expected 403 Forbidden for unrelated user');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✅ Security verified: Unrelated student Carol received 403 Forbidden on project group chat.');
    } else {
      throw err;
    }
  }

  // ── 7. TEST NOTIFICATIONS API (Read status, unread count, delete) ───────────
  console.log('\n6. Testing Notification Center APIs...');
  const countRes = await clientB.get('/notifications/unread-count');
  console.log(`  -> Bob unread notifications count: ${countRes.data.unreadCount}`);
  if (countRes.data.unreadCount <= 0) throw new Error('Unread count should be > 0');

  // Mark all as read
  await clientB.put('/notifications/read-all');
  const countAfter = await clientB.get('/notifications/unread-count');
  if (countAfter.data.unreadCount !== 0) throw new Error('Expected 0 unread notifications after read-all');
  console.log(`  ✅ Bob marked all as read. Unread count is now: ${countAfter.data.unreadCount}`);

  console.log('\n🎉 ALL STEP 15 AUDIT TESTS PASSED FLAWLESSLY!\n');
}

runStep15Audit().catch((err) => {
  console.error('\n❌ Audit Test Error:', err.message, err.response?.data || '');
  process.exit(1);
});
