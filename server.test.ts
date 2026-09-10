// Automated tests for the Task Manager API.
// Uses supertest for HTTP-level integration testing against the
// real Express app and a real PostgreSQL database - verifying
// registration, login, JWT-protected endpoints, and full CRUD.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, pool } from "./server";

let token: string;
const testUsername = `testuser_${Date.now()}`;

beforeAll(async () => {
    await request(app)
        .post("/register")
        .send({ username: testUsername, password: "TestPass123" });

    const loginResponse = await request(app)
        .post("/login")
        .send({ username: testUsername, password: "TestPass123" });

    token = loginResponse.body.token;
});

afterAll(async () => {
    await pool.end();
});

describe("Health check", () => {
    it("returns healthy status", async () => {
        const response = await request(app).get("/health");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("healthy");
    });
});

describe("Registration", () => {
    it("rejects a short username", async () => {
        const response = await request(app)
            .post("/register")
            .send({ username: "ab", password: "ValidPass123" });
        expect(response.status).toBe(422);
    });

    it("rejects a short password", async () => {
        const response = await request(app)
            .post("/register")
            .send({ username: "validusername", password: "short" });
        expect(response.status).toBe(422);
    });
});

describe("Authentication", () => {
    it("rejects requests with no token", async () => {
        const response = await request(app).get("/tasks");
        expect(response.status).toBe(401);
    });

    it("rejects requests with an invalid token", async () => {
        const response = await request(app)
            .get("/tasks")
            .set("Authorization", "Bearer not-a-real-token");
        expect(response.status).toBe(401);
    });
});

describe("Task CRUD", () => {
    let createdTaskId: number;

    it("creates a task", async () => {
        const response = await request(app)
            .post("/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Test task" });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe("Test task");
        expect(response.body.completed).toBe(false);
        createdTaskId = response.body.id;
    });

    it("retrieves the created task in the task list", async () => {
        const response = await request(app)
            .get("/tasks")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.some((t: any) => t.id === createdTaskId)).toBe(true);
    });

    it("marks the task as complete", async () => {
        const response = await request(app)
            .patch(`/tasks/${createdTaskId}/complete`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.completed).toBe(true);
    });

    it("deletes the task", async () => {
        const response = await request(app)
            .delete(`/tasks/${createdTaskId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(204);
    });

    it("returns 404 when marking a nonexistent task complete", async () => {
        const response = await request(app)
            .patch(`/tasks/999999/complete`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
    });
});
