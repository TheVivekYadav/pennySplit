import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import server from "../server.js";

dotenv.config({ path: ".env.test" });

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe("User Auth Controller", () => {
  describe("User Registration", () => {
    test("should register a new user successfully", async () => {
      const res = await request(server)
        .post("/api/auth/users/register")
        .send({
          user: {
            name: "Alice",
            email: "vivek@example.com",
            password: "8318940526@^Aman",
            avatarUrl: "https://thevivekyadav.me/images/img1",
          },
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.name).toBe("Alice");
      expect(res.body.user.email).toBe("vivek@example.com");
    });

    test("should not register user with an existing email", async () => {
      // Register once
      await request(server)
        .post("/api/auth/users/register")
        .send({
          user: {
            name: "Alice",
            email: "duplicate@example.com",
            password: "8318940526@^Aman",
            avatarUrl: "https://thevivekyadav.me/images/img1",
          },
        });

      // Try registering again with same email
      const res = await request(server)
        .post("/api/auth/users/register")
        .send({
          user: {
            name: "Alice2",
            email: "duplicate@example.com",
            password: "DifferentPass123!",
            avatarUrl: "https://thevivekyadav.me/images/img2",
          },
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toBe("User already exists");
    });

    test("should return validation errors for invalid input", async () => {
      const res = await request(server)
        .post("/api/auth/users/register")
        .send({
          user: {
            name: "", // Invalid
            email: "not-an-email",
            password: "short",
            avatarUrl: "not-a-url",
          },
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
    });
  });

  describe("User Login", () => {
    beforeAll(async () => {
      await request(server)
        .post("/api/auth/users/register")
        .send({
          user: {
            name: "Alice",
            email: "loginuser@example.com",
            password: "ValidPass123@",
            avatarUrl: "https://thevivekyadav.me/images/img1",
          },
        });
    });

    test("should login successfully with correct credentials", async () => {
      const res = await request(server)
        .post("/api/auth/users/login")
        .send({
          user: {
            email: "loginuser@example.com",
            password: "ValidPass123@",
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message.toLowerCase()).toContain("success");
    });

    test("should fail login with incorrect password", async () => {
      const res = await request(server)
        .post("/api/auth/users/login")
        .send({
          user: {
            email: "loginuser@example.com",
            password: "WrongPass123!",
          },
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Invalid email or password");
    });
  });
});
