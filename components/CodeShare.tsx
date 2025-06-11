import { useUser } from '@clerk/nextjs';
import { useCall } from '@stream-io/video-react-sdk';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeShareProps = {
  roomId: string;
};

const CodeShare = ({ roomId }: CodeShareProps) => {
  const { user } = useUser();
  const call = useCall();
  const [code, setCode] = useState('// Start coding here...');
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const ymapRef = useRef<Y.Map<any> | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [allCanEdit, setAllCanEdit] = useState(true);

  const userId = user?.id || 'unknown';
  const hostId = call?.state?.createdBy?.id;

  useEffect(() => {
    if (!roomId) return;

    // Initialize Yjs document
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
      ytextRef.current = ydocRef.current.getText('monaco');
    }

    // Initialize WebSocket provider
    if (!providerRef.current) {
      providerRef.current = new WebsocketProvider(process.env.NEXT_PUBLIC_YJS_URL!, roomId + '-code', ydocRef.current!);
    }

    // Listen for code changes (only update if not local change)
    const handleYTextChange = (event: Y.YTextEvent) => {
      if (event.transaction.origin !== 'monaco') {
        setCode(ytextRef.current ? ytextRef.current.toString() : '');
      }
    };
    if (ytextRef.current) {
      ytextRef.current.observe(handleYTextChange);
      setCode(ytextRef.current.toString());
    }

    // Initialize the map if not already
    if (!ymapRef.current && ydocRef.current) {
      ymapRef.current = ydocRef.current.getMap('permissions');
    }

    // Listen for permission changes
    const updatePermissions = () => {
      setAllCanEdit(ymapRef.current?.get('allCanEdit') ?? true);
      setUserPermissions(ymapRef.current?.get('userPermissions') ?? {});
    };

    // Only observe if the map exists
    if (ymapRef.current) {
      ymapRef.current.observeDeep(updatePermissions);
      updatePermissions();
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
      if (ymapRef.current) {
        ymapRef.current.unobserveDeep(updatePermissions);
      }
      if (ytextRef.current) {
        ytextRef.current.unobserve(handleYTextChange);
      }
    };
  }, [roomId]);

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

  const handleChange = (value: string | undefined) => {
    if (canEdit && ytextRef.current && value !== undefined) {
      ytextRef.current.doc?.transact(() => {
        ytextRef.current!.delete(0, ytextRef.current!.length);
        ytextRef.current!.insert(0, value, 'monaco');
      }, 'monaco');
    }
  };

  return (
    <div className="h-[80vh] w-full flex flex-col items-center justify-start font-sans">
      <div className="w-full max-w-[900px] mx-auto bg-zinc-900 rounded-xl shadow-lg p-6 border border-zinc-800">
        <div className="flex items-center mb-4 justify-between">
          <h2 className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent font-bold text-xl tracking-wide m-0">Code Share</h2>
          <div className="flex items-center gap-4">
            {isHost && (
              <span className="text-blue-400 text-xs bg-zinc-800 rounded px-2 ml-2 border border-blue-400 font-bold tracking-wide">Host</span>
            )}
            {!canEdit && <span className="text-red-400 text-xs bg-zinc-800 rounded px-2 border border-red-400 font-semibold">View Only</span>}
          </div>
        </div>
        {isHost && (
          <div className="mb-4">
            <label className="mb-2 block text-blue-400 font-medium text-sm">
              <input type="checkbox" checked={allCanEdit} onChange={() => ymapRef.current?.set('allCanEdit', !allCanEdit)} className="mr-2" /> All participants can edit and share code
            </label>
            {!allCanEdit && participants.map((p) => (
              <div key={p.userId} className="flex items-center mb-2 bg-zinc-800 rounded px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-base mr-2">
                  {p.name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="mr-2 font-medium text-sm">{p.name || p.username || ''}</span>
                {p.userId !== userId && (
                  <label className="ml-auto text-xs text-white">
                    <input
                      type="checkbox"
                      checked={!!userPermissions[p.userId]}
                      onChange={() => {
                        const perms = { ...userPermissions, [p.userId]: !userPermissions[p.userId] };
                        ymapRef.current?.set('userPermissions', perms);
                      }}
                      className="mr-1"
                    />
                    Can edit code
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 transition-shadow">
          <MonacoEditor
            height="60vh"
            defaultLanguage="javascript"
            value={code}
            onChange={handleChange}
            theme="vs-dark"
            options={{ readOnly: !canEdit, fontSize: 16, fontFamily: 'Fira Mono, monospace', minimap: { enabled: false }, padding: { top: 16, bottom: 16 } }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeShare; 