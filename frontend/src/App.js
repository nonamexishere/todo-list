import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  
  const [archivedTodos, setArchivedTodos] = useState(() => {
    const savedArchivedTodos = localStorage.getItem('archivedTodos');
    return savedArchivedTodos ? JSON.parse(savedArchivedTodos) : [];
  });

  const [newTodo, setNewTodo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const checkOverdueTodos = useCallback(() => {
    const currentDate = new Date();
    const updatedTodos = todos.filter(todo => new Date(todo.deadline) > currentDate);
    const newlyArchived = todos.filter(todo => new Date(todo.deadline) <= currentDate);
    
    if (newlyArchived.length > 0) {
      setTodos(updatedTodos);
      setArchivedTodos(prev => [...newlyArchived, ...prev]);
    }
  }, [todos]);

  // Her dakika süresi geçen görevleri kontrol et
  useEffect(() => {
    const interval = setInterval(checkOverdueTodos, 60000);
    return () => clearInterval(interval);
  }, [checkOverdueTodos]);

  // Todos değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos to localStorage:', error);
    }
  }, [todos]);

  // ArchivedTodos değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    try {
      localStorage.setItem('archivedTodos', JSON.stringify(archivedTodos));
    } catch (error) {
      console.error('Error saving archivedTodos to localStorage:', error);
    }
  }, [archivedTodos]);

  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !deadline) return;

    const newTodoItem = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      deadline: new Date(deadline),
      createdAt: new Date(),
      completedAt: null
    };

    setTodos(prev => {
      const updatedTodos = [newTodoItem, ...prev];
      try {
        localStorage.setItem('todos', JSON.stringify(updatedTodos));
      } catch (error) {
        console.error('Error saving new todo:', error);
      }
      return updatedTodos;
    });

    setNewTodo('');
    setDeadline('');
  };

  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (!todo.completed) {
      const updatedTodo = { 
        ...todo, 
        completed: true, 
        completedAt: new Date() 
      };

      setTodos(prev => {
        const updatedTodos = prev.filter(t => t.id !== id);
        try {
          localStorage.setItem('todos', JSON.stringify(updatedTodos));
        } catch (error) {
          console.error('Error updating todos:', error);
        }
        return updatedTodos;
      });

      setArchivedTodos(prev => {
        const updatedArchived = [updatedTodo, ...prev];
        try {
          localStorage.setItem('archivedTodos', JSON.stringify(updatedArchived));
        } catch (error) {
          console.error('Error updating archived todos:', error);
        }
        return updatedArchived;
      });
    }
  };

  const deleteTodo = (id, isArchived = false) => {
    if (isArchived) {
      setArchivedTodos(prev => {
        const updatedArchived = prev.filter(todo => todo.id !== id);
        try {
          localStorage.setItem('archivedTodos', JSON.stringify(updatedArchived));
        } catch (error) {
          console.error('Error deleting archived todo:', error);
        }
        return updatedArchived;
      });
    } else {
      setTodos(prev => {
        const updatedTodos = prev.filter(todo => todo.id !== id);
        try {
          localStorage.setItem('todos', JSON.stringify(updatedTodos));
        } catch (error) {
          console.error('Error deleting todo:', error);
        }
        return updatedTodos;
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const getStatusText = (todo) => {
    if (todo.completed) {
      return `Tamamlandı: ${formatDate(todo.completedAt)}`;
    }
    if (isOverdue(todo.deadline)) {
      return 'Süresi Geçti';
    }
    return `Son Tarih: ${formatDate(todo.deadline)}`;
  };

  const getStatusClass = (todo) => {
    if (todo.completed) return 'completed';
    if (isOverdue(todo.deadline)) return 'overdue';
    return '';
  };

  return (
    <div className="App">
      <div className="container">
        <h1>
          <span className="title-icon">✓</span>
          To-Do List
        </h1>
        
        <form onSubmit={addTodo} className="todo-form">
          <div className="input-group">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Görev açıklaması..."
              className="todo-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="deadline" className="input-label">Bitiş zamanı seçin</label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="deadline-input"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <button type="submit" className="add-button">
            <span className="button-icon">+</span>
            Ekle
          </button>
        </form>

        <div className="tabs">
          <button 
            className={`tab-button ${!showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(false)}
          >
            <span className="tab-icon">📋</span>
            Aktif Görevler
            <span className="task-count">{todos.length}</span>
          </button>
          <button 
            className={`tab-button ${showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(true)}
          >
            <span className="tab-icon">📦</span>
            Arşiv
            <span className="task-count">{archivedTodos.length}</span>
          </button>
        </div>

        <div className="todo-list">
          {(showArchived ? archivedTodos : todos).map(todo => (
            <div 
              key={todo.id} 
              className={`todo-item ${getStatusClass(todo)}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="todo-checkbox"
                disabled={showArchived}
              />
              <div className="todo-content">
                <span className="todo-text">{todo.text}</span>
                <span className={`todo-status ${getStatusClass(todo)}`}>
                  {getStatusText(todo)}
                </span>
              </div>
              {(!showArchived && !todo.completed || showArchived) && (
                <button
                  onClick={() => deleteTodo(todo.id, showArchived)}
                  className="delete-button"
                  title={showArchived ? "Arşivden Sil" : "Görevi Sil"}
                >
                  <span className="button-icon">×</span>
                </button>
              )}
            </div>
          ))}
          {(showArchived ? archivedTodos : todos).length === 0 && (
            <div className="empty-state">
              {showArchived 
                ? "Arşivlenmiş görev bulunmuyor" 
                : "Aktif görev bulunmuyor"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
