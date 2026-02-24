'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '@/hooks/useTerminal';

interface XTerminalProps {
  sessionId: string;
  onExit?: (exitCode: number) => void;
}

export function XTerminal({ sessionId, onExit }: XTerminalProps): JSX.Element {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Terminal handle from WebSocket hook
  const terminalHandle = useTerminal(
    sessionId,
    (data) => {
      // Write data to xterm
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    },
    onExit
  );

  // Initialize xterm (client-side only)
  useEffect(() => {
    let terminal: any;
    let fitAddon: any;

    const initTerminal = async () => {
      // Dynamic imports (client-side only)
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');

      if (!terminalRef.current) return;

      // Create terminal
      terminal = new Terminal({
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: 13,
        lineHeight: 1.4,
        theme: {
          background: '#0d0d14',
          foreground: '#eeeef5',
          cursor: '#7b68ee',
          cursorAccent: '#0d0d14',
          selectionBackground: '#3d358040',
          black: '#0d0d14',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#ffb86c',
          blue: '#7b68ee',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#eeeef5',
          brightBlack: '#55556b',
          brightRed: '#ff6e6e',
          brightGreen: '#69ff94',
          brightYellow: '#ffffa5',
          brightBlue: '#d6acff',
          brightMagenta: '#ff92df',
          brightCyan: '#a4ffff',
          brightWhite: '#ffffff',
        },
        allowTransparency: true,
        cursorBlink: true,
        scrollback: 10000,
      });

      // Load addons
      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());

      // Open terminal
      terminal.open(terminalRef.current);
      fitAddon.fit();

      // Handle terminal input
      terminal.onData((data: string) => {
        terminalHandle.write(data);
      });

      // Save refs
      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;
      setIsReady(true);
    };

    initTerminal();

    // Cleanup
    return () => {
      if (terminal) {
        terminal.dispose();
      }
    };
  }, [sessionId, terminalHandle]);

  // Handle resize
  useEffect(() => {
    if (!isReady || !fitAddonRef.current || !xtermRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        terminalHandle.resize(cols, rows);
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isReady, terminalHandle]);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full"
      style={{ backgroundColor: '#0d0d14' }}
    />
  );
}
