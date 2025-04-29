import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { ArrowLeft } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  path: string
  type: string
  size: number
  created_at: string
}

const MyFiles = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchFiles()
    }
  }, [user])

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('image')) return '🖼️'
    return '📁'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(file.path)

      if (error) throw error

      // Create a URL for the blob
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleDelete = async (file: UploadedFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([file.path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      // Refresh the list
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full p-4 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/todo')}
          className="mb-4 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Todo
        </Button>
        <Card className="w-full bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader>
            <CardTitle>My Files</CardTitle>
            <CardDescription>
              View and manage your uploaded files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No files uploaded yet
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getFileIcon(file.type)}</span>
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-400">
                          {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {(file.name.endsWith('.pdf') || file.name.endsWith('.docx')) && (
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => navigate(`/viewfile/${file.id}`)}
                      >
                        View
                      </Button>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(file)}
                        className="border-gray-700 text-black hover:scale-105"
                      >
                        Download
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(file)}
                        className="bg-red-500 text-white hover:scale-105"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MyFiles 