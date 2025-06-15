import dynamic from 'next/dynamic';

const TestWhiteboard = dynamic(() => import('@/components/TestWhiteboard'), { ssr: false });

export default function Page() {
  return <TestWhiteboard />;
} 