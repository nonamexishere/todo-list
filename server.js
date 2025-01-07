const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-list', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Todo modeli
const Todo = mongoose.model('Todo', {
    text: String,
    completed: Boolean,
    deadline: Date,
    isArchived: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Routes
app.get('/api/todos', async (req, res) => {
    try {
        const currentDate = new Date();
        // Süresi geçmiş görevleri arşivle
        await Todo.updateMany(
            { deadline: { $lt: currentDate }, isArchived: false },
            { $set: { isArchived: true } }
        );
        
        // Aktif görevleri getir
        const activeTodos = await Todo.find({ isArchived: false }).sort({ deadline: 1, createdAt: -1 });
        res.json(activeTodos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/todos/archived', async (req, res) => {
    try {
        const archivedTodos = await Todo.find({ isArchived: true }).sort({ createdAt: -1 });
        res.json(archivedTodos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/todos', async (req, res) => {
    try {
        const todo = new Todo({
            text: req.body.text,
            completed: false,
            deadline: req.body.deadline,
            isArchived: false
        });
        const savedTodo = await todo.save();
        res.status(201).json(savedTodo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            { completed: req.body.completed },
            { new: true }
        );
        res.json(todo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 