import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Dynamic MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const isMongo = !!MONGODB_URI;

let SettingsModel, ExamModel, SubmissionModel;

if (isMongo) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Successfully connected to MongoDB Atlas Cluster"))
    .catch(err => console.error("MongoDB connection error:", err));

  const SettingsSchema = new mongoose.Schema({
    adminPasscode: { type: String, default: "hello123" },
    maxTabSwitches: { type: Number, default: 3 }
  }, { strict: false });

  const ExamSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    title: String,
    description: String,
    duration: Number,
    questions: Array
  }, { strict: false });

  const SubmissionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    examId: String,
    examTitle: String,
    studentName: String,
    studentEmail: String,
    studentId: String,
    date: String,
    timeSpent: String,
    tabSwitches: Number,
    tabSwitchLogs: Array,
    score: Number,
    totalQuestions: Number,
    cefrLevel: String,
    recommendation: String,
    notes: String,
    answers: Object
  }, { strict: false });

  SettingsModel = mongoose.model('Settings', SettingsSchema);
  ExamModel = mongoose.model('Exam', ExamSchema);
  SubmissionModel = mongoose.model('Submission', SubmissionSchema);
}

// Helper to read DB
async function readDB() {
  if (isMongo) {
    try {
      let settings = await SettingsModel.findOne();
      if (!settings) {
        settings = await SettingsModel.create({ adminPasscode: "hello123", maxTabSwitches: 3 });
      }
      const exams = await ExamModel.find().lean();
      const submissions = await SubmissionModel.find().sort({ date: -1 }).lean();
      return {
        settings: {
          adminPasscode: settings.adminPasscode,
          maxTabSwitches: settings.maxTabSwitches
        },
        exams,
        submissions
      };
    } catch (err) {
      console.error("Error reading from MongoDB, falling back to default", err);
      return { settings: { adminPasscode: "hello123", maxTabSwitches: 3 }, exams: [], submissions: [] };
    }
  }

  // Fallback to local db.json file
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file, using fallback empty structure", error);
    return { settings: { adminPasscode: "hello123", maxTabSwitches: 3 }, exams: [], submissions: [] };
  }
}

// Helper to write DB
async function writeDB(data) {
  if (isMongo) {
    try {
      // 1. Sync settings
      await SettingsModel.updateOne({}, data.settings, { upsert: true });

      // 2. Sync exams (update/insert existing ones, delete others)
      for (const exam of data.exams) {
        await ExamModel.updateOne({ id: exam.id }, exam, { upsert: true });
      }
      const examIds = data.exams.map(e => e.id);
      await ExamModel.deleteMany({ id: { $nin: examIds } });

      // 3. Sync submissions
      for (const sub of data.submissions) {
        await SubmissionModel.updateOne({ id: sub.id }, sub, { upsert: true });
      }
      const subIds = data.submissions.map(s => s.id);
      await SubmissionModel.deleteMany({ id: { $nin: subIds } });
      return;
    } catch (err) {
      console.error("Error writing to MongoDB:", err);
      return;
    }
  }

  // Fallback to local db.json file
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing to database file", error);
  }
}

// CEFR and Recommendation Calculation
function evaluateSubmission(score, totalQuestions, tabSwitches, autoSubmitted) {
  const pct = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  
  // CEFR Grade mapping
  let cefrLevel = "A0/A1 (Beginner)";
  if (pct >= 90) cefrLevel = "C2 (Proficient)";
  else if (pct >= 80) cefrLevel = "C1 (Advanced)";
  else if (pct >= 60) cefrLevel = "B2 (Upper-Intermediate)";
  else if (pct >= 40) cefrLevel = "B1 (Intermediate)";
  else if (pct >= 20) cefrLevel = "A2 (Elementary)";

  // University Interview Recommendations
  let recommendation = "Not Recommended";
  let notes = "";

  if (autoSubmitted || tabSwitches >= 3) {
    recommendation = "Flagged / Rejected";
    notes = `Exam was locked/submitted due to integrity triggers (${tabSwitches} window shifts detected). CEFR level resolved to ${cefrLevel}.`;
  } else if (pct >= 90 && tabSwitches === 0) {
    recommendation = "Highly Recommended";
    notes = `Exceptional C2 command of English. Flawless test integrity logs. Excellent candidate for immediate interview.`;
  } else if (pct >= 80 && tabSwitches === 0) {
    recommendation = "Highly Recommended";
    notes = `Strong C1 command of English. Absolute integrity. Recommended for university entry panel.`;
  } else if (pct >= 60 && tabSwitches <= 1) {
    recommendation = "Recommended";
    notes = `Solid B2 level English. Safe proficiency score for college interview. Cheating logs satisfactory (${tabSwitches} focus shifts).`;
  } else if (pct >= 40 && tabSwitches <= 2) {
    recommendation = "Borderline";
    notes = `Intermediate B1 score. Tab-switch logs count is ${tabSwitches}. Consider secondary preliminary evaluation before official entry.`;
  } else {
    recommendation = "Not Recommended";
    notes = `Candidate CEFR graded at ${cefrLevel}. English proficiency falls below the eligibility threshold for university entry.`;
  }

  return { cefrLevel, recommendation, notes };
}

// --- API Endpoints ---

