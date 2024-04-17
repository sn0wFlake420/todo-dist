"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("./config"));
const middleware_1 = require("./middleware");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    try {
        const existingUser = yield prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = yield prisma.user.create({
            data: {
                email,
                name,
                password
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: newUser.id }, config_1.default);
        res.status(200).json({ token });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "User Creation Failed" });
    }
}));
app.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user || user.password !== password) {
            return res.status(404).json({
                message: "Invalid email or password"
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.default);
        res.status(200).json({ token });
    }
    catch (error) {
        console.error("Error signing in:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.post("/user/todo", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description } = req.body;
    const userId = req.id;
    try {
        const user = yield prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const response = yield prisma.todo.create({
            data: {
                title,
                description,
                user: {
                    connect: {
                        id: user.id
                    }
                }
            }
        });
        res.status(201).json({ message: "Todo created successfully", response });
    }
    catch (error) {
        console.error("Error creating todo:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.get("/bulk", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield prisma.todo.findMany({
        where: {
            userId: req.id
        },
        orderBy: {
            id: 'asc', // Sort by ID in ascending order
        }
    });
    res.status(200).json(response);
}));
app.delete("/user/todo", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield prisma.todo.deleteMany({
            where: {
                done: true
            }
        });
        res.status(200).send(response);
    }
    catch (e) {
        res.json({
            "error": e
        });
    }
}));
app.put("/user/todo", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body;
        const _id = parseInt(id);
        const response = yield prisma.todo.update({
            where: {
                id: _id
            },
            data: {
                done: true
            }
        });
        res.status(200).send(response);
    }
    catch (e) {
        res.json({
            message: "Internal Server Error"
        });
    }
}));
app.put("/user/todo/update", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, title } = req.body;
        const _id = parseInt(id);
        const response = yield prisma.todo.update({
            where: {
                id: _id
            },
            data: {
                title: title
            }
        });
        res.status(200).send(response);
    }
    catch (e) {
        res.json({
            message: "Internal Server Error"
        });
    }
}));
app.listen(process.env.PORT || 3000, () => console.log("Server running on port 3000"));
