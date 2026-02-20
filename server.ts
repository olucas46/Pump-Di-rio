import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    exercises JSON NOT NULL,
    cardio JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workout_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    date TEXT NOT NULL,
    exercises JSON NOT NULL,
    cardio JSON,
    completed_exercise_ids JSON,
    cardio_completed INTEGER DEFAULT 0,
    comments TEXT,
    rating TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  
  // Get Plans
  app.get('/api/plans/:userId', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC');
      const plans = stmt.all(req.params.userId);
      // Parse JSON fields
      const parsedPlans = plans.map((plan: any) => ({
        ...plan,
        exercises: JSON.parse(plan.exercises),
        cardio: plan.cardio ? JSON.parse(plan.cardio) : undefined
      }));
      res.json(parsedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  });

  // Create Plan
  app.post('/api/plans', (req, res) => {
    try {
      const { id, userId, name, exercises, cardio } = req.body;
      const stmt = db.prepare('INSERT INTO workout_plans (id, user_id, name, exercises, cardio) VALUES (?, ?, ?, ?, ?)');
      stmt.run(id, userId, name, JSON.stringify(exercises), cardio ? JSON.stringify(cardio) : null);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  });

  // Update Plan
  app.put('/api/plans/:id', (req, res) => {
    try {
      const { name, exercises, cardio } = req.body;
      const stmt = db.prepare('UPDATE workout_plans SET name = ?, exercises = ?, cardio = ? WHERE id = ?');
      stmt.run(name, JSON.stringify(exercises), cardio ? JSON.stringify(cardio) : null, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  });

  // Delete Plan
  app.delete('/api/plans/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM workout_plans WHERE id = ?');
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ error: 'Failed to delete plan' });
    }
  });

  // Get Logs
  app.get('/api/logs/:userId', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM workout_logs WHERE user_id = ? ORDER BY date DESC, created_at DESC');
      const logs = stmt.all(req.params.userId);
      const parsedLogs = logs.map((log: any) => ({
        ...log,
        exercises: JSON.parse(log.exercises),
        cardio: log.cardio ? JSON.parse(log.cardio) : undefined,
        completedExerciseIds: log.completed_exercise_ids ? JSON.parse(log.completed_exercise_ids) : [],
        cardioCompleted: !!log.cardio_completed,
        planId: log.plan_id,
        planName: log.plan_name
      }));
      res.json(parsedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // Create Log
  app.post('/api/logs', (req, res) => {
    try {
      const { id, userId, planId, planName, date, exercises, cardio, completedExerciseIds, cardioCompleted, comments, rating } = req.body;
      const stmt = db.prepare(`
        INSERT INTO workout_logs (id, user_id, plan_id, plan_name, date, exercises, cardio, completed_exercise_ids, cardio_completed, comments, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, userId, planId, planName, date,
        JSON.stringify(exercises),
        cardio ? JSON.stringify(cardio) : null,
        JSON.stringify(completedExerciseIds),
        cardioCompleted ? 1 : 0,
        comments,
        rating
      );
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error creating log:', error);
      res.status(500).json({ error: 'Failed to create log' });
    }
  });

  // Update Log (Partial update for comments/rating usually)
  app.put('/api/logs/:id', (req, res) => {
    try {
      const updates = req.body;
      const fields = [];
      const values = [];

      if (updates.comments !== undefined) {
        fields.push('comments = ?');
        values.push(updates.comments);
      }
      if (updates.rating !== undefined) {
        fields.push('rating = ?');
        values.push(updates.rating);
      }
      
      if (fields.length === 0) {
        return res.json({ success: true }); // Nothing to update
      }

      values.push(req.params.id);
      const stmt = db.prepare(`UPDATE workout_logs SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating log:', error);
      res.status(500).json({ error: 'Failed to update log' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