// 1. Auth Endpoint (Student register check or Admin Login)
app.post('/api/auth/login', async (req, res) => {
  const { role, passcode, name, email } = req.body;
  const db = await readDB();

  if (role === 'admin') {
    if (passcode === db.settings.adminPasscode) {
      return res.json({ success: true, token: 'admin_session_token' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid Admin Passcode' });
    }
  }

  // Student register is always ok
  if (role === 'student') {
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    return res.json({ success: true, student: { name, email } });
  }

  return res.status(400).json({ success: false, message: 'Invalid login role request' });
});

// 2. Settings Endpoints
app.get('/api/settings', async (req, res) => {
  const db = await readDB();
  res.json(db.settings);
});

app.put('/api/settings', async (req, res) => {
  const { adminPasscode, maxTabSwitches } = req.body;
  const db = await readDB();
  
  if (adminPasscode) db.settings.adminPasscode = adminPasscode;
  if (maxTabSwitches !== undefined) db.settings.maxTabSwitches = Number(maxTabSwitches);

  await writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// 3. Exams List (Public list for student selection, returns only exam meta-data)
app.get('/api/exams', async (req, res) => {
  const db = await readDB();
  const examMetas = db.exams.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    duration: e.duration,
    questionCount: e.questions.length
  }));
  res.json(examMetas);
});

// 4. Start Exam (Fetch full questions list for a selected exam)
app.get('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam set not found' });
  }
  
  // If request has Authorization: admin header, do not strip the correct answer (used for admin editing)
  const isAdmin = req.headers.authorization === 'admin';
  const questionsToSend = isAdmin 
    ? exam.questions 
    : exam.questions.map(q => {
        const { correct, ...rest } = q;
        return rest;
      });

  res.json({
    id: exam.id,
    title: exam.title,
    description: exam.description,
    duration: exam.duration,
    questions: questionsToSend
  });
});

// 5. Admin: Create Exam Set
app.post('/api/exams', async (req, res) => {
  const { title, description, duration, questions } = req.body;
  if (!title || !duration) {
    return res.status(400).json({ success: false, message: 'Exam title and duration are required' });
  }

  const db = await readDB();
  const newExam = {
    id: 'exam_' + Date.now(),
    title,
    description: description || '',
    duration: Number(duration),
    questions: questions || []
  };

  db.exams.push(newExam);
  await writeDB(db);
  res.status(201).json({ success: true, exam: newExam });
});

// 6. Admin: Update Exam Set & Questions
app.put('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, duration, questions } = req.body;
  const db = await readDB();

  const examIndex = db.exams.findIndex(e => e.id === id);
  if (examIndex === -1) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  if (title) db.exams[examIndex].title = title;
  if (description !== undefined) db.exams[examIndex].description = description;
  if (duration !== undefined) db.exams[examIndex].duration = Number(duration);
  if (questions) db.exams[examIndex].questions = questions;

  await writeDB(db);
  res.json({ success: true, exam: db.exams[examIndex] });
});

// 7. Admin: Delete Exam Set
app.delete('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();

  const originalLength = db.exams.length;
  db.exams = db.exams.filter(e => e.id !== id);

  if (db.exams.length === originalLength) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  await writeDB(db);
  res.json({ success: true, message: 'Exam deleted successfully' });
});

// 8. Submit Answers (Calculate CEFR and Recommendation, Save Sub)
app.post('/api/submissions', async (req, res) => {
  const { examId, studentName, studentEmail, studentId, timeSpent, tabSwitches, tabSwitchLogs, answers, autoSubmitted } = req.body;
  if (!examId || !studentName || !studentEmail) {
    return res.status(400).json({ success: false, message: 'Exam ID, Student Name and Email are required' });
  }

  const db = await readDB();
  const exam = db.exams.find(e => e.id === examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam set not found' });
  }

  // Calculate score
  let score = 0;
  const totalQuestions = exam.questions.length;

  exam.questions.forEach((q) => {
    const studentAns = answers[q.id];
    if (studentAns) {
      // Case insensitive match
      if (studentAns.toLowerCase() === q.correct.toLowerCase()) {
        score++;
      }
    }
  });

  const evaluation = evaluateSubmission(score, totalQuestions, tabSwitches, autoSubmitted);

  const newSubmission = {
    id: 'sub_' + Date.now(),
    examId,
    examTitle: exam.title,
    studentName,
    studentEmail,
    studentId: studentId || 'N/A',
    date: new Date().toISOString(),
    timeSpent,
    tabSwitches: Number(tabSwitches),
    tabSwitchLogs: tabSwitchLogs || [],
    score,
    totalQuestions,
    cefrLevel: evaluation.cefrLevel,
    recommendation: evaluation.recommendation,
    notes: evaluation.notes,
    answers // Store student's full responses for auditing
  };

  db.submissions.unshift(newSubmission);
  await writeDB(db);

  res.status(201).json({
    success: true,
    submission: {
      score,
      totalQuestions,
      cefrLevel: evaluation.cefrLevel,
      recommendation: evaluation.recommendation,
      notes: evaluation.notes
    }
  });
});

// 9. Admin: Get all submissions
app.get('/api/submissions', async (req, res) => {
  const db = await readDB();
  res.json(db.submissions);
});

// 10. Admin: Delete submission
app.delete('/api/submissions/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();

  const originalLength = db.submissions.length;
  db.submissions = db.submissions.filter(s => s.id !== id);

  if (db.submissions.length === originalLength) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  await writeDB(db);
  res.json({ success: true, message: 'Submission deleted successfully' });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isMongo ? 'mongodb' : 'json_file',
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`OPT evaluation backend server running on port ${PORT}`);
});
