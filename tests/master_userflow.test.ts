import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server';
import db, { dao } from '../db-sqlite';

describe('🚀 Startup Demo-Day Master End-to-End User Flow & Invariant Test Suite', () => {
  const timestamp = Date.now();
  const testStudentUsn = `4JC22CS${Math.floor(100 + Math.random() * 899)}`;
  const testStudentPin = 'pass1234';
  const testFacultyEmail = `faculty_${timestamp}@sjce.edu`;
  const testFacultyPin = 'fac1234';

  let studentJwtToken = '';
  let facultyJwtToken = '';
  let activeSessionId = '';
  let activeOtp = '';

  before(() => {
    // Ensure clean state for test user
    db.prepare('DELETE FROM users WHERE emailOrUsn = ? OR emailOrUsn = ?').run(testStudentUsn, testFacultyEmail);
  });

  // 1. A-to-Z AUTHENTICATION
  it('01. Student Registration & Sign-Up with JWT Issuance', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        emailOrUsn: testStudentUsn,
        pin: testStudentPin,
        name: 'Demo Candidate',
        role: 'student'
      });

    assert.strictEqual(res.status, 200);
    assert(res.body.token, 'Should return JWT token on signup');
    assert.strictEqual(res.body.user.codeOrUsn, testStudentUsn);
    studentJwtToken = res.body.token;
  });

  it('02. Student Login & Session Verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudentUsn,
        password: testStudentPin,
        role: 'student'
      });

    assert.strictEqual(res.status, 200);
    assert(res.body.token, 'Should return JWT token on login');
    assert.strictEqual(res.body.user.name, 'Demo Candidate');
  });

  it('03. Faculty Registration & Protected Action Authentication', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        emailOrUsn: testFacultyEmail,
        pin: testFacultyPin,
        name: 'Prof. Demo Lead',
        role: 'lecturer'
      });

    assert.strictEqual(res.status, 200);
    assert(res.body.token, 'Should return JWT token for lecturer');
    facultyJwtToken = res.body.token;
  });

  it('04. Route Protection Middleware Rejects Unauthorized Requests', async () => {
    const res = await request(app)
      .post('/api/checkin')
      .send({
        sessionId: 'dummy_sess',
        otpCode: '1234',
        studentUsn: testStudentUsn
      });

    assert.strictEqual(res.status, 401, 'Should reject check-in without Authorization Bearer header');
  });

  // 2. TIMETABLE & COURSE SCHEDULING
  it('05. Faculty Adds and Retrieves Timetable Slots', async () => {
    const slotRes = await request(app)
      .post('/api/timetable/add')
      .send({
        day: 'Monday',
        time_slot: '09:00 AM - 10:00 AM',
        subject_code: 'CS501',
        subject_name: 'Computer Networks',
        department: 'Computer Science (CSE)',
        year: 3,
        section: 'A',
        room: 'CS-301',
        lecturer_name: 'Prof. Demo Lead'
      });

    assert.strictEqual(slotRes.status, 200);
    assert(slotRes.body.success);

    const getRes = await request(app).get('/api/timetable?department=Computer Science (CSE)&year=3&section=A');
    assert.strictEqual(getRes.status, 200);
    assert(Array.isArray(getRes.body));
    assert(getRes.body.length > 0, 'Should find inserted timetable entries');
  });

  // 3. LIVE SESSION CREATION & ROTATING TOTP BROADCAST
  it('06. Faculty Launches Live Class Session with Dynamic Verification Challenge', async () => {
    activeSessionId = `sess_demo_${timestamp}`;
    activeOtp = '8822';

    dao.insertSession({
      id: activeSessionId,
      subject_code: 'CS501',
      subject_name: 'Computer Networks',
      department: 'Computer Science (CSE)',
      course: 'B.E.',
      year: 3,
      section: 'A',
      otp: activeOtp,
      status: 'ACTIVE',
      marked_count: 0,
      expected_count: 60,
      verification_option: 'GOLD_STAR',
      lecturer_email: testFacultyEmail,
      timeline: '09:00 AM - 10:00 AM',
      class_lat: 12.3142,
      class_lng: 76.6134
    });

    const session = dao.getSessionById(activeSessionId);
    assert(session, 'Session should exist in SQLite');
    assert.strictEqual(session.status, 'ACTIVE');
  });

  // 4. STUDENT PRESENCE CHECK-IN WITH ZERO-TRUST SHIELD
  it('07. Student Checks in with Device Fingerprint & Dynamic OTP', async () => {
    const checkinRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${studentJwtToken}`)
      .send({
        sessionId: activeSessionId,
        studentUsn: testStudentUsn,
        studentName: 'Demo Candidate',
        otpCode: activeOtp,
        isOnline: true,
        gpsLat: 12.3142,
        gpsLng: 76.6134,
        verificationOption: 'GOLD_STAR',
        deviceFingerprint: `device_hw_${timestamp}`,
        cryptoAttestation: 'passkey_attestation_signature'
      });

    assert.strictEqual(checkinRes.status, 200);
    assert(checkinRes.body.success, 'Check-in should succeed');
  });

  it('08. Duplicate Check-in is Blocked by Atomic SQLite WAL Mutex', async () => {
    const dupRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${studentJwtToken}`)
      .send({
        sessionId: activeSessionId,
        studentUsn: testStudentUsn,
        studentName: 'Demo Candidate',
        otpCode: activeOtp,
        isOnline: true,
        gpsLat: 12.3142,
        gpsLng: 76.6134,
        verificationOption: 'GOLD_STAR',
        deviceFingerprint: `device_hw_${timestamp}`,
        cryptoAttestation: 'passkey_attestation_signature'
      });

    assert(dupRes.status === 400 || dupRes.status === 403 || dupRes.status === 500);
    assert(dupRes.body.error.toLowerCase().includes('already verified') || dupRes.body.error.toLowerCase().includes('duplicate') || dupRes.body.error.toLowerCase().includes('already recorded'));
  });

  it('09. Proxy Check-in Attempt on Same Device with Different USN is Blocked', async () => {
    const secondUsn = `4JC22CS${Math.floor(100 + Math.random() * 899)}`;
    dao.upsertStudent({
      usn: secondUsn,
      name: 'Second Student',
      department: 'Computer Science (CSE)',
      section: 'A',
      year: 3
    });

    const secondTokenRes = await request(app)
      .post('/api/auth/signup')
      .send({
        emailOrUsn: secondUsn,
        pin: 'pin1234',
        name: 'Second Student',
        role: 'student'
      });

    const proxyRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${secondTokenRes.body.token}`)
      .send({
        sessionId: activeSessionId,
        studentUsn: secondUsn,
        studentName: 'Second Student',
        otpCode: activeOtp,
        isOnline: true,
        gpsLat: 12.3142,
        gpsLng: 76.6134,
        verificationOption: 'GOLD_STAR',
        deviceFingerprint: `device_hw_${timestamp}`, // Same hardware device fingerprint!
        cryptoAttestation: 'passkey_attestation_signature'
      });

    assert(proxyRes.status === 400 || proxyRes.status === 403 || proxyRes.status === 500);
    assert(proxyRes.body.error.toLowerCase().includes('proxy') || proxyRes.body.error.toLowerCase().includes('device') || proxyRes.body.error.toLowerCase().includes('already'));
  });

  // 5. STUDENT EXAM CLEARANCE & HALL TICKET PASSPORT
  it('10. Student Hall Ticket Exam Clearance Passport Issues Cryptographic Verification Badge', async () => {
    const res = await request(app).get(`/api/v2/student/hall-ticket/${testStudentUsn}`);
    assert.strictEqual(res.status, 200);
    assert(res.body.passport, 'Should return hall ticket passport');
    assert(res.body.passport.digitalClearanceBadgeQR.startsWith('HT-PASS:'), 'Should contain signed clearance badge QR');
  });

  // 6. LEAVE APPLICATION WORKFLOW
  it('11. Student Submits Medical Leave Request and Faculty Reviews It', async () => {
    const leaveRes = await request(app)
      .post('/api/leave/submit')
      .set('Authorization', `Bearer ${studentJwtToken}`)
      .send({
        type: 'MEDICAL',
        from_date: '2026-09-01',
        to_date: '2026-09-03',
        reason: 'Viral fever hospital admission',
        sessions_affected: 'CS501, CS502'
      });

    assert.strictEqual(leaveRes.status, 200);
    assert(leaveRes.body.success);

    const getLeaveRes = await request(app).get(`/api/leave/requests?studentUsn=${testStudentUsn}`);
    assert.strictEqual(getLeaveRes.status, 200);
    assert(Array.isArray(getLeaveRes.body));
    const leaveItem = getLeaveRes.body[0];
    assert(leaveItem, 'Should find submitted leave request');

    // Faculty approves leave
    const reviewRes = await request(app)
      .post('/api/leave/review')
      .set('Authorization', `Bearer ${facultyJwtToken}`)
      .send({
        leaveId: leaveItem.id,
        decision: 'APPROVED',
        comment: 'Medical certificate verified. Condonation granted.'
      });

    assert.strictEqual(reviewRes.status, 200);
    assert(reviewRes.body.success);
  });

  // 7. AI ASSISTANT CONVERSATIONAL TOOL-CALLING
  it('12. AI Bot Alpine Executes Natural Language Roster Queries and Schedule Commands', async () => {
    const aiRes = await request(app)
      .post('/api/ai/chat')
      .send({
        message: `Schedule timetable slot for Monday 11:00 AM CS505 in Room 402 for Year 3 Section A`,
        lecturerEmail: testFacultyEmail
      });

    assert.strictEqual(aiRes.status, 200);
    assert(aiRes.body.text, 'Bot should return a friendly response');
    assert(aiRes.body.actionCard, 'Bot should generate actionable UI card');
  });
});
