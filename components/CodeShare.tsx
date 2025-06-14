import { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCallState } from '@/context/CallProvider';

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

    setCanEdit(isHost || hasGlobalPermission || !!hasIndividualPermission);
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
    <div className="h-full flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700/50 shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-500/20 border-b border-zinc-700/50 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <h2 className="text-sm font-medium text-zinc-200">Collaborative Code Editor</h2>
          </div>
          <div className="flex items-center gap-2">
            {isHost ? (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium">Host</span>
            ) : (
              <span className={`text-xs ${canEdit ? 'bg-green-500/20 text-green-300' : 'bg-zinc-700/50 text-zinc-400'} px-2 py-0.5 rounded-full font-medium`}>
                {canEdit ? 'Can Edit' : 'View Only'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-800/50 border-b border-zinc-700/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <label htmlFor="language-select" className="text-xs text-zinc-400">Language:</label>
            <select 
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className="text-xs bg-zinc-900 text-zinc-300 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="h-4 border-r border-zinc-700/50"></div>
          
          <div className="text-xs text-zinc-400 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Auto-saving</span>
          </div>
        </div>
        
        <div className="text-xs text-zinc-400">
          Room: {roomId.substring(0, 8)}...
        </div>
      </div>

      {/* Permissions Panel (for host) */}
      {isHost && (
        <div className="bg-zinc-800/30 border-b border-zinc-700/30 px-4 py-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-zinc-300 gap-2">
              <input
                type="checkbox"
                checked={allCanEdit}
                onChange={toggleAllCanEdit}
                className="rounded text-blue-500 focus:ring-blue-500 bg-zinc-700 border-zinc-600 h-4 w-4"
              />
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Allow all participants to edit
              </span>
              {allCanEdit && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Enabled</span>
              )}
            </label>
            
            {!allCanEdit && participants.length > 1 && (
              <button 
                onClick={() => document.getElementById('permissions-dropdown')?.classList.toggle('hidden')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Individual permissions</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            )}
          </div>
          
          {!allCanEdit && participants.length > 1 && (
            <div id="permissions-dropdown" className="mt-2 pt-2 border-t border-zinc-700/30 hidden">
              <div className="text-xs text-zinc-400 mb-2">Select who can edit the code:</div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {participants.map((p) => {
                  if (p.id === userId) return null; // Skip current user
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-zinc-800/50 rounded-md p-2 border border-zinc-700/30">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                          {p.name[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-zinc-300">{p.name}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!userPermissions[p.id]}
                          onChange={() => toggleUserEdit(p.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
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
      <div className="flex-1">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-zinc-900">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-zinc-400 text-sm">Loading code editor...</p>
            </div>
          </div>
        ) : (
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
              fontSize: 14,
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
            }}
          />
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