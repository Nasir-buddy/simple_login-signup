import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Component/Landing'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './Component/ProtectedRoute'
import Todo from './Component/Todo'
import Uploadfile from './Component/Uploadfile'
import MyFiles from './Component/MyFiles'

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
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Uploadfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/myfiles"
            element={
              <ProtectedRoute>
                <MyFiles />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App