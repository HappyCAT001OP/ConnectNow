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

export default function ChatSidebar() {
  const { id: roomId } = useParams();
  const { user } = useUser();
  const call = useCall();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yarrayRef = useRef<Y.Array<any> | null>(null);

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

      const fileUrl = fileData.secure_url; // Use secure_url for HTTPS
      // Cloudinary provides a public_id, you can use this or generate your own fileId
      const fileId = fileData.public_id; // Using Cloudinary's public_id as fileId

      // Store file metadata in your database via the /api/files route
      console.log("Storing file metadata in database...");
      const dbResponse = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: fileUrl,
          name: fileName,
          userId: userId,
          fileId: fileId, // Pass Cloudinary's public_id or a generated ID
        }),
      });

      if (!dbResponse.ok) {
         const dbErrorData = await dbResponse.json();
         console.error("Failed to store file metadata:", dbResponse.status, dbErrorData);
         throw new Error(`Failed to store file metadata: ${dbErrorData.message || dbResponse.statusText}`);
      }

      const dbFileData = await dbResponse.json();
      console.log("File metadata stored:", dbFileData);

      // Send message with file details
      sendMessage({ fileUrl, fileName, fileId: dbFileData.id }); // Assuming /api/files returns an id
      console.log("File chat message sent.");

    } catch (error: any) {
      console.error("File upload process failed:", error);
      alert(`File upload failed: ${error.message}`);
    }
  };

  return (
    <aside className="w-[340px] bg-zinc-900 text-white h-screen border-l border-zinc-800 flex flex-col font-sans">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <h2 className="font-bold text-lg tracking-wide m-0 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-900">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`mb-4 flex items-start gap-2 rounded-lg p-2 ${msg.userId === userId ? 'bg-zinc-800' : ''} transition-opacity`}>
            <div className={`w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-base ${msg.userId === hostId ? 'ring-2 ring-green-400' : ''}`}>
              {msg.user?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1">
                <span className="font-semibold text-blue-400 mr-1">{msg.user || 'User'}</span>
                {msg.userId === hostId && <span className="text-yellow-300 font-bold ml-1">[Host]</span>}
                <span className="ml-auto text-xs">{new Date(msg.time).toLocaleTimeString()}</span>
              </div>
              {msg.text && <div className="text-sm text-white mt-1">{msg.text}</div>}
              {msg.fileUrl && (
                <div className="mt-1">
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">{msg.fileName || 'File'}</a>
                </div>
              )}
              {idx < messages.length - 1 && <div className="border-b border-zinc-800 mt-2" />}
            </div>
          </div>
        ))}
      </div>
      <form className="flex flex-col gap-2 p-4 border-t border-zinc-800 bg-zinc-950" onSubmit={e => { e.preventDefault(); if (input.trim()) sendMessage({ text: input }); }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="p-2 rounded bg-zinc-800 text-white text-sm border border-zinc-700"
        />
        <div className="flex gap-2 items-center mt-1">
          <label
            style={{ border: '2px solid transparent', zIndex: 1000, position: 'relative' }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer text-sm font-semibold transition-colors flex items-center"
          >
            <input
              type="file"
              onChange={handleFile}
              className="hidden"
            />
            <span className="ml-1">📎 Attach file</span>
          </label>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-400 to-green-400 text-white border-none rounded px-4 py-2 font-semibold text-sm shadow transition-transform hover:scale-105"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
} 