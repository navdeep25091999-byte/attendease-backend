const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// Key: Allow your GitHub Pages domain for cross-origin requests
app.use(cors({
  origin: 'https://navdeep25091999-byte.github.io',
  credentials: true
}));

app.use(express.json());

// ---------- Data Models ----------
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  className: String
});
const Student = mongoose.model('Student', studentSchema);

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  date: { type: String, required: true }, // Format "2026-11-25"
  status: { type: String, enum: ['present', 'absent'], required: true }
});
// Ensure only one record per student per day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ---------- API Routes ----------

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Get all students
app.get('/api/students', async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// Add student
app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get attendance for a specific date
app.get('/api/attendance/:date', async (req, res) => {
  const records = await Attendance.find({ date: req.params.date }).populate('studentId');
  res.json(records);
});

// Mark attendance (present/absent)
app.post('/api/attendance', async (req, res) => {
  const { studentId, date, status } = req.body;
  try {
    const record = await Attendance.findOneAndUpdate(
      { studentId, date },
      { status },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));