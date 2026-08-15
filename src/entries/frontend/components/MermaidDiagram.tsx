// components/MermaidDiagram.tsx
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import mermaid from 'mermaid';

let initialized = false;

function initMermaid(theme: 'default' | 'dark' | 'neutral' | 'forest' = 'default') {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: 'loose',
    fontFamily: 'inherit',
  });
  initialized = true;
}

interface MermaidDiagramProps {
  chart: string;
  theme?: 'default' | 'dark' | 'neutral' | 'forest';
  className?: string;
}

export default function MermaidDiagram({
  chart,
  theme = 'default',
  className = '',
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    initMermaid(theme);

    let cancelled = false;

    async function render() {
      try {
        const id = 'mermaid-' + Math.random().toString(36).slice(2, 9);
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Render error');
          setSvg('');
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, theme]);

  if (error) {
    return (
      <div className={`mermaid-error ${className}`} style={{ color: '#ef4444', fontSize: 14 }}>
        <strong>Diagram error:</strong> {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
