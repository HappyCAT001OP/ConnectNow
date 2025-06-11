"use client";

export default function TestFileInput() {
  return (
    <div style={{ padding: 40 }}>
      <label style={{ background: '#2563eb', color: 'white', padding: 12, borderRadius: 8, cursor: 'pointer' }}>
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={e => alert('File selected!')}
        />
        📎 Attach file
      </label>
    </div>
  );
} 