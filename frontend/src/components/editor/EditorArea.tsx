/**
 * Editor Area
 *
 * Main editor container with:
 * - Tab bar (when tabs open)
 * - Monaco editor (when tabs open)
 * - Placeholder (when no tabs)
 *
 * IMPORTANT: Monaco is dynamically imported (ssr: false)
 */

'use client';

import dynamic from 'next/dynamic';
import { useIDEStore } from '@/store/ideStore';
import { EditorTabs } from './EditorTabs';
import { EditorPlaceholder } from './EditorPlaceholder';

// Dynamic import with ssr: false - CRITICAL for Monaco
const MonacoEditor = dynamic(
  () => import('./MonacoEditor').then((mod) => ({ default: mod.MonacoEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#0d0d14]">
        <div className="text-[#9999bb] text-sm">Loading editor...</div>
      </div>
    ),
  }
);

export function EditorArea(): JSX.Element {
  const tabs = useIDEStore((state) => state.tabs);

  return (
    <div className="h-full flex flex-col bg-[#0d0d14]">
      {/* Show tabs if any files are open */}
      {tabs.length > 0 && <EditorTabs />}

      {/* Editor or placeholder */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.length > 0 ? <MonacoEditor /> : <EditorPlaceholder />}
      </div>
    </div>
  );
}
