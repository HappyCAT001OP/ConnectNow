import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

type WhiteboardProps = {
  roomId: string;
};

const Whiteboard = ({ roomId }: WhiteboardProps) => {
  return (
    <div style={{ height: '80vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, height: '65vh', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', border: '1px solid #23232b', overflow: 'hidden' }}>
        <Tldraw />
      </div>
    </div>
  );
};

export default Whiteboard; 