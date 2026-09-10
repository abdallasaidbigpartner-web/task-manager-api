// Task Manager API - main server
// Ties together the type-safe data layer (TaskRepository), JWT
// authentication middleware, and Express REST endpoints.

import express, { Request, Response } from "express";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import { TaskRepository } from "./taskRepository";
import { createToken, requireAuth, AuthenticatedRequest } from "./auth";
import { UserCredentials } from "./types";

const app = express();
app.use(express.json());

const pool = new Pool({ database: "mydb", user: process.env.PGUSER || "u0_a392" });
const taskRepository = new TaskRepository(pool);

app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", version: "1.0.0" });
});

app.post("/register", async (req: Request, res: Response) => {
    const { username, password }: UserCredentials = req.body;

    if (!username || username.length < 3) {
        res.status(422).json({ error: "Username must be at least 3 characters" });
        return;
    }
    if (!password || password.length < 8) {
        res.status(422).json({ error: "Password must be at least 8 characters" });
        return;
    }

    const existing = await pool.query("SELECT id FROM ts_users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
        res.status(400).json({ error: "Username already exists" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        "INSERT INTO ts_users (username, password_hash) VALUES ($1, $2) RETURNING id",
        [username, hashedPassword]
    );

    res.json({ message: `User '${username}' registered successfully`, id: result.rows[0].id });
});

app.post("/login", async (req: Request, res: Response) => {
    const { username, password }: UserCredentials = req.body;

    const result = await pool.query("SELECT id, password_hash FROM ts_users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
    }

    const token = createToken({ userId: user.id, username });
    res.json({ token });
});

app.post("/tasks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
        res.status(422).json({ error: "Title is required" });
        return;
    }

    const task = await taskRepository.create(req.user!.userId, { title });
    res.json(task);
});

app.get("/tasks", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const tasks = await taskRepository.findAllForUser(req.user!.userId);
    res.json(tasks);
});

app.patch("/tasks/:id/complete", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string, 10);
    const task = await taskRepository.markComplete(taskId, req.user!.userId);

    if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
    }

    res.json(task);
});

app.delete("/tasks/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const taskId = parseInt(req.params.id as string, 10);
    const deleted = await taskRepository.delete(taskId, req.user!.userId);

    if (!deleted) {
        res.status(404).json({ error: "Task not found" });
        return;
    }

    res.status(204).send();
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Task Manager API running on port ${PORT}`);
    });
}

export { app, pool };
