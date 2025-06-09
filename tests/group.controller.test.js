// __tests__/group.controller.test.js
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import server from "../server.js";

dotenv.config({ path: ".env.test" });

let mongo;
let authToken;
let authCookie;
let createdGroup;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  await request(server)
    .post("/api/auth/users/register")
    .send({
      user: {
        name: "Alice",
        email: "alice@example.com",
        password: "StrongP@ssword123",
        avatarUrl: "https://example.com/avatar.png",
      },
    });

  const loginRes = await request(server)
    .post("/api/auth/users/login")
    .send({
      user: {
        email: "alice@example.com",
        password: "StrongP@ssword123",
      },
    });

  authCookie = loginRes.headers["set-cookie"];
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe("Group Controller", () => {
  test("Create group", async () => {
    const res = await request(server)
      .post("/api/groups/create")
      .set("Cookie", authCookie)
      .send({
        name: "Test Group",
        description: "Group for testing",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.group.name).toBe("Test Group");
    createdGroup = res.body.group;
  });

  test("List all groups for user", async () => {
    const res = await request(server)
      .get("/api/groups")
      .set("Cookie", authCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].name).toBe("Test Group");
  });

  test("Get group by ID", async () => {
    const res = await request(server)
      .get(`/api/groups/${createdGroup._id}`)
      .set("Cookie", authCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.group.name).toBe("Test Group");
  });

  test("Update group by ID", async () => {
    const res = await request(server)
      .put(`/api/groups/${createdGroup._id}`)
      .set("Cookie", authCookie)
      .send({
        description: "Updated group description",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.group.description).toBe("Updated group description");
  });

  test("Add member to group", async () => {
    let memberRes;
    try {
      memberRes = await request(server)
        .post("/api/auth/users/register")
        .send({
          user: {
            name: "Alice",
            email: "vivek@example.com",
            password: "8318940526@^Aman",
            avatarUrl: "https://thevivekyadav.me/images/img1",
          },
        });
    } catch (error) {
      console.error("Error creating member:", error);
    }
    expect(memberRes).toBeDefined();
    expect(memberRes.statusCode).toBe(201);

    const user = await mongoose
      .model("User")
      .findOne({ email: "vivek@example.com" });
    expect(user).toBeDefined();

    const res = await request(server)
      .post(`/api/groups/${createdGroup._id}/add-member`)
      .set("Cookie", authCookie)
      .send({ userId: user._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.added.userId).toBe(user._id.toString());
  });

  test("Remove member from group", async () => {
    const user = await mongoose
      .model("User")
      .findOne({ email: "vivek@example.com" });

    const res = await request(server)
      .delete(`/api/groups/${createdGroup._id}/remove-member/${user._id}`)
      .set("Cookie", authCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.removed.deletedCount).toBe(1);
  });
});
