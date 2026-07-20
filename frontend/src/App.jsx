import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, AlertTriangle, User, Clock, Eye, BookOpen, Award, CheckCircle,
  XCircle, Search, Download, RotateCcw, Settings, LogOut, Moon, Sun,
  ChevronLeft, ChevronRight, Bookmark, HelpCircle, FileText, Check, Info, Trash2,
  ShieldAlert, Play, Pause, Plus, Edit, PlusCircle, CheckSquare, Volume2, ListPlus
} from 'lucide-react';

let API_BASE_RAW = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
if (!API_BASE_RAW.endsWith('/api') && !API_BASE_RAW.endsWith('/api/')) {
  API_BASE_RAW = API_BASE_RAW.replace(/\/$/, '') + '/api';
}
const API_BASE = API_BASE_RAW;
console.log("OPT Master API Base configured to:", API_BASE);

// Helper function to format time (seconds to MM:SS)
const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

function App() {
  // Global App State
  const [mode, setMode] = useState('welcome'); // welcome, exam, finished, admin
  const [theme, setTheme] = useState(() => localStorage.getItem('opt_theme') || 'light');
  const [loading, setLoading] = useState(false);
  
  // Available Exams from Backend
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  
  // Settings from Backend
  const [settings, setSettings] = useState({ maxTabSwitches: 3, adminPasscode: 'admin123' });
  
  // Student Entry Information
  const [studentInfo, setStudentInfo] = useState({ name: '', email: '', id: '' });
  
  // Active Exam Session States
  const [activeExam, setActiveExam] = useState(null); // Full exam details with questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [examStartTime, setExamStartTime] = useState(null);
  
  // Listening Audio Controls (TTS-based)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayCount, setAudioPlayCount] = useState({}); // Track plays per question ID
  
  // Tab-switching / Cheating Detection States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState([]);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [autoSubmittedDueToCheating, setAutoSubmittedDueToCheating] = useState(false);
  
  // Finished / Submission Results
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Admin Login and Authentication States
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => !!sessionStorage.getItem('opt_admin_token'));
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  
  // Admin Submissions & Stats
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilterRec, setAdminFilterRec] = useState('all');
  const [adminFilterIntegrity, setAdminFilterIntegrity] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false);
  
  // Admin Exam/Question Manager States
  const [adminExams, setAdminExams] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('results'); // results, exams
  const [editingExam, setEditingExam] = useState(null); // Exam object being edited/created
  const [editingQuestion, setEditingQuestion] = useState(null); // Question object being edited/created
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // References
  const timerRef = useRef(null);
  const blurTimeRef = useRef(null);
  const speechUttRef = useRef(null);

  // Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('opt_theme', theme);
  }, [theme]);

  // Initial Data Fetch
  useEffect(() => {
    fetchExams();
    fetchSettings();
  }, []);

  // Fetch all exams
  const fetchExams = async () => {
    try {
      const res = await fetch(`${API_BASE}/exams`);
      const data = await res.json();
      setAvailableExams(data);
      const activeExams = data.filter(e => e.isActive !== false);
      if (activeExams.length > 0 && !selectedExamId) {
        setSelectedExamId(activeExams[0].id);
      }
    } catch (e) {
      console.error("Error fetching exams list", e);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error("Error fetching settings", e);
    }
  };

  // Fetch Submissions (Admin only)
  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/submissions`);
      const data = await res.json();
      setAdminSubmissions(data);
    } catch (e) {
      console.error("Error fetching submissions", e);
    }
  };

  // Fetch Exam sets for Admin manager (includes answers)
  const fetchAdminExams = async () => {
    try {
      const res = await fetch(`${API_BASE}/exams`);
      const list = await res.json();
      
      // For admin, we want to fetch the full questions (which normally might require authorization,
      // but in our server.js, GET /exams/:id returns the sanitized, but we'll fetch full ones using
      // another endpoint or by loading the full data)
      const fullExams = [];
      for (const e of list) {
        const fullRes = await fetch(`${API_BASE}/exams/${e.id}`);
        const fullData = await fullRes.json();
        
        // Wait, server.js strips 'correct' for students. For admin view, we want to see/edit everything.
        // In our server, it doesn't verify authorization, but since we are simple client-server SPA,
        // we'll bypass stripping or we can fetch a special admin endpoint if needed, or customize server.js
        // to return the unstripped data if role is specified. Oh! In server.js, app.get('/api/exams/:id')
        // strips correct, but in a real system we would check headers. To ensure the admin can set and see
        // correct answers, we can call it with an admin query parameter! Let's modify our client-side app to
        // get the list of exams. Wait, to edit questions we need correct options. Let's make sure the admin
        // can view and edit the questions including the correct options. We will fetch with an admin header or param!
        // Wait! In server.js, the endpoint /api/exams/:id does strip it, but let's see if we can get it from the full db
        // or check if there is an issue. Ah, wait! The admin can see everything. In server.js:
        // app.get('/api/exams/:id') strips correct. If the admin wants to edit it, how does the admin get the correct answer?
        // Wait! In server.js, we did not write a separate admin endpoint, but we can easily fetch the raw db.json
        // or request the full details. Let's make a request or handle it. In our server.js, we can modify the API so
        // that if we pass headers `Authorization: Bearer admin_session_token`, we don't strip it. Or we can just
        // let the admin view/edit from a client cache or add a backend route. Let's check how server.js was written:
        // Line 116: app.get('/api/exams/:id') -> strips correct.
        // Wait, let's check if there is another endpoint. No, we only wrote that one. But wait, in a real app,
        // we can fetch the full exam if we pass the passcode or check role. Let's write a replace_file_content chunk
        // for `backend/server.js` later if needed, to support a header check like `req.headers.authorization === 'admin'`.
        // Let's check: in `backend/server.js`, let's see if we can read/write the full exams. Yes, the POST /api/exams
        // and PUT /api/exams/:id receive the full questions list and write it to db.json. So the backend supports it.
        // Let's modify the GET /api/exams/:id in `backend/server.js` so it checks for headers!
        // Yes! Let's do that to make the system secure: students get sanitized, admin gets full questions.
      }
    } catch (e) {
      console.error("Error fetching admin exams", e);
    }
  };

  // Tab-switching Blur/Focus handler
  useEffect(() => {
    if (mode !== 'exam') return;

    const handleWindowBlur = () => {
      blurTimeRef.current = Date.now();
    };

    const handleWindowFocus = () => {
      if (blurTimeRef.current) {
        const timeAwaySec = Math.round((Date.now() - blurTimeRef.current) / 1000);
        if (timeAwaySec >= 1) {
          const logEntry = {
            awayAt: new Date(blurTimeRef.current).toISOString(),
            backAt: new Date().toISOString(),
            durationSeconds: timeAwaySec
          };

          setTabSwitches((prev) => {
            const nextCount = prev + 1;
            if (nextCount >= settings.maxTabSwitches) {
              setAutoSubmittedDueToCheating(true);
              setTimeout(() => {
                triggerAutoSubmission(nextCount, [...tabSwitchLogs, logEntry]);
              }, 100);
            } else {
              setShowCheatWarning(true);
            }
            return nextCount;
          });

          setTabSwitchLogs((prev) => [...prev, logEntry]);
        }
        blurTimeRef.current = null;
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [mode, settings, tabSwitchLogs]);

  // Timer Effect
  useEffect(() => {
    if (mode === 'exam') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  // Audio TTS Engine
  const playTTSAudio = (text, qId) => {
    // If speaking, stop
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    // Check play count limit
    const plays = audioPlayCount[qId] || 0;
    if (plays >= 2) {
      alert("You have reached the maximum playback limit (2 plays) for this listening question.");
      return;
    }

    // Speech synthesis configuration
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Set clean English voice
    utterance.rate = 0.9; // Normal slightly slower speaking speed for English test takers
    
    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioPlayCount(prev => ({
        ...prev,
        [qId]: plays + 1
      }));
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    speechUttRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop audio playing on question switch
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  }, [currentQuestionIndex]);

  // Start exam selection handler
  const handleStartExam = async (e) => {
    e.preventDefault();
    if (!studentInfo.name.trim() || !studentInfo.email.trim() || !selectedExamId) {
      alert("Please enter registration details and select an exam set.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/exams/${selectedExamId}`);
      if (!res.ok) throw new Error("Failed to load exam questions");
      const data = await res.json();
      
      setActiveExam(data);
      setAnswers({});
      setFlaggedQuestions(new Set());
      setTimeRemaining(data.duration);
      setTabSwitches(0);
      setTabSwitchLogs([]);
      setAudioPlayCount({});
      setExamStartTime(Date.now());
      setCurrentQuestionIndex(0);
      setAutoSubmittedDueToCheating(false);
      setShowCheatWarning(false);
      setMode('exam');
    } catch (err) {
      alert(`Error starting exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit exam due to cheating triggers
  const triggerAutoSubmission = async (finalSwitches, finalLogs) => {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();

    const timeTakenSeconds = Math.round((Date.now() - examStartTime) / 1000);
    const mins = Math.floor(timeTakenSeconds / 60);
    const secs = timeTakenSeconds % 60;
    const timeSpent = `${mins}m ${secs}s (Auto-submitted)`;

    const submissionPayload = {
      examId: activeExam.id,
      studentName: studentInfo.name,
      studentEmail: studentInfo.email,
      studentId: studentInfo.id || 'N/A',
      timeSpent,
      tabSwitches: finalSwitches,
      tabSwitchLogs: finalLogs,
      answers,
      autoSubmitted: true
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
      const data = await res.json();
      setSubmissionResult(data.submission);
      setMode('finished');
    } catch (e) {
      console.error(e);
      alert("Error saving exam submission. Your session is finished.");
    } finally {
      setLoading(false);
    }
  };

  // Manual submission or timeout submit
  const submitExam = async (isTimeout = false) => {
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();

    const timeTakenSeconds = Math.round((Date.now() - examStartTime) / 1000);
    const mins = Math.floor(timeTakenSeconds / 60);
    const secs = timeTakenSeconds % 60;
    const timeSpent = `${mins}m ${secs}s${isTimeout ? ' (Timeout)' : ''}`;

    const submissionPayload = {
      examId: activeExam.id,
      studentName: studentInfo.name,
      studentEmail: studentInfo.email,
      studentId: studentInfo.id || 'N/A',
      timeSpent,
      tabSwitches,
      tabSwitchLogs,
      answers,
      autoSubmitted: false
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
      const data = await res.json();
      setSubmissionResult(data.submission);
      setMode('finished');
    } catch (e) {
      console.error(e);
      alert("Error saving exam submission.");
    } finally {
      setLoading(false);
    }
  };

  // Admin login handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', passcode: passcodeAttempt })
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('opt_admin_token', data.token);
        setAdminAuthenticated(true);
        setPasscodeError('');
        fetchSubmissions();
        loadAllAdminExamsData();
      } else {
        const data = await res.json();
        setPasscodeError(data.message || 'Verification failed');
      }
    } catch (err) {
      setPasscodeError("Server connectivity issue.");
    } finally {
      setLoading(false);
    }
  };

  // Load raw exams data (without answers stripped) for admin panel
  const loadAllAdminExamsData = async () => {
    try {
      const res = await fetch(`${API_BASE}/exams`);
      const list = await res.json();
      const loaded = [];
      for (const e of list) {
        const fullRes = await fetch(`${API_BASE}/exams/${e.id}`, {
          headers: { 'Authorization': 'admin' } // we will verify this header on backend
        });
        const fullData = await fullRes.json();
        loaded.push(fullData);
      }
      setAdminExams(loaded);
    } catch (e) {
      console.error(e);
    }
  };

  // Admin log out
  const handleAdminLogout = () => {
    sessionStorage.removeItem('opt_admin_token');
    setAdminAuthenticated(false);
    setMode('welcome');
  };

  // Admin settings update
  const handleUpdateSettings = async (switches, passcode) => {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxTabSwitches: switches, adminPasscode: passcode })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setAdminSettingsOpen(false);
        alert("Settings updated successfully!");
      }
    } catch (e) {
      alert("Failed to save settings.");
    }
  };

  // Admin: Delete Submission
  const handleDeleteSub = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    try {
      const res = await fetch(`${API_BASE}/submissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdminSubmissions(prev => prev.filter(s => s.id !== id));
        if (selectedSubmission && selectedSubmission.id === id) {
          setSelectedSubmission(null);
        }
      }
    } catch (e) {
      alert("Failed to delete submission.");
    }
  };

  // Admin: Delete Exam set
  const handleDeleteExam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complete Exam set? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdminExams(prev => prev.filter(e => e.id !== id));
        fetchExams();
      }
    } catch (e) {
      alert("Failed to delete exam set.");
    }
  };

  // Admin: Save/Create Exam set
  const handleSaveExamSet = async (e) => {
    e.preventDefault();
    const title = editingExam.title;
    const desc = editingExam.description;
    const dur = Number(editingExam.duration);

    if (!title || !dur) return;

    const payload = {
      title,
      description: desc,
      duration: dur,
      isActive: editingExam.isActive !== false, // Default true
      questions: editingExam.questions || []
    };

    try {
      let res;
      if (editingExam.id && !editingExam.id.startsWith('new_')) {
        // Edit existing
        res = await fetch(`${API_BASE}/exams/${editingExam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new
        res = await fetch(`${API_BASE}/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        alert("Exam set saved successfully!");
        setEditingExam(null);
        loadAllAdminExamsData();
        fetchExams();
      }
    } catch (e) {
      alert("Error saving exam set.");
    }
  };

  // Admin: Save question edits
  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!editingQuestion.text && !editingQuestion.question) {
      alert("Question text is required.");
      return;
    }

    const updatedQuestions = [...(editingExam.questions || [])];
    
    // Format options dictionary
    const opts = {
      a: editingQuestion.options.a || '',
      b: editingQuestion.options.b || '',
      c: editingQuestion.options.c || '',
      d: editingQuestion.options.d || ''
    };

    const formattedQ = {
      ...editingQuestion,
      text: editingQuestion.text || editingQuestion.question,
      options: opts
    };

    if (editingQuestion.isNew) {
      formattedQ.id = 'q_' + Date.now();
      delete formattedQ.isNew;
      updatedQuestions.push(formattedQ);
    } else {
      const idx = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
      if (idx !== -1) {
        updatedQuestions[idx] = formattedQ;
      }
    }

    setEditingExam({
      ...editingExam,
      questions: updatedQuestions
    });
    setEditingQuestion(null);
  };

  // Export submissions to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Email,Student ID,Date,Exam Taken,Score,Total Questions,Percentage,CEFR Level,Tab Switches,Recommendation\n";
    
    adminSubmissions.forEach((s) => {
      const pct = ((s.score / s.totalQuestions) * 100).toFixed(1);
      const row = `"${s.studentName}","${s.studentEmail}","${s.studentId}","${formatDate(s.date)}","${s.examTitle}",${s.score},${s.totalQuestions},${pct}%,"${s.cefrLevel}",${s.tabSwitches},"${s.recommendation}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "OPT_CEFR_Evaluations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Question navigation helpers
  const handleNextQ = () => {
    if (activeExam && currentQuestionIndex < activeExam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQ = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const renderNavbar = () => {
    return (
      <header className="topbar">
        <a href="#" className="topbar-logo" onClick={() => { if (mode !== 'exam') setMode('welcome'); }}>
          <Shield size={24} />
          <span>Oxford CEFR Evaluator</span>
        </a>
        <div className="topbar-actions">
          {mode !== 'exam' && (
            <>
              {mode !== 'admin' ? (
                <button className="btn btn-secondary btn-sm" onClick={() => { setMode('admin'); setPasscodeAttempt(''); setPasscodeError(''); }}>
                  Admin Panel
                </button>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={handleAdminLogout}>
                  <LogOut size={14} />
                  <span>Log Out Admin</span>
                </button>
              )}
            </>
          )}
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', padding: '8px', width: '36px', height: '36px' }}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>
    );
  };

  // Welcome / Exam selection screen
  const renderWelcomeScreen = () => {
    return (
      <div className="welcome-container">
        <div className="card welcome-card">
          <div className="welcome-logo-container">
            <BookOpen size={40} />
          </div>
          <h1 style={{ fontSize: '32px', margin: '0 0 12px 0' }}>Oxford Placement Examination</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            CEFR Level Evaluation system for University Interview Screening. Complete listening, grammar, and reading assessments to resolve your official grade.
          </p>

          <form onSubmit={handleStartExam} style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                placeholder="e.g. Jane Doe"
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                required 
                className="form-input" 
                placeholder="e.g. jane.doe@email.com"
                value={studentInfo.email}
                onChange={(e) => setStudentInfo({ ...studentInfo, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student / Reference ID (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. REF-2026-9"
                value={studentInfo.id}
                onChange={(e) => setStudentInfo({ ...studentInfo, id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Exam Set</label>
              {availableExams.filter(ex => ex.isActive !== false).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active exam sets configured on backend server.</div>
              ) : (
                <select 
                  className="form-input" 
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  style={{ height: '48px', padding: '0 16px' }}
                >
                  {availableExams.filter(ex => ex.isActive !== false).map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.questionCount} Questions - {Math.round(ex.duration / 60)} Mins)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="rules-list">
              <h3 style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--text-primary)' }}>Official Assessment Policy:</h3>
              <li>
                <Clock size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Timed Session:</strong> The exam will automatically close when the timer expires.</span>
              </li>
              <li>
                <Volume2 size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Listening Tasks:</strong> Contains audio tasks. You may play the audio a maximum of <strong>2 times</strong>.</span>
              </li>
              <li>
                <ShieldAlert size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Window Lock:</strong> Leaving the exam window triggers an auto-submit. Maximum of <strong>{settings.maxTabSwitches}</strong> switches.</span>
              </li>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '12px' }} disabled={loading || availableExams.length === 0}>
              {loading ? 'Initializing Session...' : 'Begin Assessment'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Screen 2: Student Active Exam Workspace
  const renderExamScreen = () => {
    if (!activeExam || !activeExam.questions || activeExam.questions.length === 0) return null;
    const questions = activeExam.questions;
    const activeQuestion = questions[currentQuestionIndex];
    if (!activeQuestion) return null;

    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === questions.length - 1;

    // Filter counts
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="layout-grid">
        {/* Header bar */}
        <div className="exam-header">
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{activeExam.title}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Candidate: {studentInfo.name} | ID: {studentInfo.id || 'N/A'}</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className={`exam-timer-card ${timeRemaining < 300 ? 'time-critical' : ''}`}>
              <Clock size={20} />
              <span>{formatTimer(timeRemaining)}</span>
            </div>
            
            <button className="btn btn-danger btn-sm" onClick={() => setShowSubmitConfirm(true)}>
              Submit Assessment
            </button>
          </div>
        </div>

        {/* Question Panel */}
        <div className="card" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div className="question-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {activeQuestion.section === 'use_of_english' ? 'Use of English Part 1' : 
                 activeQuestion.section === 'listening' ? 'Use of English Part 2' : 
                 activeQuestion.section === 'reading' ? 'Use of English Part 3' : 
                 activeQuestion.section.replace(/_/g, ' ')} Task
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Listening Dialogue Display */}
            {activeQuestion.section === 'listening' && activeQuestion.dialogue && (
              <div className="dialogue-box">
                {activeQuestion.dialogue}
              </div>
            )}

            {/* Reading passage display (Split Layout) */}
            {activeQuestion.passage ? (
              <div className="split-pane">
                <div className="passage-pane">
                  <h3 style={{ marginBottom: '10px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Reading Comprehension Passage</h3>
                  <p style={{ whiteSpace: 'pre-line' }}>{activeQuestion.passage}</p>
                </div>
                <div className="questions-pane">
                  <h2 className="question-text">{currentQuestionIndex + 1}. {activeQuestion.text}</h2>
                  
                  {activeQuestion.type === 'fill_in_the_blank' ? (
                    <div style={{ marginTop: '20px' }}>
                      <label className="form-label">Type your answer:</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ width: '100%', marginTop: '8px' }}
                        placeholder="Enter the missing word..."
                        value={answers[activeQuestion.id] || ''}
                        onChange={(e) => handleSelectAnswer(activeQuestion.id, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="options-grid">
                      {activeQuestion.options && Object.entries(activeQuestion.options).map(([key, val]) => {
                        if (!val) return null;
                        return (
                          <div 
                            key={key} 
                            className={`option-card ${answers[activeQuestion.id] === key ? 'selected' : ''}`}
                            onClick={() => handleSelectAnswer(activeQuestion.id, key)}
                          >
                            <div className="option-letter">{key.toUpperCase()}</div>
                            <div className="option-val">{val}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Standard Layout for grammar & listening
              <>
                <h2 className="question-text" style={{ marginTop: '16px' }}>
                  {currentQuestionIndex + 1}. {activeQuestion.text}
                </h2>

                {activeQuestion.type === 'fill_in_the_blank' ? (
                  <div style={{ marginTop: '20px' }}>
                    <label className="form-label">Type your answer:</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%', marginTop: '8px', maxWidth: '400px' }}
                      placeholder="Enter the missing word..."
                      value={answers[activeQuestion.id] || ''}
                      onChange={(e) => handleSelectAnswer(activeQuestion.id, e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="options-grid" style={{ marginTop: '20px' }}>
                    {activeQuestion.options && Object.entries(activeQuestion.options).map(([key, val]) => {
                      if (!val) return null;
                      return (
                        <div 
                          key={key} 
                          className={`option-card ${answers[activeQuestion.id] === key ? 'selected' : ''}`}
                          onClick={() => handleSelectAnswer(activeQuestion.id, key)}
                        >
                          <div className="option-letter">{key.toUpperCase()}</div>
                          <div className="option-val">{val}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary" onClick={handlePrevQ} disabled={isFirst}>
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button 
              className={`btn ${flaggedQuestions.has(activeQuestion.id) ? 'btn-warning' : 'btn-secondary'}`}
              onClick={() => toggleFlagQuestion(activeQuestion.id)}
            >
              <Bookmark size={16} fill={flaggedQuestions.has(activeQuestion.id) ? 'currentColor' : 'none'} />
              <span>{flaggedQuestions.has(activeQuestion.id) ? 'Flagged' : 'Flag Question'}</span>
            </button>

            <button className="btn btn-primary" onClick={handleNextQ} disabled={isLast}>
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar-panel">
          <div className="card">
            <h3 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Exam Navigation</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {answeredCount}/{questions.length} Answered
              </span>
            </h3>

            <div className="question-grid">
              {questions.map((q, idx) => {
                let status = '';
                if (idx === currentQuestionIndex) status = 'current';
                else if (flaggedQuestions.has(q.id)) status = 'flagged';
                else if (answers[q.id]) status = 'answered';

                return (
                  <button 
                    key={q.id}
                    className={`question-grid-btn ${status}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="legend" style={{ marginTop: '20px' }}>
              <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)' }}></div><span>Answered</span></div>
              <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: 'var(--warning-light)', borderColor: 'var(--warning)' }}></div><span>Flagged</span></div>
              <div className="legend-item"><div className="legend-dot" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}></div><span>Unanswered</span></div>
              <div className="legend-item"><div className="legend-dot" style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--bg-card)' }}></div><span>Current</span></div>
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '4px' }}>
              <Shield size={16} />
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Integrity Shield Active</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Tab shifts are actively logged. Switch count: <strong>{tabSwitches} / {settings.maxTabSwitches}</strong>.
            </p>
          </div>
        </div>

        {/* Cheat modal */}
        {showCheatWarning && (
          <div className="overlay">
            <div className="modal-content cheat-warning-modal">
              <div className="cheat-icon-container">
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '20px' }}>Tab Exit Detected!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                Warning: You have exited the test screen. This incident has been flagged. 
                You have <strong>{settings.maxTabSwitches - tabSwitches}</strong> warnings remaining before automatic test closure.
              </p>
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setShowCheatWarning(false)}>
                Return & Continue Exam
              </button>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="overlay">
            <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
              <div className="welcome-logo-container" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', margin: '0 auto 16px' }}>
                <CheckSquare size={32} />
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Confirm Submission</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                Are you sure you want to finish and submit your exam? You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowSubmitConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { setShowSubmitConfirm(false); submitExam(); }}>
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Screen 3: Test finished results summary (CEFR Level Displayed)
  const renderFinishedScreen = () => {
    if (!submissionResult) return null;
    const answeredCount = Object.keys(answers).length;

    // CEFR Level Color mappings
    let gradeColor = 'var(--primary)';
    if (submissionResult.cefrLevel.startsWith('C')) gradeColor = 'var(--success)';
    else if (submissionResult.cefrLevel.startsWith('B')) gradeColor = 'var(--info)';
    else if (submissionResult.cefrLevel.startsWith('A')) gradeColor = 'var(--warning)';

    return (
      <div className="welcome-container">
        <div className="card welcome-card" style={{ maxWidth: '580px' }}>
          <div className="welcome-logo-container" style={{ backgroundColor: autoSubmittedDueToCheating ? 'var(--danger-light)' : 'var(--success-light)', color: autoSubmittedDueToCheating ? 'var(--danger)' : 'var(--success)' }}>
            {autoSubmittedDueToCheating ? <ShieldAlert size={40} /> : <CheckCircle size={40} />}
          </div>

          <h1 style={{ fontSize: '28px', margin: '0 0 12px 0' }}>
            {autoSubmittedDueToCheating ? 'Exam Auto-Submitted' : 'Assessment Finished'}
          </h1>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            {autoSubmittedDueToCheating ? (
              <span style={{ color: 'var(--danger)', fontWeight: '600' }}>
                Your exam session was terminated because you exceeded the allowed tab warnings.
              </span>
            ) : (
              "Your Oxford Placement Test answers have been successfully uploaded and processed."
            )}
          </p>

          {/* CEFR Grade Badge Display */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', backgroundColor: 'var(--bg-app)', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)' }}>Resolved CEFR Level</span>
            <div style={{ fontSize: '56px', fontWeight: 900, color: gradeColor, margin: '8px 0', lineHeight: 1 }}>
              {submissionResult.cefrLevel.split(' ')[0]}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              {submissionResult.cefrLevel}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '12px' }}>
              <div>Score: <strong>{submissionResult.score} / {submissionResult.totalQuestions}</strong></div>
              <div>Tab Switches: <strong style={{ color: tabSwitches > 0 ? 'var(--danger)' : 'inherit' }}>{tabSwitches}</strong></div>
            </div>
          </div>

          {/* University Recommendation Card */}
          <div className={`recommendation-card ${
            submissionResult.recommendation === 'Highly Recommended' ? 'highly-recommended' :
            submissionResult.recommendation === 'Recommended' ? 'recommended' :
            submissionResult.recommendation === 'Borderline' ? 'borderline' : 'rejected'
          }`} style={{ textAlign: 'left', marginBottom: '24px' }}>
            <Award size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                University Screening Recommendation: {submissionResult.recommendation}
              </h4>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-primary)' }}>
                {submissionResult.notes}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMode('welcome')}>
              Return Home
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setMode('admin'); setPasscodeAttempt(''); setPasscodeError(''); }}>
              Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Screen 4: Admin Dashboard Workspace
  const renderAdminScreen = () => {
    // Separate Admin login check
    if (!adminAuthenticated) {
      return (
        <div className="welcome-container">
          <div className="card welcome-card" style={{ maxWidth: '400px' }}>
            <div className="welcome-logo-container">
              <Shield size={36} />
            </div>
            <h2 style={{ marginBottom: '8px', fontSize: '22px' }}>Admin Verification</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Enter backend system passcode to configure assessments and audit student CEFR grades.
            </p>
            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <input 
                  type="password"
                  required
                  className="form-input"
                  placeholder="Enter Passcode"
                  value={passcodeAttempt}
                  onChange={(e) => setPasscodeAttempt(e.target.value)}
                  style={{ textAlign: 'center' }}
                />
              </div>
              {passcodeError && (
                <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>
                  {passcodeError}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Verify Passcode'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Submissions search and filters
    const filteredSubmissions = adminSubmissions.filter(s => {
      const matchSearch = s.studentName.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          s.studentEmail.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          s.studentId.toLowerCase().includes(adminSearch.toLowerCase());
      
      const matchRec = adminFilterRec === 'all' || 
                       (adminFilterRec === 'highly-recommended' && s.recommendation === 'Highly Recommended') ||
                       (adminFilterRec === 'recommended' && s.recommendation === 'Recommended') ||
                       (adminFilterRec === 'borderline' && s.recommendation === 'Borderline') ||
                       (adminFilterRec === 'rejected' && (s.recommendation === 'Flagged / Rejected' || s.recommendation === 'Not Recommended'));

      const matchIntegrity = adminFilterIntegrity === 'all' ||
                            (adminFilterIntegrity === 'honest' && s.tabSwitches === 0) ||
                            (adminFilterIntegrity === 'flagged' && s.tabSwitches > 0);

      return matchSearch && matchRec && matchIntegrity;
    });

    // Submissions Stats
    const totalTested = adminSubmissions.length;
    const flaggedCheatingCount = adminSubmissions.filter(s => s.tabSwitches > 0).length;
    const readyCount = adminSubmissions.filter(s => s.recommendation === 'Highly Recommended' || s.recommendation === 'Recommended').length;
    
    // Average score percent
    const avgScorePct = totalTested > 0 
      ? (adminSubmissions.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / totalTested * 100) 
      : 0;

    return (
      <div className="container" style={{ padding: '32px 20px' }}>
        
        {/* Title bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: 0 }}>University Evaluation Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Set questions, configure multiple placement exam sets, and audit student CEFR grades.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setAdminSettingsOpen(true)}>
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dashboard Tabs Toggle */}
        <div className="section-tabs" style={{ width: 'fit-content', marginBottom: '24px', padding: '4px' }}>
          <button 
            className={`section-tab-btn ${activeAdminTab === 'results' ? 'active' : ''}`}
            onClick={() => { setActiveAdminTab('results'); fetchSubmissions(); }}
            style={{ padding: '8px 24px' }}
          >
            Student Results
          </button>
          <button 
            className={`section-tab-btn ${activeAdminTab === 'exams' ? 'active' : ''}`}
            onClick={() => { setActiveAdminTab('exams'); loadAllAdminExamsData(); }}
            style={{ padding: '8px 24px' }}
          >
            Manage Exam Sets
          </button>
        </div>

        {/* Tab 1: Student Results Dashboard */}
        {activeAdminTab === 'results' && (
          <>
            {/* KPI Stats */}
            <div className="admin-grid" style={{ marginBottom: '24px' }}>
              <div className="card stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}><User size={22} /></div>
                <div><div className="stat-number">{totalTested}</div><div className="stat-label">Total Tested</div></div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}><Award size={22} /></div>
                <div><div className="stat-number">{avgScorePct.toFixed(1)}%</div><div className="stat-label">Average Score</div></div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}><AlertTriangle size={22} /></div>
                <div><div className="stat-number">{flaggedCheatingCount}</div><div className="stat-label">Flagged Blur Logs</div></div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}><CheckCircle size={22} /></div>
                <div><div className="stat-number">{readyCount}</div><div className="stat-label">Interview Eligible</div></div>
              </div>
            </div>

            {/* Results Filters Table */}
            <div className="card">
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search by name, email, student ID..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
                
                <select className="form-input" value={adminFilterRec} onChange={(e) => setAdminFilterRec(e.target.value)} style={{ height: '45px' }}>
                  <option value="all">All Recommendations</option>
                  <option value="highly-recommended">Highly Recommended</option>
                  <option value="recommended">Recommended</option>
                  <option value="borderline">Borderline</option>
                  <option value="rejected">Rejected / Flagged</option>
                </select>

                <select className="form-input" value={adminFilterIntegrity} onChange={(e) => setAdminFilterIntegrity(e.target.value)} style={{ height: '45px' }}>
                  <option value="all">All Integrity Statuses</option>
                  <option value="honest">Honest (0 Tab Switches)</option>
                  <option value="flagged">Flagged (&gt;0 Tab Switches)</option>
                </select>
              </div>

              {/* Table list */}
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Info</th>
                      <th>Exam Set</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>CEFR Level</th>
                      <th>Tab Switches</th>
                      <th>Recommendation</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No student submissions found matching the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => {
                        const pct = ((sub.score / sub.totalQuestions) * 100).toFixed(1);
                        let badgeC = 'badge-success';
                        if (sub.recommendation === 'Recommended') badgeC = 'badge-info';
                        else if (sub.recommendation === 'Borderline') badgeC = 'badge-warning';
                        else if (sub.recommendation === 'Flagged / Rejected' || sub.recommendation === 'Not Recommended') badgeC = 'badge-danger';

                        // CEFR Level label badge color
                        let cefrBadgeC = 'badge-primary';
                        if (sub.cefrLevel.startsWith('C')) cefrBadgeC = 'badge-success';
                        else if (sub.cefrLevel.startsWith('B')) cefrBadgeC = 'badge-info';
                        else if (sub.cefrLevel.startsWith('A')) cefrBadgeC = 'badge-warning';

                        return (
                          <tr key={sub.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedSubmission(sub)}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{sub.studentName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {sub.studentId} | {sub.studentEmail}</div>
                            </td>
                            <td><div style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.examTitle}>{sub.examTitle}</div></td>
                            <td>{formatDate(sub.date)}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{sub.score} / {sub.totalQuestions}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({pct}%)</div>
                            </td>
                            <td><span className={`badge ${cefrBadgeC}`}>{sub.cefrLevel.split(' ')[0]}</span></td>
                            <td>
                              {sub.tabSwitches > 0 ? (
                                <span style={{ color: 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={14} />
                                  {sub.tabSwitches} switches
                                </span>
                              ) : (
                                <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={14} />
                                  0
                                </span>
                              )}
                            </td>
                            <td><span className={`badge ${badgeC}`}>{sub.recommendation}</span></td>
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedSubmission(sub)}>View</button>
                                <button className="btn btn-danger btn-sm" style={{ padding: '6px' }} onClick={() => handleDeleteSub(sub.id)}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Manage Exam Sets Panel */}
        {activeAdminTab === 'exams' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Configured Exam Sets ({adminExams.length})</h3>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => setEditingExam({ id: 'new_' + Date.now(), title: '', description: '', duration: 1800, questions: [] })}
              >
                <Plus size={16} />
                <span>Create Exam Set</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Exam Set Title</th>
                    <th>Description</th>
                    <th>Duration</th>
                    <th>Questions Count</th>
                    <th>Active</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminExams.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No exam sets configured yet. Click 'Create Exam Set' to start.
                      </td>
                    </tr>
                  ) : (
                    adminExams.map((ex) => (
                      <tr key={ex.id}>
                        <td style={{ fontWeight: 600 }}>{ex.title}</td>
                        <td><div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.description}>{ex.description || 'No description'}</div></td>
                        <td>{Math.round(ex.duration / 60)} minutes</td>
                        <td>
                          <span className="badge badge-primary">{ex.questions ? ex.questions.length : 0} Qs</span>
                        </td>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={ex.isActive !== false} 
                            onChange={async (e) => {
                              const updated = { ...ex, isActive: e.target.checked };
                              try {
                                await fetch(`${API_BASE}/exams/${ex.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(updated)
                                });
                                loadAllAdminExamsData();
                                fetchExams();
                              } catch(err) {}
                            }} 
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => setEditingExam(ex)}
                            >
                              <Edit size={14} />
                              <span>Configure & Questions</span>
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              style={{ padding: '6px' }}
                              onClick={() => handleDeleteExam(ex.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Student Profile Detail Modal */}
        {selectedSubmission && (
          <div className="overlay">
            <div className="modal-content modal-content-large">
              <div className="modal-header">
                <div>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>Candidate Report: {selectedSubmission.studentName}</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    ID: {selectedSubmission.studentId} | Email: {selectedSubmission.studentEmail} | Test: {selectedSubmission.examTitle}
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedSubmission(null)}>Close</button>
              </div>

              <div className="modal-body">
                {/* Score & Recommendation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>CEFR Level Graded</span>
                    <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--primary)', margin: '4px 0' }}>
                      {selectedSubmission.cefrLevel.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Score: {selectedSubmission.score} / {selectedSubmission.totalQuestions} ({((selectedSubmission.score / selectedSubmission.totalQuestions) * 100).toFixed(1)}%)
                    </div>
                  </div>

                  <div className={`recommendation-card ${
                    selectedSubmission.recommendation === 'Highly Recommended' ? 'highly-recommended' :
                    selectedSubmission.recommendation === 'Recommended' ? 'recommended' :
                    selectedSubmission.recommendation === 'Borderline' ? 'borderline' : 'rejected'
                  }`} style={{ margin: 0 }}>
                    <Award size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                        University Recommendation: {selectedSubmission.recommendation}
                      </h4>
                      <p style={{ fontSize: '13px', margin: 0 }}>
                        {selectedSubmission.notes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit & Logs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* Integrity Audit */}
                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Window-switching Integrity Audit</span>
                      <span className={`badge ${selectedSubmission.tabSwitches > 0 ? 'badge-danger' : 'badge-success'}`}>
                        {selectedSubmission.tabSwitches} Switches
                      </span>
                    </h3>

                    {selectedSubmission.tabSwitches === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--success)' }}>
                        <CheckCircle size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Candidate remained focused on exam for full duration.</span>
                      </div>
                    ) : (
                      <div>
                        <div className="log-list">
                          {selectedSubmission.tabSwitchLogs.map((log, idx) => (
                            <div key={idx} className="log-item">
                              <div><span style={{ color: 'var(--danger)', fontWeight: 600 }}>Blur:</span> {new Date(log.awayAt).toLocaleTimeString()}</div>
                              <div><span style={{ color: 'var(--success)', fontWeight: 600 }}>Focus:</span> {new Date(log.backAt).toLocaleTimeString()}</div>
                              <div><strong>{log.durationSeconds}s away</strong></div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '8px', fontWeight: 600 }}>
                          * Total out-of-focus duration: {selectedSubmission.tabSwitchLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0)} seconds.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section analysis breakdown */}
                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                      Assessment Performance Breakdown
                    </h3>
                    
                    {(() => {
                      // Dynamically count correct answers per category for the selected submission
                      // We must do this by mapping the exam questions
                      // Let's get the exam configuration
                      const examObj = adminExams.find(ex => ex.id === selectedSubmission.examId);
                      if (!examObj) return <div>Exam set definition has been deleted.</div>;

                      let grammarC = 0, grammarT = 0;
                      let listeningC = 0, listeningT = 0;
                      let readingC = 0, readingT = 0;

                      examObj.questions.forEach(q => {
                        const isCorrect = selectedSubmission.answers[q.id] && selectedSubmission.answers[q.id].toLowerCase() === q.correct.toLowerCase();
                        
                        if (q.section === 'use_of_english') {
                          grammarT++;
                          if (isCorrect) grammarC++;
                        } else if (q.section === 'listening') {
                          listeningT++;
                          if (isCorrect) listeningC++;
                        } else if (q.section === 'reading') {
                          readingT++;
                          if (isCorrect) readingC++;
                        }
                      });

                      const renderPBar = (title, correct, total, color) => {
                        if (total === 0) return null;
                        const pct = (correct / total) * 100;
                        return (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                              <span>{title}</span>
                              <strong>{correct}/{total} ({pct.toFixed(0)}%)</strong>
                            </div>
                            <div style={{ height: '6px', background: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderPBar("Grammar & Vocabulary", grammarC, grammarT, "var(--primary)")}
                          {renderPBar("Listening Comprehension", listeningC, listeningT, "var(--info)")}
                          {renderPBar("Reading Comprehension", readingC, readingT, "var(--success)")}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Submissions Detail Responses bank */}
                <div className="card" style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    Student Response Verification
                  </h3>
                  {(() => {
                    const examObj = adminExams.find(ex => ex.id === selectedSubmission.examId);
                    if (!examObj) return <div>No exam questions matching to verify.</div>;
                    
                    return (
                      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {examObj.questions.map((q, idx) => {
                          const ans = selectedSubmission.answers[q.id] || '-';
                          const isCorrect = ans.toLowerCase() === q.correct.toLowerCase();

                          // Get the display text for student's answer
                          const studentAnswerDisplay = q.options && q.options[ans] 
                            ? `${ans.toUpperCase()}) ${q.options[ans]}` 
                            : ans.toUpperCase();

                          // Get the display text for correct answer
                          const correctAnswerDisplay = q.options && q.options[q.correct] 
                            ? `${q.correct.toUpperCase()}) ${q.options[q.correct]}` 
                            : q.correct.toUpperCase();

                          // Section label
                          const sectionLabel = q.section === 'use_of_english' ? 'Part 1' : 
                                               q.section === 'listening' ? 'Part 2' : 
                                               q.section === 'reading' ? 'Part 3' : q.section;

                          return (
                            <div key={q.id} style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: '8px', borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                  Q{idx + 1} <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '6px' }}>{isCorrect ? 'Correct' : 'Wrong'}</span>
                                </span>
                                <span className="badge badge-primary" style={{ fontSize: '11px' }}>{sectionLabel}</span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                                {q.text}
                              </div>
                              {q.dialogue && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid var(--info)', marginBottom: '8px' }}>
                                  {q.dialogue}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '4px' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Student: </span>
                                  <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>{studentAnswerDisplay}</strong>
                                </div>
                                {!isCorrect && (
                                  <div>
                                    <span style={{ color: 'var(--text-muted)' }}>Correct: </span>
                                    <strong style={{ color: 'var(--success)' }}>{correctAnswerDisplay}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>Close Report</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin: Exam / Question Editor Modal */}
        {editingExam && (
          <div className="overlay">
            <div className="modal-content modal-content-large" style={{ maxWidth: '850px' }}>
              <div className="modal-header">
                <h2 style={{ fontSize: '18px' }}>
                  {editingExam.id.startsWith('new_') ? 'Create New Exam Set' : `Configure Exam: ${editingExam.title}`}
                </h2>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingExam(null)}>×</button>
              </div>

              <form onSubmit={handleSaveExamSet}>
                <div className="modal-body" style={{ maxHeight: '70vh' }}>
                  {/* Meta details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Exam Set Title</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input"
                        placeholder="e.g. Oxford Placement Test - Set C"
                        value={editingExam.title}
                        onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration Limit (minutes)</label>
                      <input 
                        type="number" 
                        required 
                        className="form-input"
                        placeholder="e.g. 60"
                        value={Math.round(editingExam.duration / 60)}
                        onChange={(e) => setEditingExam({ ...editingExam, duration: Number(e.target.value) * 60 })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">Exam Description</label>
                    <textarea 
                      className="form-input"
                      placeholder="Enter exam description details..."
                      rows="2"
                      value={editingExam.description}
                      onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '12px 16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <input 
                      type="checkbox" 
                      id="examIsActiveEditor" 
                      checked={editingExam.isActive !== false}
                      onChange={(e) => setEditingExam({ ...editingExam, isActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="examIsActiveEditor" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                      Enable this exam for student selection
                    </label>
                  </div>

                  {/* Questions Editor Table */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '15px' }}>Questions Bank ({editingExam.questions ? editingExam.questions.length : 0} Qs)</h3>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingQuestion({
                        id: 'new_q_' + Date.now(),
                        isNew: true,
                        type: 'grammar',
                        section: 'use_of_english',
                        text: '',
                        passage: '',
                        audioText: '',
                        options: { a: '', b: '', c: '', d: '' },
                        correct: 'a'
                      })}
                    >
                      <PlusCircle size={14} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Question Info</th>
                          <th>Type</th>
                          <th>Correct Key</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!editingExam.questions || editingExam.questions.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                              No questions added to this set yet. Click 'Add Question'.
                            </td>
                          </tr>
                        ) : (
                          editingExam.questions.map((q, idx) => (
                            <tr key={q.id}>
                              <td>{idx + 1}</td>
                              <td>
                                <div style={{ fontSize: '13px', fontWeight: 600, maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={q.text || q.question}>
                                  {q.text || q.question}
                                </div>
                                {q.type === 'listening' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audio: {q.audioText}</div>}
                              </td>
                              <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{q.type}</span></td>
                              <td><strong style={{ color: 'var(--success)' }}>{q.correct ? q.correct.toUpperCase() : '-'}</strong></td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button 
                                    type="button" 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setEditingQuestion(q)}
                                    style={{ padding: '4px 8px' }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => {
                                      const updated = editingExam.questions.filter(item => item.id !== q.id);
                                      setEditingExam({ ...editingExam, questions: updated });
                                    }}
                                    style={{ padding: '4px' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingExam(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={!editingExam.title}>Save Exam Set</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin: Question Editor Sub-Modal */}
        {editingQuestion && (
          <div className="overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'left' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>{editingQuestion.isNew ? 'Add Question' : 'Edit Question Details'}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingQuestion(null)}>×</button>
              </div>

              <form onSubmit={handleSaveQuestion}>
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  
                  {/* Select Q Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Question Type</label>
                      <select 
                        className="form-input" 
                        value={editingQuestion.type}
                        onChange={(e) => {
                          const val = e.target.value;
                          let sec = 'use_of_english';
                          if (val === 'listening') sec = 'listening';
                          if (val === 'reading') sec = 'reading';
                          setEditingQuestion({ ...editingQuestion, type: val, section: sec });
                        }}
                      >
                        <option value="grammar">Grammar & Vocab (Use of English)</option>
                        <option value="listening">Listening Task</option>
                        <option value="reading">Reading Comprehension</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Correct Option Key</label>
                      <select 
                        className="form-input" 
                        value={editingQuestion.correct}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, correct: e.target.value })}
                      >
                        <option value="a">A</option>
                        <option value="b">B</option>
                        <option value="c">C</option>
                        <option value="d">D</option>
                      </select>
                    </div>
                  </div>

                  {/* Reading Passage Context */}
                  {editingQuestion.type === 'reading' && (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Reading Passage Text</label>
                      <textarea 
                        className="form-input" 
                        rows="4"
                        placeholder="Paste reading passage content here..."
                        value={editingQuestion.passage || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, passage: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Listening TTS Transcript */}
                  {editingQuestion.type === 'listening' && (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Audio Speech Transcript (TTS Text)</label>
                      <textarea 
                        className="form-input" 
                        rows="3"
                        placeholder="e.g. Man: Where is the train station? Woman: Go straight and turn left."
                        value={editingQuestion.audioText || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, audioText: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Question Prompt</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input"
                      placeholder="e.g. Select the word that fits in the sentence..."
                      value={editingQuestion.text || editingQuestion.question || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                    />
                  </div>

                  {/* MCQ Choices */}
                  <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--text-secondary)' }}>Multiple Choice Options:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Option A</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input"
                        placeholder="Choice A content"
                        value={editingQuestion.options ? editingQuestion.options.a : ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          options: { ...editingQuestion.options, a: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option B</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input"
                        placeholder="Choice B content"
                        value={editingQuestion.options ? editingQuestion.options.b : ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          options: { ...editingQuestion.options, b: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option C (Optional)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Choice C content"
                        value={editingQuestion.options ? editingQuestion.options.c : ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          options: { ...editingQuestion.options, c: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Option D (Optional)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Choice D content"
                        value={editingQuestion.options ? editingQuestion.options.d : ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          options: { ...editingQuestion.options, d: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingQuestion(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add/Save Question</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings modal */}
        {adminSettingsOpen && (
          <div className="overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'left' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>System Settings</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdminSettingsOpen(false)}>×</button>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Max Allowed Tab Blur Warns</label>
                <input 
                  type="number" 
                  className="form-input"
                  id="settings_switches_input"
                  defaultValue={settings.maxTabSwitches}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Portal Passcode</label>
                <input 
                  type="text" 
                  className="form-input"
                  id="settings_passcode_input"
                  defaultValue={settings.adminPasscode}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button className="btn btn-secondary" onClick={() => setAdminSettingsOpen(false)}>Cancel</button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const sw = Number(document.getElementById('settings_switches_input').value);
                    const pc = document.getElementById('settings_passcode_input').value;
                    if (sw >= 1 && pc.trim().length > 0) {
                      handleUpdateSettings(sw, pc);
                    } else {
                      alert("Enter valid configuration settings values.");
                    }
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const handleSelectAnswer = (qId, optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionKey
    }));
  };

  const toggleFlagQuestion = (qId) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  return (
    <>
      {renderNavbar()}
      {mode === 'welcome' && renderWelcomeScreen()}
      {mode === 'exam' && renderExamScreen()}
      {mode === 'finished' && renderFinishedScreen()}
      {mode === 'admin' && renderAdminScreen()}
      <footer style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Developed by Sazid
      </footer>
    </>
  );
}

export default App;
