import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { useUser } from "@clerk/nextjs";
import { useCall } from "@stream-io/video-react-sdk";

type WhiteboardProps = {
  roomId: string;
};

type Participant = {
  userId: string;
  name: string;
  username: string;
};

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const { user } = useUser();
  const call = useCall();
  const [isLoading, setIsLoading] = useState(true);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ymapRef = useRef<Y.Map<any> | null>(null);
  const [tldrawState, setTldrawState] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [allCanEdit, setAllCanEdit] = useState(true);
  
  const userId = user?.id || "unknown";
  const hostId = call?.state?.createdBy?.id;

  useEffect(() => {
    if (!roomId) return;
    
    // Initialize Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    // Initialize WebSocket provider with proper error handling
    try {
      const wsUrl = process.env.NEXT_PUBLIC_YJS_URL || 'ws://localhost:1234';
      const roomName = `${roomId}-whiteboard`;
      
      console.log(`Connecting to YJS server at ${wsUrl} for room ${roomName}`);
      
      const provider = new WebsocketProvider(wsUrl, roomName, ydoc, {
        connect: true,
        awareness: {
          // Add user awareness information
          user: {
            id: userId,
            name: user?.firstName || 'Anonymous',
            color: getRandomColor(userId),
          }
        }
      });
      
      providerRef.current = provider;
      
      // Handle connection status
      provider.on('status', (event: { status: string }) => {
        console.log('YJS connection status:', event.status);
        if (event.status === 'connected') {
          console.log('Connected to YJS server');
        }
      });
      
      // Handle connection errors
      provider.on('connection-error', (error: Error) => {
        console.error('YJS connection error:', error);
      });
      
      // Initialize the maps
      const tldrawMap = ydoc.getMap('tldraw');
      ymapRef.current = tldrawMap;
      
      // Map for permissions
      const permissionsMap = ydoc.getMap('permissions');
      
      // Listen for whiteboard state changes
      const updateTldrawState = () => {
        const state = tldrawMap.get('state');
        if (state) {
          setTldrawState(state);
        }
      };
      
      // Listen for permission changes
      const updatePermissions = () => {
        setAllCanEdit(permissionsMap.get('allCanEdit') ?? true);
        setUserPermissions(permissionsMap.get('userPermissions') ?? {});
      };
      
      // Set up observers
      tldrawMap.observe(updateTldrawState);
      permissionsMap.observe(updatePermissions);
      
      // Initial state update
      updateTldrawState();
      updatePermissions();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error setting up YJS:', error);
      setIsLoading(false);
    }
    
    // Cleanup
    return () => {
      try {
        if (ymapRef.current) {
          // Properly remove observers
          ymapRef.current.unobserve();
        }
        
        if (providerRef.current) {
          providerRef.current.disconnect();
          providerRef.current.destroy();
          providerRef.current = null;
        }
        
        if (ydocRef.current) {
          ydocRef.current.destroy();
          ydocRef.current = null;
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [roomId, userId, user?.firstName]);
  
  // Generate a random color based on user ID for consistent colors
  const getRandomColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 95%, 60%)`;
  };

  // Get participants from call.state.members
  const participants = call
    ? Object.values(call.state.members).map((m: any) => ({
        userId: m.user.id,
        name: m.user.name,
        username: m.user.name,
      }))
    : [];

  const isHost = userId === hostId;
  const canEdit = allCanEdit || isHost || userPermissions[userId];

  // Handler to sync Tldraw state to yjs
  const handleTldrawChange = (state: any) => {
    if (!ymapRef.current || !canEdit) return;
    
    try {
      ymapRef.current.set('state', state);
    } catch (error) {
      console.error('Error updating Tldraw state:', error);
    }
  };
  
  // Toggle permissions for all users
  const toggleAllCanEdit = () => {
    if (!ydocRef.current || !isHost) return;
    
    try {
      const permissionsMap = ydocRef.current.getMap('permissions');
      permissionsMap.set('allCanEdit', !allCanEdit);
    } catch (error) {
      console.error('Error toggling all permissions:', error);
    }
  };
  
  // Toggle permission for a specific user
  const toggleUserPermission = (participantId: string) => {
    if (!ydocRef.current || !isHost) return;
    
    try {
      const permissionsMap = ydocRef.current.getMap('permissions');
      const currentPerms = permissionsMap.get('userPermissions') || {};
      const updatedPerms = { 
        ...currentPerms, 
        [participantId]: !currentPerms[participantId] 
      };
      permissionsMap.set('userPermissions', updatedPerms);
    } catch (error) {
      console.error('Error toggling user permission:', error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[65vh] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700/50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-green-500/20 border-b border-zinc-700/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
            <h2 className="text-sm font-medium text-zinc-200">Collaborative Whiteboard</h2>
          </div>
          <div className="flex items-center gap-4">
            {isHost && (
              <span className="text-blue-400 text-xs bg-zinc-800 rounded px-2 ml-2 border border-blue-400 font-bold tracking-wide">Host</span>
            )}
            {!canEdit && <span className="text-red-400 text-xs bg-zinc-800 rounded px-2 border border-red-400 font-semibold">View Only</span>}
            <div className="text-xs bg-zinc-800/70 text-zinc-400 px-2 py-1 rounded-full border border-zinc-700/30">
              Room: {roomId.substring(0, 8)}...
            </div>
          </div>
        </div>
        
        {/* Permissions Panel (for host only) */}
        {isHost && (
          <div className="bg-zinc-800 border-b border-zinc-700/50 px-4 py-2">
            <label className="mb-2 block text-blue-400 font-medium text-sm">
              <input 
                type="checkbox" 
                checked={allCanEdit} 
                onChange={toggleAllCanEdit} 
                className="mr-2" 
              /> 
              All participants can edit the whiteboard
            </label>
            
            {!allCanEdit && participants.length > 0 && (
              <div className="mt-2 mb-1 grid grid-cols-2 gap-2">
                {participants.map((p) => (
                  <div key={p.userId} className="flex items-center mb-2 bg-zinc-700/30 rounded px-2 py-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs mr-2">
                      {p.name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="mr-2 font-medium text-xs text-zinc-300 truncate">{p.name || p.username || ""}</span>
                    {p.userId !== userId && (
                      <label className="ml-auto text-xs text-white">
                        <input
                          type="checkbox"
                          checked={!!userPermissions[p.userId]}
                          onChange={() => toggleUserPermission(p.userId)}
                          className="mr-1"
                        />
                        Edit
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Whiteboard Container */}
        <div className="flex-1 bg-white">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-zinc-100">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-zinc-600 text-sm">Loading whiteboard...</p>
              </div>
            </div>
          ) : (
            <Tldraw
              snapshot={tldrawState}
              onChange={handleTldrawChange}
              readOnly={!canEdit}
            />
          )}
        </div>
      </div>
      <div className="mt-4 text-center text-xs text-zinc-500">
        <p>Draw, sketch, and collaborate in real-time with other participants</p>
        {!canEdit && <p className="text-amber-500 mt-1">You are in view-only mode. Only the host can enable editing for you.</p>}
      </div>
    </div>
  );
};

export default Whiteboard;