import { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

// Temporary solution until CallProvider is properly integrated
const useCallState = () => {
  const { useCallStateHooks } = require('@stream-io/video-react-sdk');
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  
  return {
    callState: {
      participants: session?.participants || {},
      hostId: session?.createdBy?.id || null
    },
    userId: session?.sessionId || ''
  };
};

type CodeShareProps = {
  roomId: string;
};

const CodeShare = ({ roomId }: CodeShareProps) => {
  const [code, setCode] = useState<string>('// Start coding here...\n');
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [allCanEdit, setAllCanEdit] = useState<boolean>(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState<string>('javascript');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPermissions, setShowPermissions] = useState<boolean>(false);
  
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const yMapRef = useRef<Y.Map<any> | null>(null);

  const { callState, userId } = useCallState();

  useEffect(() => {
    // Initialize Yjs document and provider
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    const wsProvider = new WebsocketProvider(
      'wss://demos.yjs.dev', // Replace with your WebSocket server
      `connectnow-code-${roomId}`,
      ydoc
    );
    providerRef.current = wsProvider;

    // Create shared text
    const yText = ydoc.getText('monaco');
    yTextRef.current = yText;

    // Create shared map for permissions
    const yMap = ydoc.getMap('permissions');
    yMapRef.current = yMap;

    // Initialize permissions
    yMap.observe(event => {
      const permissions: Record<string, boolean> = {};
      const allCanEdit = yMap.get('allCanEdit') || false;
      
      yMap.forEach((value, key) => {
        if (key !== 'allCanEdit') {
          permissions[key] = value;
        }
      });

      setUserPermissions(permissions);
      setAllCanEdit(allCanEdit);
    });

    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Cleanup
    return () => {
      wsProvider.disconnect();
      ydoc.destroy();
    };
  }, [roomId]);

  // Extract participants from call state
  const participants = Object.values(callState?.participants || {});

  // Determine if current user can edit
  useEffect(() => {
    const isHost = callState?.hostId === userId;
    const hasGlobalPermission = allCanEdit;
    const hasIndividualPermission = userPermissions[userId];

    // Set canEdit to true if user is host, has global permission, or has individual permission
    setCanEdit(isHost || hasGlobalPermission || !!hasIndividualPermission);
    
    // Log permission status for debugging
    console.log('Permission status:', { 
      isHost, 
      hasGlobalPermission, 
      hasIndividualPermission, 
      canEdit: isHost || hasGlobalPermission || !!hasIndividualPermission 
    });
  }, [callState?.hostId, userId, allCanEdit, userPermissions]);

  // Handle editor initialization
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (yTextRef.current && ydocRef.current) {
      new MonacoBinding(
        yTextRef.current,
        editor.getModel(),
        new Set([editor]),
        ydocRef.current
      );
    }
  };

  // Handle code changes
  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  // Toggle permissions for all users
  const toggleAllCanEdit = () => {
    if (yMapRef.current) {
      yMapRef.current.set('allCanEdit', !allCanEdit);
    }
  };

  // Toggle permissions for a specific user
  const toggleUserEdit = (userId: string) => {
    if (yMapRef.current) {
      yMapRef.current.set(userId, !userPermissions[userId]);
    }
  };

  // Change language
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const isHost = callState?.hostId === userId;

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700/50 shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-500/20 border-b border-zinc-700/50 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 flex items-center justify-center bg-blue-500/20 rounded-lg border border-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Collaborative Code Editor</h2>
              <p className="text-xs text-zinc-400">Real-time collaboration with your team</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isHost ? (
              <span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-medium border border-purple-500/30 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                Host
              </span>
            ) : (
              <span className={`text-sm ${canEdit ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30'} px-3 py-1 rounded-full font-medium border flex items-center gap-1`}>
                {canEdit ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Can Edit
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Only
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-800/80 border-b border-zinc-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-sm text-zinc-300 font-medium">Language:</label>
            <select 
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className="text-sm bg-zinc-900 text-zinc-200 border border-zinc-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="h-6 border-r border-zinc-700/50"></div>
          
          <div className="text-sm text-zinc-300 flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            <span>Auto-saving enabled</span>
          </div>

          <div className="text-sm text-zinc-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <span>Font Size:</span>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 flex items-center justify-center rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span className="w-6 text-center">14</span>
              <button className="w-6 h-6 flex items-center justify-center rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-300 bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700/50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <span>Room: {roomId.substring(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Permissions Panel (for host) */}
      {isHost && (
        <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-b border-zinc-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center bg-blue-500/10 rounded-lg border border-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-200">Editing Permissions</h3>
                <p className="text-xs text-zinc-400">Control who can edit the shared code</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 bg-blue-600/20 px-4 py-2 rounded-lg border border-blue-500/30 hover:bg-blue-600/30 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={allCanEdit}
                  onChange={toggleAllCanEdit}
                  className="rounded text-blue-500 focus:ring-blue-500 bg-zinc-700 border-zinc-600 h-4 w-4"
                />
                <span className="flex items-center gap-2 text-sm text-blue-200 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Allow all participants to edit
                </span>
                {allCanEdit && (
                  <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/40">Enabled</span>
                )}
              </label>
              
              {!allCanEdit && participants.length > 1 && (
                <button 
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 bg-zinc-800/80 px-4 py-2 rounded-lg border border-zinc-700/50 hover:bg-zinc-700/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                  <span>Individual permissions</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={showPermissions ? "rotate-180 transform" : ""}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {!allCanEdit && participants.length > 1 && showPermissions && (
            <div className="mt-3 pt-3 border-t border-zinc-700/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                  Participant Permissions
                </div>
                <div className="text-xs text-zinc-400">Toggle switches to grant or revoke editing access</div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {participants.map((p) => {
                  if (p.id === userId) return null; // Skip current user
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-zinc-800/80 rounded-lg p-3 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {p.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm text-zinc-200 font-medium">{p.name}</div>
                          <div className="text-xs text-zinc-400">{p.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!userPermissions[p.id]}
                          onChange={() => toggleUserEdit(p.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-zinc-900">
            <div className="flex flex-col items-center bg-zinc-800/50 p-8 rounded-xl border border-zinc-700/50 shadow-2xl">
              <div className="w-16 h-16 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-zinc-200 text-base font-medium mb-1">Loading code editor...</p>
              <p className="text-zinc-400 text-sm">Preparing your collaborative environment</p>
            </div>
          </div>
        ) : (
          <>
            <MonacoEditor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleChange}
              onMount={handleEditorDidMount}
              options={{
                readOnly: !canEdit,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: fontSize,
                wordWrap: 'on',
                automaticLayout: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
                padding: { top: 16, bottom: 16 },
              }}
            />
            
            {/* Read-only indicator */}
            {!canEdit && (
              <div className="absolute top-4 left-4 bg-zinc-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-700/50 shadow-lg flex items-center gap-2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="text-xs text-zinc-300">Read-only mode</span>
              </div>
            )}
            
            {/* Status indicator */}
            <div className="absolute bottom-4 right-4 bg-zinc-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-700/50 shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-zinc-300">Connected to {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
          </>
        )}
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(82, 82, 91, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(82, 82, 91, 0.7);
        }
      `}</style>
    </div>
  );
};

export default CodeShare;
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
    <span className="text-xs text-zinc-300">Read-only mode</span>
  </div>
)}

{/* Status indicator */}
<div className="absolute bottom-4 right-4 bg-zinc-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-700/50 shadow-lg flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
  <span className="text-xs text-zinc-300">Connected to {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
</div>

{/* Add custom scrollbar styles */}
<style jsx>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(39, 39, 42, 0.3);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(82, 82, 91, 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(82, 82, 91, 0.7);
  }
`}</style>
</div>
);
};

export default CodeShare;