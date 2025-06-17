'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { format } from 'date-fns';
import { Loader2, Upload, X } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  user: {
    name: string;
    id: string;
    image?: string;
  };
  createdAt: Date;
  isHost?: boolean;
  file?: {
    url: string;
    name: string;
    publicId: string;
  };
};

interface ChatSidebarProps {
  roomId: string;
  onClose: () => void;
  className?: string;
}

const ChatSidebar = ({ roomId, onClose, className }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { useCall } = useCallStateHooks();
  const call = useCall();
  const { user } = useUser();

  // Scroll to the latest message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Initialize Yjs document and WebSocket provider
  useEffect(() => {
    if (!roomId) return;

    try {
      const doc = new Y.Doc();
      setYdoc(doc);

      // Connect to the WebSocket server
      const wsProvider = new WebsocketProvider(
        'wss://demos.yjs.dev', // Use your WebSocket server URL
        `connectnow-chat-${roomId}`,
        doc
      );

      wsProvider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          setConnectionStatus('connected');
          console.log('Connected to WebSocket server');
        } else {
          setConnectionStatus(event.status === 'connecting' ? 'connecting' : 'disconnected');
        }
      });

      wsProvider.on('connection-error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('disconnected');
      });

      setProvider(wsProvider);

      // Get the messages array from the Yjs document
      const yarray = doc.getArray<any>('messages');

      // Observe changes to the messages array
      yarray.observe((event) => {
        // Convert Yjs array to regular array of messages
        const messagesArray = yarray.toArray().map((item) => ({
          id: item.id,
          text: item.text,
          user: item.user,
          createdAt: new Date(item.createdAt),
          isHost: item.isHost,
          file: item.file,
        }));

        setMessages(messagesArray);
        // Scroll to bottom when new messages arrive
        setTimeout(scrollToBottom, 100);
      });

      // Initial load of messages
      const initialMessages = yarray.toArray().map((item) => ({
        id: item.id,
        text: item.text,
        user: item.user,
        createdAt: new Date(item.createdAt),
        isHost: item.isHost,
        file: item.file,
      }));

      setMessages(initialMessages);
      setTimeout(scrollToBottom, 100);

      return () => {
        wsProvider.disconnect();
        doc.destroy();
      };
    } catch (error) {
      console.error('Error initializing Yjs:', error);
      setConnectionStatus('disconnected');
    }
  }, [roomId]);

  // Send a message
  const sendMessage = (text: string, file?: { url: string; name: string; publicId: string }) => {
    if ((!text || text.trim() === '') && !file) return;
    
    if (!ydoc || !provider || !user) {
      console.error('Cannot send message: missing ydoc, provider, or user');
      return;
    }

    try {
      const yarray = ydoc.getArray<any>('messages');
      const message: Message = {
        id: crypto.randomUUID(),
        text: text.trim(),
        user: {
          name: user.fullName || user.username || 'Anonymous',
          id: user.id,
          image: user.imageUrl,
        },
        createdAt: new Date(),
        isHost: call?.createdBy?.id === user.id,
        file,
      };

      // Add the message to the Yjs array
      yarray.push([message]);
      setInput('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle file selection
  const handleFile = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      
      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Send a message with the file
      sendMessage(
        `Shared a file: ${file.name}`,
        {
          url: data.secure_url,
          name: file.name,
          publicId: data.public_id,
        }
      );
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  useEffect(() => {
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
        handleFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div
      className={cn(
        'flex h-full w-80 flex-col border-l border-zinc-700 bg-zinc-900',
        className
      )}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
        <h2 className="text-xl font-semibold text-zinc-50">Chat</h2>
        <div className="flex items-center gap-2">
          {connectionStatus !== 'connected' && (
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Loader2 size={12} className="animate-spin" />
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
            </div>
          )}
          <Button
            onClick={onClose}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 z-10">
            <div className="rounded-lg border-2 border-dashed border-zinc-700 p-8 text-center">
              <Upload className="mx-auto h-10 w-10 text-zinc-500" />
              <p className="mt-2 text-sm text-zinc-400">Drop your file to share</p>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-zinc-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.user.image} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-50">
                    {message.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-50">
                      {message.user.name}
                    </p>
                    {message.isHost && (
                      <span className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-400">
                        Host
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {format(message.createdAt, 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300">{message.text}</p>
                  {message.file && (
                    <div className="mt-2 rounded-lg bg-zinc-800 p-2">
                      <a
                        href={message.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {message.file.name}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="border-t border-zinc-700 p-4"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100"
            disabled={connectionStatus !== 'connected' || isUploading}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
            onClick={() => fileInputRef.current?.click()}
            disabled={connectionStatus !== 'connected' || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </Button>
          <Button
            type="submit"
            className="h-10 w-10 shrink-0"
            size="icon"
            disabled={(!input || input.trim() === '') || connectionStatus !== 'connected' || isUploading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Drag and drop files to share them
        </p>
      </form>
    </div>
  );
};

export default ChatSidebar;