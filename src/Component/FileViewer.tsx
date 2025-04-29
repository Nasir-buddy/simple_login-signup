import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useEffect, useState } from 'react';

const FileViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | ''>('');

  // Function to extract text using PDF.js script
  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer) => {
    // Create a script element to load PDF.js
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
    document.body.appendChild(script);
    
    // Wait for script to load
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
    });
    
    // Access the PDF.js library from the window object
    const pdfjsLib = (window as any).pdfjsLib;
    
    if (!pdfjsLib) {
      throw new Error('PDF.js library not loaded properly');
    }
    
    // Disable worker to avoid CDN issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Add page separator for better readability
      if (i > 1) fullText += '\n\n----- Page ' + i + ' -----\n\n';
      
      // Extract and join text
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
        
      fullText += pageText;
    }
    
    return fullText;
  };

  useEffect(() => {
    const fetchAndExtract = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      setText('');
      
      try {
        // Get file info from DB
        const { data: files, error: dbError } = await supabase
          .from('uploads')
          .select('*')
          .eq('id', id)
          .limit(1);
          
        if (dbError || !files || files.length === 0) throw new Error('File not found');
        
        const file = files[0];
        setFileName(file.name);
        
        // Set file type
        if (file.name.endsWith('.pdf')) {
          setFileType('pdf');
        } else if (file.name.endsWith('.docx')) {
          setFileType('docx');
        }
        
        // Download file from storage
        const { data, error: storageError } = await supabase.storage
          .from('uploads')
          .download(file.path);
          
        if (storageError || !data) throw new Error('Failed to download file');
        
        // Extract text based on file type
        if (file.name.endsWith('.pdf')) {
          try {
            const arrayBuffer = await data.arrayBuffer();
            
            // Try to extract text from PDF
            const extractedText = await extractTextFromPdf(arrayBuffer);
            setText(extractedText);
          } catch (pdfError) {
            console.error('PDF processing error:', pdfError);
            throw new Error('Failed to process PDF file: ' + (pdfError instanceof Error ? pdfError.message : 'Unknown error'));
          }
        } else if (file.name.endsWith('.docx')) {
          try {
            // Dynamically import mammoth only when needed
            const mammoth = await import('mammoth');
            const arrayBuffer = await data.arrayBuffer();
            
            // Extract raw text from DOCX
            const { value } = await mammoth.extractRawText({ arrayBuffer });
            setText(value);
          } catch (docxError) {
            console.error('DOCX processing error:', docxError);
            throw new Error('Failed to process DOCX file: ' + (docxError instanceof Error ? docxError.message : 'Unknown error'));
          }
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to extract file text.';
        setError(errorMessage);
        console.error('File processing error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndExtract();
  }, [id]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-black text-white p-6">
      <div className="w-full max-w-4xl">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="mb-6 border-gray-800 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader className="pb-4 border-b border-gray-800">
            <CardTitle className="flex items-center">
              <span className="text-2xl mr-3">
                {fileType === 'pdf' ? '📄' : fileType === 'docx' ? '📝' : '📃'}
              </span>
              {fileName}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-400">Extracting text from file...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-800">
                <p className="font-medium mb-2">Error:</p>
                <p>{error}</p>
                <p className="mt-4 text-sm">
                  There was a problem processing this file. You can still download it instead.
                </p>
              </div>
            )}
            
            {!loading && !error && text && (
              <div className="bg-gray-950 rounded-lg border border-gray-800 p-4">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono max-h-[70vh] overflow-auto leading-relaxed">{text}</pre>
              </div>
            )}
            
            {!loading && !error && !text && (
              <div className="text-center py-8 text-gray-400">
                No text content could be extracted from this file.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FileViewer;