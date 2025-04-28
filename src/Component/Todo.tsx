import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa'

interface Todo {
  id: string
  title: string
  is_complete: boolean
  created_at: string
  user_id: string
}

interface ApiError {
  message: string;
}

const Todo = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user and fetch todos on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUserId(data.user.id)
      }
    }

    getCurrentUser()
  }, [])

  // Fetch todos when userId changes
  useEffect(() => {
    if (userId) {
      fetchTodos()
    }
  }, [userId])

  const fetchTodos = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.message)
      console.error('Error fetching todos:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || !userId) return

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({ 
          title: newTodo.trim(), 
          is_complete: false,
          user_id: userId
        })
        .select()

      if (error) throw error
      
      if (data) {
        setTodos([...data, ...todos])
        setNewTodo('')
      }
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.message)
      console.error('Error adding todo:', err)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      
      setTodos(todos.filter(todo => todo.id !== id))
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.message)
      console.error('Error deleting todo:', err)
    }
  }

  const toggleComplete = async (id: string, is_complete: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_complete: !is_complete })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
      
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, is_complete: !is_complete } : todo
      ))
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.message)
      console.error('Error updating todo:', err)
    }
  }

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id)
    setEditText(todo.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async () => {
    if (!editingId || !editText.trim() || !userId) return

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editText.trim() })
        .eq('id', editingId)
        .eq('user_id', userId)

      if (error) throw error
      
      setTodos(todos.map(todo => 
        todo.id === editingId ? { ...todo, title: editText.trim() } : todo
      ))
      setEditingId(null)
      setEditText('')
    } catch (err: unknown) {
      const apiError = err as ApiError
      setError(apiError.message)
      console.error('Error updating todo:', err)
    }
  }

  // Show message if user is not authenticated
  if (!userId && !loading) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="text-center p-4 bg-yellow-100 rounded">
          <p>Please log in to manage your todos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Todo App</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
          <button 
            className="ml-2 font-bold"
            onClick={() => setError(null)}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={addTodo} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="New todo text"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center">Loading todos...</div>
      ) : (
        <ul className="space-y-2">
          {todos.length === 0 ? (
            <li className="text-center text-gray-500">No todos yet. Add one above!</li>
          ) : (
            todos.map(todo => (
              <li 
                key={todo.id} 
                className={`border rounded p-3 flex justify-between items-center ${
                  todo.is_complete ? 'bg-gray-50' : ''
                }`}
              >
                {editingId === todo.id ? (
                  <div className="flex items-center flex-grow">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="p-1 border rounded flex-grow mr-2"
                      aria-label="Edit todo text"
                      placeholder="Edit todo"
                      autoFocus
                    />
                    <button 
                      onClick={saveEdit} 
                      className="text-green-500 mr-2"
                      aria-label="Save changes"
                      title="Save changes"
                    >
                      <FaCheck />
                    </button>
                    <button 
                      onClick={cancelEditing} 
                      className="text-red-500"
                      aria-label="Cancel editing"
                      title="Cancel editing"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <>
                    <span 
                      className={`flex-grow ${todo.is_complete ? 'line-through text-gray-500' : ''} cursor-pointer`}
                      onClick={() => toggleComplete(todo.id, todo.is_complete)}
                    >
                      {todo.title}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => startEditing(todo)} 
                        className="text-blue-500 hover:text-blue-700"
                        aria-label="Edit todo"
                        title="Edit todo"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => deleteTodo(todo.id)} 
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete todo"
                        title="Delete todo"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default Todo