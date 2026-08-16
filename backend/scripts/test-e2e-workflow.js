const assert = require('assert');

const API_BASE = 'http://localhost:3010/api/v1';

async function runTests() {
  console.log('Starting E2E learning workflow tests...');
  
  // 1. AUTHENTICATION
  console.log('\n--- 1. AUTHENTICATION ---');
  const emailA = `userA-${Date.now()}@test.com`;
  const emailB = `userB-${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  
  // Register User A
  console.log('Registering User A...');
  const regResA = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password, name: 'User A' }),
  });
  assert.strictEqual(regResA.status, 201, 'Registration User A failed');
  
  // Register User B
  console.log('Registering User B...');
  const regResB = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, password, name: 'User B' }),
  });
  assert.strictEqual(regResB.status, 201, 'Registration User B failed');
  
  // Login User A
  console.log('Logging in User A...');
  const loginResA = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password }),
  });
  assert.strictEqual(loginResA.status, 200, 'Login User A failed');
  const loginDataA = await loginResA.json();
  const tokenA = loginDataA.tokens.accessToken;
  assert.ok(tokenA, 'Access token A not returned');
  
  // Login User B
  console.log('Logging in User B...');
  const loginResB = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, password }),
  });
  assert.strictEqual(loginResB.status, 200, 'Login User B failed');
  const loginDataB = await loginResB.json();
  const tokenB = loginDataB.tokens.accessToken;
  
  // Verify GET /users/me
  console.log('Checking /users/me for User A...');
  const meRes = await fetch(`${API_BASE}/users/me`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  assert.strictEqual(meRes.status, 200, 'GET /users/me failed');
  const meData = await meRes.json();
  assert.strictEqual(meData.email.toLowerCase(), emailA.toLowerCase(), 'Incorrect user returned by /users/me');
  console.log('Authentication: PASS');

  // 2. STUDY SET
  console.log('\n--- 2. STUDY SET ---');
  console.log('Creating study set for User A...');
  const setRes = await fetch(`${API_BASE}/study-sets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ title: 'Math 101', description: 'Basic calculus' }),
  });
  assert.strictEqual(setRes.status, 201, 'Study set creation failed');
  const studySet = await setRes.json();
  const setId = studySet.id;
  assert.ok(setId, 'Study set ID not returned');
  
  console.log('Retrieving study set...');
  const getSetRes = await fetch(`${API_BASE}/study-sets/${setId}`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  assert.strictEqual(getSetRes.status, 200, 'Study set retrieval failed');
  const retrievedSet = await getSetRes.json();
  assert.strictEqual(retrievedSet.title, 'Math 101');
  
  console.log('Updating study set...');
  const updateSetRes = await fetch(`${API_BASE}/study-sets/${setId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ title: 'Math 101 - Calculus', description: 'Advanced Calculus' }),
  });
  assert.strictEqual(updateSetRes.status, 200, 'Study set update failed');
  const updatedSet = await updateSetRes.json();
  assert.strictEqual(updatedSet.title, 'Math 101 - Calculus');
  console.log('Study Sets: PASS');

  // 3. CONTENT
  console.log('\n--- 3. CONTENT ---');
  console.log('Adding note content to study set...');
  const noteRes = await fetch(`${API_BASE}/study-sets/${setId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ title: 'Limits and Derivatives', content: 'In calculus, a limit is the value that a function approaches...' }),
  });
  assert.strictEqual(noteRes.status, 201, 'Note creation failed');
  const note = await noteRes.json();
  assert.ok(note.id, 'Note ID not returned');
  
  console.log('Retrieving notes for study set...');
  const getNotesRes = await fetch(`${API_BASE}/study-sets/${setId}/notes`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  assert.strictEqual(getNotesRes.status, 200, 'Notes retrieval failed');
  const notes = await getNotesRes.json();
  assert.ok(notes.length > 0, 'No notes retrieved');
  console.log('Content: PASS');

  // 4. AI GENERATION
  console.log('\n--- 4. AI GENERATION ---');
  console.log('Verifying AI BYOK error for flashcards (as no key is set)...');
  const aiRes = await fetch(`${API_BASE}/ai/generate-flashcards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ content: 'In calculus, a limit is the value that a function approaches...', count: 5 }),
  });
  // Since User A doesn't have a personal key, BYOK enforcement MUST return a controlled 400 Bad Request error.
  assert.strictEqual(aiRes.status, 400, 'AI request did not trigger controlled BYOK error');
  const aiError = await aiRes.json();
  assert.ok(aiError.message.includes('No OpenRouter API key configured'), 'AI error message was not BYOK');
  console.log('AI Generation (BYOK enforcement check): PASS');

  // 5. FLASHCARDS
  console.log('\n--- 5. FLASHCARDS ---');
  console.log('Manually creating a flashcard for progress testing...');
  const cardRes = await fetch(`${API_BASE}/study-sets/${setId}/flashcards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ front: 'What is a limit?', back: 'The value that a function approaches.' }),
  });
  assert.strictEqual(cardRes.status, 201, 'Flashcard creation failed');
  const card = await cardRes.json();
  const cardId = card.id;
  
  console.log('Reviewing flashcard...');
  const reviewRes = await fetch(`${API_BASE}/flashcards/${cardId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ quality: 4 }),
  });
  assert.strictEqual(reviewRes.status, 201, 'Flashcard review failed');
  
  console.log('Checking study-set progress...');
  const progressRes = await fetch(`${API_BASE}/flashcards/study-set/${setId}/progress`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  const progress = await progressRes.json();
  assert.ok(progress.total >= 1, 'Incorrect progress values');
  console.log('Flashcards: PASS');

  // 6. QUIZ
  console.log('\n--- 6. QUIZ ---');
  console.log('Creating a quiz manually...');
  const quizRes = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Limits Quiz',
      studySetId: setId,
      questions: [
        {
          type: 'multiple_choice',
          question: 'What is a derivative?',
          options: ['Slope of curve', 'Area under curve', 'Constant', 'None'],
          correctAnswer: 'Slope of curve',
        },
      ],
    }),
  });
  assert.strictEqual(quizRes.status, 201, 'Quiz creation failed');
  const quiz = await quizRes.json();
  const quizId = quiz.id;
  
  console.log('Retrieving quiz questions...');
  const questionsRes = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  assert.strictEqual(questionsRes.status, 200, 'Quiz questions retrieval failed');
  const questions = await questionsRes.json();
  const questionId = questions[0].id;
  
  console.log('Submitting quiz attempt...');
  const attemptRes = await fetch(`${API_BASE}/quizzes/${quizId}/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      answers: [{ questionId, answer: 'Slope of curve', timeSpent: 5 }],
      totalTimeSpent: 5,
    }),
  });
  assert.strictEqual(attemptRes.status, 201, 'Quiz attempt submission failed');
  console.log('Quiz: PASS');

  // 7. ANALYTICS
  console.log('\n--- 7. ANALYTICS ---');
  console.log('Querying analytics...');
  const analyticsRes = await fetch(`${API_BASE}/analytics/me`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  assert.strictEqual(analyticsRes.status, 200, 'Analytics retrieval failed');
  console.log('Analytics: PASS');

  // 8. DATA ISOLATION
  console.log('\n--- 8. DATA ISOLATION ---');
  console.log('Verifying User B cannot access User A study set...');
  const badAccessRes = await fetch(`${API_BASE}/study-sets/${setId}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` },
  });
  // Should fail with 403 Forbidden or 404 Not Found due to access guard
  assert.ok([403, 404].includes(badAccessRes.status), 'User B was allowed to access User A study set');
  console.log('Authorization/Data Isolation: PASS');

  // 9. CLEANUP
  console.log('\n--- 9. CLEANUP ---');
  console.log('Cleaning up User A study set...');
  const delRes = await fetch(`${API_BASE}/study-sets/${setId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  assert.strictEqual(delRes.status, 204, 'Study set deletion failed');
  console.log('Cleanup: PASS');
  
  console.log('\n=======================================');
  console.log('All workflow checks successfully passed!');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('\nE2E Workflow test failed:', err);
  process.exit(1);
});
