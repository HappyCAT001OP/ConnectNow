'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useCallStateHooks, useCall } from '@stream-io/video-react-sdk';

type CallState = {
  participants: Record<string, any>;
  hostId: string | null;
};

type CallProviderContextType = {
  callState: CallState | null;
  userId: string;
};

const CallProviderContext = createContext<CallProviderContextType | undefined>(undefined);

export const CallProvider = ({ children, userId }: { children: ReactNode; userId: string }) => {
  const [callState, setCallState] = useState<CallState | null>(null);
  const { useCallParticipants } = useCallStateHooks();
  const call = useCall();
  const participants = useCallParticipants();

  useEffect(() => {
    if (!call) return;

    // Get host ID from call
    const hostId = call.state.createdBy?.id || null;

    // Create call state with participants and host ID
    setCallState({
      participants: participants.reduce((acc, participant) => {
        acc[participant.userId] = {
          id: participant.userId,
          name: participant.name || 'Unknown',
          isHost: participant.userId === hostId,
        };
        return acc;
      }, {} as Record<string, any>),
      hostId,
    });
  }, [call, participants]);

  return (
    <CallProviderContext.Provider value={{ callState, userId }}>
      {children}
    </CallProviderContext.Provider>
  );
};

export const useCallState = () => {
  const context = useContext(CallProviderContext);
  if (context === undefined) {
    throw new Error('useCallState must be used within a CallProvider');
  }
  return context;
};