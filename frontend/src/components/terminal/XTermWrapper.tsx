'use client';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface XTermWrapperProps {
  sessionId: string;
  cwd?: string;
}

export default function XTermWrapper({ sessionId, cwd }: XTermWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create xterm instance
    const term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#1e1e1e',
        brightBlack: '#808080',
        red: '#cd3131',
        brightRed: '#f14c4c',
        green: '#0dbc79',
        brightGreen: '#23d18b',
        yellow: '#e5e510',
        brightYellow: '#f5f543',
        blue: '#2472c8',
        brightBlue: '#3b8eea',
        magenta: '#bc3fbc',
        brightMagenta: '#d670d6',
        cyan: '#11a8cd',
        brightCyan: '#29b8db',
        white: '#e5e5e5',
        brightWhite: '#ffffff',
      },
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;
    fitRef.current = fitAddon;

    // 2. Open WebSocket
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      // Request PTY session
      ws.send(JSON.stringify({ type: 'terminal:create', sessionId, cwd }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'terminal:output' && msg.sessionId === sessionId) {
        term.write(msg.data);
      }

      if (msg.type === 'terminal:created' && msg.sessionId === sessionId) {
        console.log(`Terminal session created: ${sessionId}, PID: ${msg.pid}`);
      }

      if (msg.type === 'terminal:error' && msg.sessionId === sessionId) {
        term.writeln(`\r\n\x1b[31mError: ${msg.error}\x1b[0m\r\n`);
      }

      if (msg.type === 'terminal:exit' && msg.sessionId === sessionId) {
        term.writeln(`\r\n\x1b[33mProcess exited with code ${msg.exitCode}\x1b[0m\r\n`);
      }
    };

    ws.onerror = () => {
      term.writeln(
        '\r\n\x1b[31mWebSocket connection failed. Is the backend running?\x1b[0m\r\n'
      );
    };

    // 3. Pipe keystrokes → backend
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:input', sessionId, data }));
      }
    });

    // 4. Handle resize
    const observer = new ResizeObserver(() => {
      if (fitRef.current && termRef.current) {
        fitRef.current.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'terminal:resize',
              sessionId,
              cols: termRef.current.cols,
              rows: termRef.current.rows,
            })
          );
        }
      }
    });
    observer.observe(containerRef.current);

    // 5. Cleanup
    return () => {
      observer.disconnect();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:kill', sessionId }));
        ws.close();
      }
      term.dispose();
    };
  }, [sessionId, cwd]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full p-1"
      style={{ minHeight: 0 }} // critical for flexbox sizing
    />
  );
}
