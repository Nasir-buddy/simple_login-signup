import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Uploadfile = () => {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = selectedFiles.filter(file => {
        const fileType = file.type
        const isValid = fileType === 'application/pdf' ||
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileType === 'image/jpeg'
        
        if (!isValid) {
          setError(`Invalid file type: ${file.name}. Please upload PDF, DOCX, or JPG files only.`)
        }
        return isValid
      })

      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles])
        setError(null)
        setSuccess(null)
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!files.length || !user) return

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Add to database
        const { error: dbError } = await supabase
          .from('uploads')
          .insert({
            user_id: user.id,
            name: file.name,
            path: filePath,
            type: file.type,
            size: file.size
          })

        if (dbError) throw dbError
      })

      await Promise.all(uploadPromises)
      setSuccess(`${files.length} file(s) uploaded successfully!`)
      setFiles([])
      setTimeout(() => navigate('/myfiles'), 1200)
    } catch (err) {
      setError('Failed to upload files. Please try again.')
      setSuccess(null)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 shadow-xl">
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload your <span className="font-semibold text-white">PDF, DOCX, or JPG</span> files here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg"
              onChange={handleFileChange}
              multiple
              className="bg-gray-800 border-gray-700 file:text-gray-400 file:bg-gray-900 file:border-0 file:rounded file:px-3 file:py-1"
            />
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-300">Selected files:</div>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-sm">{success}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!files.length || uploading}
                className="w-1/2"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/myfiles')}
                className="w-1/2 border-gray-700"
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Uploadfile