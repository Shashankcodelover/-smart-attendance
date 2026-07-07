export type SessionStatus = 'DRAFT' | 'READY' | 'ACTIVE' | 'INACTIVE';

export interface Session {
  id: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  course: string;
  year: number;
  section: string;
  otp: string;
  status: SessionStatus;
  createdAt: string;
  expiresAt?: string;
  markedCount: number;
  expectedCount: number;
  verificationOption?: string;
  timeline?: string;
  lecturerEmail?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentName: string;
  studentUsn: string;
  markedAt: string;
  markedOnline: boolean;
}

export interface Student {
  usn: string;
  name: string;
  attendanceRate: number;
  courseCode: string;
  avatarUrl?: string;
  section: string;
  year: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'section_created' | 'session_activated' | 'session_cancelled' | 'query_result' | 'redirect';
    title: string;
    description: string;
    data?: any;
  };
}

export interface TimetableEntry {
  time: string;
  period: 'AM' | 'PM';
  subjectName: string;
  room: string;
}

export interface SubjectResource {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  materials: {
    title: string;
    type: 'pdf' | 'zip' | 'ppt' | 'doc';
    size: string;
  }[];
}
