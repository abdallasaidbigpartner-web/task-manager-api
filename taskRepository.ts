// Data access layer for tasks - encapsulates all SQL, so route
// handlers never touch the database directly. Demonstrates the
// Repository pattern, a standard professional architecture choice.

import { Pool } from "pg";
import { Task, NewTaskInput } from "./types";

export class TaskRepository {
    constructor(private pool: Pool) {}

    async create(userId: number, input: NewTaskInput): Promise<Task> {
        const result = await this.pool.query(
            "INSERT INTO tasks (user_id, title) VALUES ($1, $2) RETURNING *",
            [userId, input.title]
        );
        return result.rows[0];
    }

    async findAllForUser(userId: number): Promise<Task[]> {
        const result = await this.pool.query(
            "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        return result.rows;
    }

    async markComplete(taskId: number, userId: number): Promise<Task | null> {
        const result = await this.pool.query(
            "UPDATE tasks SET completed = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
            [taskId, userId]
        );
        return result.rows[0] ?? null;
    }

    async delete(taskId: number, userId: number): Promise<boolean> {
        const result = await this.pool.query(
            "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
            [taskId, userId]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
