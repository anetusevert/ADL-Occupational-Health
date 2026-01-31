/**
 * CustomEdge - n8n-style edge with clean bezier curves
 */

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

interface CustomEdgeProps extends EdgeProps {
  data?: {
    label?: string;
  };
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: CustomEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Main edge path - n8n style gray line */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={3}
        stroke="#94a3b8"
        fill="none"
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />
      
      {/* Hover highlight path (wider, transparent for easier clicking) */}
      <path
        d={edgePath}
        strokeWidth={12}
        stroke="transparent"
        fill="none"
        className="react-flow__edge-interaction"
      />
      
      {/* Optional label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-[10px] text-slate-300 shadow-sm"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default CustomEdge;
