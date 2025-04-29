import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FaTrash, FaEdit, FaCheck, FaTimes, FaSignOutAlt } from 'react-icons/fa'
import { RiArrowUpSLine, RiArrowDownSLine, RiArrowRightSLine } from 'react-icons/ri'
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Badge } from "../components/ui/badge"
import { Checkbox } from "../components/ui/checkbox"
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'

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
  const [filterText, setFilterText] = useState('')
  const { signOut } = useAuth()
  const navigate = useNavigate()

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

  // Filter todos based on search text
  const filteredTodos = todos.filter(todo => 
    todo.title.toLowerCase().includes(filterText.toLowerCase())
  )

  // Get task status
  const getStatus = (todo: Todo) => {
    return todo.is_complete ? "Done" : "Todo"
  }

  // Get priority (just random for demo)
  const getPriority = (todo: Todo) => {
    const id = todo.id.charCodeAt(0) % 3;
    return id === 0 ? "High" : id === 1 ? "Medium" : "Low";
  }

  // Get task ID (simulating ID like in the image)
  const getTaskId = (todo: Todo) => {
    return `TASK-${todo.id.substring(0, 4)}`
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      setError("Failed to logout. Please try again.")
      console.error("Logout error:", error)
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
    <div className="min-h-screen w-full bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Todo List</h1>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                {todos.length} Tasks
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/myfiles')}
                className="border-gray-800 text-black hover:bg-gray-800 hover:text-white hover:border-gray-700"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                My Files
              </Button>
              <Button
                onClick={() => navigate('/upload')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upload Files
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
            <p className="text-gray-400">Here's a list of your tasks for this month!</p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-lg border border-red-500/20 flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
                aria-label="Close error message"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Input
                placeholder="Filter tasks..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-3 pr-4 h-10 bg-gray-900/50 border-gray-800 text-white w-full"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[100px] bg-gray-900/50 border-gray-800 text-white">
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-300">
                <DropdownMenuItem className="hover:bg-gray-800">All</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Todo</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">In Progress</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Done</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[100px] bg-gray-900/50 border-gray-800 text-white">
                  Priority
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-300">
                <DropdownMenuItem className="hover:bg-gray-800">All</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">High</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Medium</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[100px] bg-gray-900/50 border-gray-800 text-white">
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-300">
                <DropdownMenuItem className="hover:bg-gray-800">Table</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Board</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Calendar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <form onSubmit={addTodo} className="flex">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="flex-grow rounded-r-none bg-gray-900/50 border-gray-800 text-white border-r-0"
            />
            <Button
              type="submit"
              className="rounded-l-none bg-blue-600 hover:bg-blue-700 px-8"
            >
              Add Task
            </Button>
          </form>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-gray-400">Loading your tasks...</p>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-gray-900/50">
                  <TableHead className="w-12 text-gray-400 font-medium">Task</TableHead>
                  <TableHead className="w-28 text-gray-400 font-medium">ID</TableHead>
                  <TableHead className="text-gray-400 font-medium">Title</TableHead>
                  <TableHead className="w-32 text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="w-32 text-gray-400 font-medium">Priority</TableHead>
                  <TableHead className="w-10 text-gray-400 font-medium"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodos.length === 0 ? (
                  <TableRow className="border-gray-800">
                    <TableCell colSpan={6} className="h-[300px]">
                      <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="text-4xl">📝</div>
                        <p className="text-gray-400 font-medium">No tasks found</p>
                        <p className="text-gray-500 text-sm">Add a new task to get started!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTodos.map(todo => (
                    <TableRow key={todo.id} className="border-gray-800 hover:bg-gray-900/50">
                      <TableCell>
                        <Checkbox
                          checked={todo.is_complete}
                          onCheckedChange={() => toggleComplete(todo.id, todo.is_complete)}
                          className="border-gray-700"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{getTaskId(todo)}</TableCell>
                      <TableCell>
                        {editingId === todo.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="h-8 text-sm bg-gray-900 border-gray-700 text-white"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 p-1 text-green-500 hover:text-green-400 hover:bg-gray-800">
                              <FaCheck className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 p-1 text-red-500 hover:text-red-400 hover:bg-gray-800">
                              <FaTimes className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className={cn(
                            todo.is_complete ? "line-through text-gray-500" : "text-white",
                            "font-medium"
                          )}>
                            {todo.title}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={todo.is_complete ? "outline" : "secondary"} 
                          className={cn(
                            "px-2 py-1 font-normal",
                            getStatus(todo) === "Todo" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            getStatus(todo) === "Done" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          )}
                        >
                          {getStatus(todo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getPriority(todo) === "High" ? (
                            <RiArrowUpSLine className="mr-2 text-red-400" />
                          ) : getPriority(todo) === "Medium" ? (
                            <RiArrowRightSLine className="mr-2 text-yellow-400" />
                          ) : (
                            <RiArrowDownSLine className="mr-2 text-green-400" />
                          )}
                          <span className={cn(
                            "text-sm font-medium",
                            getPriority(todo) === "High" ? "text-red-400" :
                            getPriority(todo) === "Medium" ? "text-yellow-400" :
                            "text-green-400"
                          )}>
                            {getPriority(todo)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800">
                              <span className="sr-only">Open menu</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-300">
                            <DropdownMenuItem onClick={() => startEditing(todo)} className="hover:bg-gray-800">
                              <FaEdit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleComplete(todo.id, todo.is_complete)}
                              className="text-blue-400 hover:bg-gray-800"
                            >
                              <FaCheck className="mr-2 h-4 w-4" />
                              {todo.is_complete ? "Mark as Todo" : "Mark as Done"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteTodo(todo.id)}
                              className="text-red-400 hover:bg-gray-800"
                            >
                              <FaTrash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Table Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/30">
              <p className="text-sm text-gray-400">
                {filteredTodos.length} of {todos.length} tasks
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Rows per page</span>
                  <select 
                    className="h-8 rounded-md border border-gray-800 bg-gray-900 px-2 text-sm text-white"
                    defaultValue="10"
                  >
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white">
                    <span className="sr-only">First page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="11 17 6 12 11 7" />
                      <polyline points="18 17 13 12 18 7" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white">
                    <span className="sr-only">Previous page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </Button>
                  <span className="text-sm text-gray-400">Page 1 of 1</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white">
                    <span className="sr-only">Next page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white">
                    <span className="sr-only">Last page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="13 17 18 12 13 7" />
                      <polyline points="6 17 11 12 6 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Todo