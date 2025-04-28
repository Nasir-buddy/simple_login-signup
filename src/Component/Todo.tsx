import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa'
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6 max-w-5xl">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-gray-400 mb-6">Here's a list of your tasks for this month!</p>
        
        {error && (
          <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4 border border-red-800">
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

        <div className="flex space-x-2 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Filter tasks..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-3 pr-4 h-10 bg-black/20 border-gray-800 text-white"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex space-x-2 items-center bg-black border-gray-800 text-white">
                <span>Status</span>
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
              <Button variant="outline" className="flex space-x-2 items-center bg-black border-gray-800 text-white">
                <span>Priority</span>
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
              <Button variant="outline" className="flex space-x-2 items-center bg-black border-gray-800 text-white">
                <span>View</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-300">
              <DropdownMenuItem className="hover:bg-gray-800">Table</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800">Board</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800">Calendar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <form onSubmit={addTodo} className="mb-6">
          <div className="flex">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              className="flex-grow rounded-r-none bg-black/20 border-gray-800 text-white"
            />
            <Button
              type="submit"
              className="rounded-l-none bg-blue-600 hover:bg-blue-700"
            >
              Add
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center p-10">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading tasks...</p>
          </div>
        ) : (
          <div className="border border-gray-800 rounded-md bg-black/20">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-gray-900/50">
                  <TableHead className="w-12 text-gray-400">Task</TableHead>
                  <TableHead className="w-20 text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Title</TableHead>
                  <TableHead className="w-32 text-gray-400">Status</TableHead>
                  <TableHead className="w-32 text-gray-400">Priority</TableHead>
                  <TableHead className="w-10 text-gray-400"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodos.length === 0 ? (
                  <TableRow className="border-gray-800 hover:bg-gray-900/50">
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No tasks found. Add one above!
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
                          <span className={todo.is_complete ? "line-through text-gray-500" : "text-white"}>
                            {todo.title}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={todo.is_complete ? "outline" : "secondary"} 
                          className={cn(
                            "px-2 font-normal",
                            getStatus(todo) === "Todo" ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600" :
                            getStatus(todo) === "Done" ? "bg-green-700 text-white border-green-600 hover:bg-green-600" :
                            "bg-transparent text-gray-400 border-gray-600 hover:bg-gray-800"
                          )}
                        >
                          {getStatus(todo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getPriority(todo) === "High" ? (
                            <RiArrowUpSLine className="mr-2 text-red-500" />
                          ) : getPriority(todo) === "Medium" ? (
                            <RiArrowRightSLine className="mr-2 text-amber-500" />
                          ) : (
                            <RiArrowDownSLine className="mr-2 text-green-500" />
                          )}
                          <span className="text-gray-300">{getPriority(todo)}</span>
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
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-gray-400">
              <p className="text-sm">
                {filteredTodos.length} of {todos.length} row(s) selected.
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-sm whitespace-nowrap">Rows per page</p>
                <select 
                  className="h-8 rounded-md border border-gray-800 bg-black px-2 text-sm text-white"
                  aria-label="Select number of rows per page"
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                  <option>100</option>
                </select>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-black border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-white">
                    <span className="sr-only">Go to first page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="11 17 6 12 11 7" />
                      <polyline points="18 17 13 12 18 7" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-black border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-white">
                    <span className="sr-only">Go to previous page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </Button>
                  <span className="text-sm">Page 1 of 1</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-black border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-white">
                    <span className="sr-only">Go to next page</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 p-0 bg-black border-gray-800 text-gray-400 hover:bg-gray-900 hover:text-white">
                    <span className="sr-only">Go to last page</span>
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