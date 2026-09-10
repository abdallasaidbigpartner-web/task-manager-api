// Type definitions for the Task Manager API.
// Demonstrates TypeScript interfaces as data contracts, shared
// across the data layer and route handlers.

export interface Task {
    id: number;
    user_id: number;
    title: string;
    completed: boolean;
    created_at: Date;
}

export interface NewTaskInput {
    title: string;
}

export interface UserCredentials {
    username: string;
    password: string;
}

export interface JwtPayload {
    userId: number;
    username: string;
}
