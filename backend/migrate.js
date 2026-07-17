import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is missing!");
  console.log("Please run this command like this:");
  console.log("  $env:MONGODB_URI=\"your_connection_string\"; node migrate.js");
  process.exit(1);
}

// Schemas
const SettingsSchema = new mongoose.Schema({
  adminPasscode: { type: String, default: "admin123" },
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

const SettingsModel = mongoose.model('Settings', SettingsSchema);
const ExamModel = mongoose.model('Exam', ExamSchema);
const SubmissionModel = mongoose.model('Submission', SubmissionSchema);

async function migrate() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    console.log("Reading local db.json file...");
    const dataRaw = await fs.readFile(DB_PATH, 'utf-8');
    const dbData = JSON.parse(dataRaw);

    // 1. Migrate settings
    if (dbData.settings) {
      console.log("Migrating settings...");
      await SettingsModel.updateOne({}, dbData.settings, { upsert: true });
    }

    // 2. Migrate exams
    if (dbData.exams && dbData.exams.length > 0) {
      console.log(`Migrating ${dbData.exams.length} exams...`);
      for (const exam of dbData.exams) {
        await ExamModel.updateOne({ id: exam.id }, exam, { upsert: true });
      }
    }

    // 3. Migrate submissions
    if (dbData.submissions && dbData.submissions.length > 0) {
      console.log(`Migrating ${dbData.submissions.length} submissions...`);
      for (const sub of dbData.submissions) {
        await SubmissionModel.updateOne({ id: sub.id }, sub, { upsert: true });
      }
    }

    console.log("Migration completed successfully! 🎉");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
