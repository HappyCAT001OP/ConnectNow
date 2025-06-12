import { useUser } from '@clerk/nextjs';
import { useCall } from '@stream-io/video-react-sdk';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { useUploadThing } from "./uploadthing";

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

  const { startUpload } = useUploadThing("messageFile", {
    onClientUploadComplete: (res) => {
      console.log("UploadThing client complete:", res);
      if (res && res.length > 0) {
        const { fileUrl, fileName } = res[0].serverData;
        // Store file metadata in Neon DB (if needed, otherwise handle directly)
        fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: fileUrl,
            name: fileName,
            userId: userId,
          }),
        })
          .then(res => res.json())
          .then(fileData => {
            sendMessage({ fileUrl, fileName, fileId: fileData.id });
            console.log("File metadata stored and chat message sent.");
          })
          .catch(error => {
            console.error("Failed to store file metadata:", error);
            alert('Failed to store file metadata!');
          });
      }
    },
    onUploadError: (error: Error) => {
      alert(`ERROR! ${error.message}`);
      console.error("UploadThing error:", error);
    },
  });

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

    console.log("Attempting to upload file with UploadThing:", selectedFile.name);
    await startUpload([selectedFile]);
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