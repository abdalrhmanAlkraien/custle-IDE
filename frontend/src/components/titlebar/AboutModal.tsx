'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HealthStatus {
  status: string;
  version: string;
  uptime: number;
  workspace: string | null;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [backendVersion, setBackendVersion] = useState<string>('unknown');

  useEffect(() => {
    if (!isOpen) return;

    // Check backend health
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          const data: HealthStatus = await response.json();
          setBackendOnline(true);
          setBackendVersion(data.version);
        } else {
          setBackendOnline(false);
        }
      } catch (error) {
        setBackendOnline(false);
      }
    };

    checkHealth();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl p-6 min-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-[#cccccc] hover:text-white hover:bg-[#3c3c3c] p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className="text-4xl mb-2">🧠</div>
          <h1 className="text-2xl font-bold text-white">Custle IDE</h1>
          <p className="text-[#858585] text-sm">Version {backendVersion}</p>

          <p className="text-[#cccccc] text-sm max-w-sm mx-auto leading-relaxed">
            AI-powered local IDE with Monaco editor, real terminal, Git integration, and AI agent.
          </p>

          <div className="border-t border-[#3c3c3c] pt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#858585]">Backend:</span>
              <span className="text-[#cccccc]">
                http://localhost:3001{' '}
                {backendOnline ? <span className="text-green-500">✅</span> : <span className="text-red-500">❌</span>}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#858585]">Frontend:</span>
              <span className="text-[#cccccc]">http://localhost:3000</span>
            </div>
          </div>

          <p className="text-[#858585] text-xs pt-4">
            Built with Next.js, TypeScript, Monaco Editor, xterm.js
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
