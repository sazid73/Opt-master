import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Read db.json
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

// Extract all questions from the first (and only) exam
const allQuestions = db.exams[0].questions;

const grammarQs = allQuestions.filter(q => q.section === 'use_of_english');
const listeningQs = allQuestions.filter(q => q.section === 'listening');
const readingQs = allQuestions.filter(q => q.section === 'reading');

// Transform Listening Questions: Remove audio, make it reading dialogue
listeningQs.forEach(q => {
  // We will just rename `audioText` to `dialogue` so the frontend can display it
  q.dialogue = q.audioText;
  delete q.audioText;
  q.text = q.text.replace('Listen to the dialogue.', 'Read the dialogue below.');
});

// Transform Reading Questions: Convert to fill-in-the-blank
const readingAnswers = {
  rd1: "setting",
  rd2: "come",
  rd3: "for",
  rd4: "having",
  rd5: "made",
  rd6: "through",
  rd7: "do"
};

readingQs.forEach(q => {
  q.type = 'fill_in_the_blank';
  delete q.options;
  q.correct = readingAnswers[q.id];
});

// Split Grammar (40 -> 20/20)
const grammarSet1 = grammarQs.slice(0, 20);
const grammarSet2 = grammarQs.slice(20, 40);

// Split Listening (30 -> 15/15)
const listeningSet1 = listeningQs.slice(0, 15);
const listeningSet2 = listeningQs.slice(15, 30);

// Create Set 1
const exam1 = {
  id: "opt_set_1",
  title: "Oxford Placement Test — Set 1",
  description: "Assessment containing Use of English (20 Qs), Reading Dialogues (15 Qs), and Cloze Fill-in-the-blanks (7 Qs).",
  duration: 2700, // 45 mins
  questions: [...grammarSet1, ...listeningSet1, ...readingQs]
};

// Create Set 2
const exam2 = {
  id: "opt_set_2",
  title: "Oxford Placement Test — Set 2",
  description: "Assessment containing Use of English (20 Qs), Reading Dialogues (15 Qs), and Cloze Fill-in-the-blanks (7 Qs).",
  duration: 2700,
  questions: [...grammarSet2, ...listeningSet2, ...readingQs]
};

// Update db.json
db.exams = [exam1, exam2];

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log("Successfully split the database into 2 exams and updated question formats!");
