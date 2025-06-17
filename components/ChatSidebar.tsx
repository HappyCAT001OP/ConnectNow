import { useUser } from '@clerk/nextjs';
import { useCall } from '@stream-io/video-react-sdk';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

// Define ChatMessage type
interface ChatMessage {
  id: string;
  user: string;
  userId: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileId?: string;
  time: number;
}

interface ChatSidebarProps {
  roomId: string;
  onClose?: () => void;
  className?: string;
}

export default function ChatSidebar({ roomId, onClose, className }: ChatSidebarProps) {
  const { user } = useUser();
  const call = useCall();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yarrayRef = useRef<Y.Array<any> | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const userId = user?.id || 'unknown';
  const username = user?.username || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User';
  const hostId = call?.state?.createdBy?.id;

  // Removed Uploadthing hook

  useEffect(() => {
    if (!roomId) return;

    // Initialize Yjs document
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      yarrayRef.current = ydocRef.current.getArray('messages');
    }

    // Initialize WebSocket provider
    if (!providerRef.current) {
      providerRef.current = new WebsocketProvider(process.env.NEXT_PUBLIC_YJS_URL!, roomId + '-chat', ydocRef.current!);
    }

    // Listen for message changes
    const updateMessages = () => {
      setMessages(yarrayRef.current ? yarrayRef.current.toArray() : []);
    };
    if (yarrayRef.current) {
      yarrayRef.current.observeDeep(updateMessages);
      updateMessages();
    }

    // Cleanup
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      if (yarrayRef.current) {
        yarrayRef.current.unobserveDeep(updateMessages);
      }
    };
  }, [roomId]);

  const sendMessage = (msg: Partial<ChatMessage>) => {
    yarrayRef.current?.push([{ id: crypto.randomUUID(), user: username, userId, ...msg, time: Date.now() }]);
    setInput('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      console.log("No file selected.");
      return;
    }
    console.log("File selected for upload:", selectedFile.name);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variables.");
      console.error("Cloudinary configuration missing.");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', uploadPreset);

    try {
      console.log("Attempting to upload file to Cloudinary...");
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });


      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error?.message || JSON.stringify(errorData);
        } catch (jsonError) {
           const responseText = await response.text();
           errorDetails = `Status: ${response.status}, Raw Response: ${responseText}`;
           console.error("Failed to parse Cloudinary error response as JSON:", jsonError, "Raw response text:", responseText);
        }
        console.error("Cloudinary upload failed:", response.status, errorDetails);
        throw new Error(`Cloudinary upload failed: ${errorDetails}`);
      }

      let fileData;
      try {
         fileData = await response.json();
         console.log("Cloudinary upload successful:", fileData);
      } catch (jsonError) {
          const responseText = await response.text();
          console.error("Failed to parse Cloudinary success response as JSON:", jsonError, "Raw response text:", responseText);
          throw new Error(`Cloudinary upload returned non-JSON response. Raw response: ${responseText}`);
      }

      console.log("Processing Cloudinary successful response.");
      console.log("fileData from Cloudinary:", fileData);
      console.log("selectedFile object:", selectedFile);

      const fileUrl = fileData.secure_url; // Use secure_url for HTTPS
      const fileName = fileData.original_filename || selectedFile.name;
      console.log("Determined fileName:", fileName);

      // Cloudinary provides a public_id, you can use this or generate your own fileId
      const fileId = fileData.public_id; // Using Cloudinary's public_id as fileId

      // Store file metadata in database
      const dbResponse = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fileUrl,
          name: fileName,
          userId,
          fileId: fileId, // Store Cloudinary's public_id as a reference
        }),
      });

      if (!dbResponse.ok) {
        let dbErrorData = { message: dbResponse.statusText, details: '' };
        try {
          dbErrorData = await dbResponse.json();
        } catch (e) {
          console.error("Failed to parse error response:", e);
          // Try to get the raw text response if JSON parsing fails
          try {
            const rawText = await dbResponse.text();
            dbErrorData.details = rawText;
          } catch (textError) {
            console.error("Failed to get raw response text:", textError);
          }
        }
        console.error("Failed to store file metadata:", dbResponse.status, dbErrorData);
        throw new Error(`Failed to store file metadata: ${dbErrorData.message || dbResponse.statusText} ${dbErrorData.details ? `(${dbErrorData.details})` : ''}`);
      }

      const dbFileData = await dbResponse.json();
      console.log("File metadata stored:", dbFileData);

      // Send message with file details
      // Use the database-generated id from the File model for the message's fileId reference
      // This ensures the Message model correctly references the File model's id field
      sendMessage({ fileUrl, fileName, fileId: dbFileData.id });
      console.log("File chat message sent.");

    } catch (error: any) {
      console.error("File upload process failed:", error);
      // Create a more user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`File upload failed: ${errorMessage}`);
    }
  };

  // Drag-and-drop handlers
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        // Reuse handleFile logic
        const inputEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFile(inputEvent);
      }
    };
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <aside 
      ref={dropRef} 
      className={`w-[340px] bg-zinc-900/95 backdrop-blur-md text-white h-screen border-l border-zinc-800/50 flex flex-col font-sans transition-all ${isDragging ? 'ring-2 ring-blue-400/70' : ''} ${className || ''}`}
    >
      <div className="px-5 py-4 border-b border-zinc-800/50 bg-zinc-950/70 flex items-center justify-between">
        <h2 className="font-bold text-lg tracking-wide m-0 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 px-3 py-1.5 rounded-full bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 hover:bg-zinc-700/80 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Close Chat
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-900/70 pb-16 space-y-4">
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none rounded-lg border-2 border-dashed border-blue-400/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400 mb-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="text-lg font-bold text-blue-300">Drop file to upload</span>
          </div>
        )}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center p-6 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-500 mb-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-zinc-500 text-sm">No messages yet</p>
            <p className="text-zinc-600 text-xs mt-1">Be the first to send a message!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 rounded-xl p-3 transition-all ${msg.userId === userId ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-zinc-800/50 border border-zinc-700/30'}`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${msg.userId === userId ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-200'} ${msg.userId === hostId ? 'ring-2 ring-green-400' : ''}`}
            >
              {msg.user?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className={`font-medium text-sm ${msg.userId === userId ? 'text-blue-400' : 'text-zinc-300'}`}>
                  {msg.user || 'User'}
                </span>
                {msg.userId === hostId && (
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                    HOST
                  </span>
                )}
                <span className="ml-auto text-[10px] text-zinc-500">{new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              {msg.text && (
                <div className="text-sm text-zinc-200 break-words">{msg.text}</div>
              )}
              
              {msg.fileUrl && (
                <div className="mt-2 p-2 rounded-lg bg-zinc-800/70 border border-zinc-700/50 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <a 
                    href={msg.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 text-xs font-medium hover:underline truncate"
                  >
                    {msg.fileName || 'File'}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <form 
        className="flex flex-col gap-3 p-4 border-t border-zinc-800/50 bg-zinc-950/70 backdrop-blur-sm sticky bottom-0 z-50" 
        onSubmit={e => { e.preventDefault(); if (input.trim()) sendMessage({ text: input }); }}
      >
        <div className="relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-3 rounded-xl bg-zinc-800/70 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all pr-10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <label
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 cursor-pointer text-sm font-medium transition-colors border border-zinc-700/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <input
              type="file"
              onChange={handleFile}
              className="hidden"
            />
            <span>Attach File</span>
          </label>
          
          <p className="text-xs text-zinc-500">Drag & drop files here</p>
        </div>
      </form>
    </aside>
  );
}