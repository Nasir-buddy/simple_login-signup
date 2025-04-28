import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Component/Landing'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './Component/ProtectedRoute'
import Todo from './Component/todo'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Landing />} />
          <Route
            path="/todo"
            element={
              <ProtectedRoute>
                <Todo />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App