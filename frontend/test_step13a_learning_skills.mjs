const BACKEND = 'http://localhost:8080/api';

async function testStep13a() {
  console.log('🚀 Starting SkillSync Step 13A — Learning Skills Backend Tests...\n');
  const timestamp = Date.now();

  const userA = {
    name: `Student 13A_Alice_${timestamp}`,
    email: `alice13a_${timestamp}@example.com`,
    password: 'Password123!'
  };

  const userB = {
    name: `Student 13A_Bob_${timestamp}`,
    email: `bob13a_${timestamp}@example.com`,
    password: 'Password123!'
  };

  // ---------------------------------------------------------------------------
  // 1. Check Unauthenticated Security (401)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing Unauthenticated Access ---');
  const unauthGet = await fetch(`${BACKEND}/profile/learning-skills`);
  console.log(`GET /api/profile/learning-skills (no token) -> ${unauthGet.status}`);
  if (unauthGet.status !== 401) throw new Error(`Expected 401, got ${unauthGet.status}`);

  const unauthPost = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Python' })
  });
  console.log(`POST /api/profile/learning-skills (no token) -> ${unauthPost.status}`);
  if (unauthPost.status !== 401) throw new Error(`Expected 401, got ${unauthPost.status}`);

  const unauthDel = await fetch(`${BACKEND}/profile/learning-skills/1`, { method: 'DELETE' });
  console.log(`DELETE /api/profile/learning-skills/1 (no token) -> ${unauthDel.status}`);
  if (unauthDel.status !== 401) throw new Error(`Expected 401, got ${unauthDel.status}`);
  console.log('✅ Unauthenticated requests properly rejected with 401.\n');

  // ---------------------------------------------------------------------------
  // 2. Register & Login Student A
  // ---------------------------------------------------------------------------
  console.log('--- 2. Register & Login Student A ---');
  const regARes = await fetch(`${BACKEND}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userA)
  });
  if (regARes.status !== 201) throw new Error(`Registration A failed: ${regARes.status}`);

  const loginARes = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA.email, password: userA.password })
  });
  const loginA = await loginARes.json();
  const tokenA = loginA.token;
  console.log(`Student A authenticated. Token length: ${tokenA.length}\n`);

  // ---------------------------------------------------------------------------
  // 3. Initial Empty Learning Skills for Student A
  // ---------------------------------------------------------------------------
  console.log('--- 3. Verify Empty Learning Skills List for Student A ---');
  const initGetA = await fetch(`${BACKEND}/profile/learning-skills`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const initSkillsA = await initGetA.json();
  console.log('Student A initial learning skills:', initSkillsA);
  if (!Array.isArray(initSkillsA) || initSkillsA.length !== 0) {
    throw new Error('Expected empty array of learning skills initially');
  }
  console.log('✅ Initial learning skills list is empty.\n');

  // ---------------------------------------------------------------------------
  // 4. Add Learning Skills to Student A (Python, Machine Learning, AI)
  // ---------------------------------------------------------------------------
  console.log('--- 4. Adding Learning Skills to Student A ---');
  const addPythonRes = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Python' })
  });
  console.log(`Add "Python" status: ${addPythonRes.status}`);
  if (addPythonRes.status !== 201) throw new Error(`Add Python failed: ${addPythonRes.status}`);
  const pythonSkill = await addPythonRes.json();
  console.log('Created Python skill:', pythonSkill);

  const addMlRes = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Machine Learning' })
  });
  if (addMlRes.status !== 201) throw new Error('Add ML failed');
  const mlSkill = await addMlRes.json();
  console.log('Created Machine Learning skill:', mlSkill);

  const addAiRes = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'AI' })
  });
  if (addAiRes.status !== 201) throw new Error('Add AI failed');
  const aiSkill = await addAiRes.json();
  console.log('Created AI skill:', aiSkill);

  const listARes = await fetch(`${BACKEND}/profile/learning-skills`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const listA = await listARes.json();
  console.log('Student A learning skills list after adding 3 skills:', listA);
  if (listA.length !== 3) throw new Error(`Expected 3 skills, got ${listA.length}`);
  console.log('✅ Student A successfully added 3 learning skills.\n');

  // ---------------------------------------------------------------------------
  // 5. Input Validation & Duplicate Checks
  // ---------------------------------------------------------------------------
  console.log('--- 5. Testing Validation & Duplicate Prevention ---');
  // Blank skill name
  const blankRes = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: '   ' })
  });
  console.log(`Add blank skill name -> status ${blankRes.status}`);
  if (blankRes.status !== 400) throw new Error(`Expected 400 for blank skill, got ${blankRes.status}`);

  // Duplicate exact
  const dupExactRes = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Python' })
  });
  console.log(`Add duplicate "Python" -> status ${dupExactRes.status}`);
  if (dupExactRes.status !== 409) throw new Error(`Expected 409 for duplicate Python, got ${dupExactRes.status}`);

  // Duplicate case-insensitive
  const dupCaseRes = await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'python' })
  });
  console.log(`Add case-insensitive duplicate "python" -> status ${dupCaseRes.status}`);
  if (dupCaseRes.status !== 409) throw new Error(`Expected 409 for case-insensitive duplicate, got ${dupCaseRes.status}`);
  console.log('✅ Blank inputs rejected with 400 and duplicates rejected with 409.\n');

  // ---------------------------------------------------------------------------
  // 6. User Isolation & LearningSkill Entity Reuse with Student B
  // ---------------------------------------------------------------------------
  console.log('--- 6. User Isolation & Skill Entity Reuse (Student B) ---');
  await fetch(`${BACKEND}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userB)
  });
  const loginBRes = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userB.email, password: userB.password })
  });
  const loginB = await loginBRes.json();
  const tokenB = loginB.token;

  // Verify Student B has no skills initially
  const listBInit = await (await fetch(`${BACKEND}/profile/learning-skills`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  })).json();
  console.log('Student B initial learning skills (must be empty):', listBInit);
  if (listBInit.length !== 0) throw new Error('Student B has unexpected skills!');

  // Student B adds "python" (case-insensitive match with Student A's Python)
  const bAddPython = await (await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'python' })
  })).json();
  console.log('Student B added "python":', bAddPython);
  if (bAddPython.id !== pythonSkill.id) {
    throw new Error(`Expected entity reuse (id ${pythonSkill.id}), but got id ${bAddPython.id}`);
  }
  console.log(`✅ Entity successfully reused! Same ID (${bAddPython.id}) shared across users.`);

  // Student B adds "React"
  const bAddReact = await (await fetch(`${BACKEND}/profile/learning-skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'React' })
  })).json();
  console.log('Student B added "React":', bAddReact);
  console.log('✅ User isolation verified between Student A and Student B.\n');

  // ---------------------------------------------------------------------------
  // 7. Security Rule on DELETE: Cross-User Unauthorized Deletion Guard
  // ---------------------------------------------------------------------------
  console.log('--- 7. Cross-User Delete Security Check ---');
  // Student A tries to delete Student B's "React" learning skill (bAddReact.id)
  const crossDeleteRes = await fetch(`${BACKEND}/profile/learning-skills/${bAddReact.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.log(`Student A attempting to delete Student B's skill (${bAddReact.id}) -> status ${crossDeleteRes.status}`);
  if (crossDeleteRes.status !== 404) {
    throw new Error(`Expected 404 Not Found when deleting other user's skill, got ${crossDeleteRes.status}`);
  }

  // Verify Student B's React is still present
  const listBAfterCross = await (await fetch(`${BACKEND}/profile/learning-skills`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  })).json();
  const bHasReact = listBAfterCross.some(s => s.id === bAddReact.id);
  if (!bHasReact) throw new Error("Student B's skill was improperly deleted by Student A!");
  console.log("✅ Security confirmed: Student A cannot delete Student B's skill relationship.\n");

  // ---------------------------------------------------------------------------
  // 8. Legitimate Removal of Learning Skill
  // ---------------------------------------------------------------------------
  console.log('--- 8. Delete Skill from Authenticated User ---');
  // Student A deletes "Machine Learning" (mlSkill.id)
  const delMlRes = await fetch(`${BACKEND}/profile/learning-skills/${mlSkill.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.log(`Student A deleting own skill (${mlSkill.id}) -> status ${delMlRes.status}`);
  if (delMlRes.status !== 204) throw new Error(`Expected 204 No Content, got ${delMlRes.status}`);

  // Verify Student A's list now has 2 skills
  const listAAfterDel = await (await fetch(`${BACKEND}/profile/learning-skills`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  })).json();
  console.log("Student A learning skills after deletion:", listAAfterDel);
  if (listAAfterDel.some(s => s.id === mlSkill.id) || listAAfterDel.length !== 2) {
    throw new Error('Deleted skill is still present in Student A list!');
  }
  console.log('✅ Learning skill successfully removed from user profile.\n');

  // ---------------------------------------------------------------------------
  // 9. Logical Separation: "My Skills" vs "Learning Skills"
  // ---------------------------------------------------------------------------
  console.log('--- 9. Logical Separation ("My Skills" vs "Learning Skills") ---');
  // Student A adds "Python" to their known skills (/api/profile/skills)
  const addKnownSkillRes = await fetch(`${BACKEND}/profile/skills`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Python' })
  });
  console.log(`Add "Python" to My Skills -> status ${addKnownSkillRes.status}`);
  if (addKnownSkillRes.status !== 201) throw new Error('Failed to add known skill');

  const myKnownSkills = await (await fetch(`${BACKEND}/profile/skills`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  })).json();
  const myLearningSkills = await (await fetch(`${BACKEND}/profile/learning-skills`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  })).json();

  console.log('Student A "My Skills":', myKnownSkills.map(s => s.name));
  console.log('Student A "Skills I Want to Learn":', myLearningSkills.map(s => s.name));

  if (!myKnownSkills.some(s => s.name === 'Python') || !myLearningSkills.some(s => s.name === 'Python')) {
    throw new Error('Skill should be allowed to coexist in both lists independently!');
  }
  console.log('✅ Full logical separation confirmed: a skill can exist in both lists without collision.\n');

  // ---------------------------------------------------------------------------
  // 10. Regression Check on Existing APIs
  // ---------------------------------------------------------------------------
  console.log('--- 10. Existing API Regression Check ---');
  const testRes = await fetch(`${BACKEND}/test`);
  const testText = await testRes.text();
  console.log(`GET /api/test -> ${testRes.status}: ${testText.trim()}`);
  if (testRes.status !== 200) throw new Error('GET /api/test failed');

  const profileRes = await fetch(`${BACKEND}/profile`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.log(`GET /api/profile -> ${profileRes.status}`);
  if (profileRes.status !== 200) throw new Error('GET /api/profile failed');
  console.log('✅ All existing APIs are completely intact!\n');

  console.log('================================================================');
  console.log('🎉 ALL STEP 13A LEARNING SKILLS BACKEND TESTS PASSED FLAWLESSLY!');
  console.log('================================================================\n');
}

testStep13a().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
