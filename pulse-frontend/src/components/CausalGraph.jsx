import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CAUSAL_GRAPH_DATA } from '../data/demoData';

/* ── Node position layout ────────────────────────────────────────────────── */
function buildFlowData(modelId) {
  const raw = CAUSAL_GRAPH_DATA[modelId];
  if (!raw) return { nodes: [], edges: [] };

  const clinicalNodes = raw.nodes.filter(n => n.type === 'clinical');
  const demoNodes = raw.nodes.filter(n => n.type === 'demographic');
  const modelNode = raw.nodes.find(n => n.type === 'model');
  const outputNode = raw.nodes.find(n => n.type === 'output');

  const inputNodes = [...clinicalNodes, ...demoNodes];
  const spacing = 72;
  const startY = 20;

  const nodes = inputNodes.map((n, i) => ({
    id: n.id,
    position: { x: 40, y: startY + i * spacing },
    data: { ...n },
    type: 'inputNode',
    draggable: true,
  }));

  if (modelNode) {
    nodes.push({
      id: modelNode.id,
      position: { x: 360, y: startY + (inputNodes.length * spacing) / 2 - 30 },
      data: { ...modelNode },
      type: 'modelNode',
      draggable: true,
    });
  }

  if (outputNode) {
    nodes.push({
      id: outputNode.id,
      position: { x: 600, y: startY + (inputNodes.length * spacing) / 2 - 20 },
      data: { ...outputNode },
      type: 'outputNode',
      draggable: true,
    });
  }

  const edges = raw.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
    style: { stroke: e.color, strokeWidth: e.strokeWidth },
    animated: e.strokeWidth >= 5,
  }));

  return { nodes, edges };
}

/* ── Custom node components ──────────────────────────────────────────────── */
function InputNodeComponent({ data, selected }) {
  const isDemographic = data.type === 'demographic';
  const borderColor = isDemographic
    ? (data.weight === 'High' ? '#DC2626' : data.weight === 'Medium' ? '#EA580C' : '#94A3B8')
    : '#16A34A';
  const bg = selected ? (isDemographic ? '#FEF2F2' : '#DCFCE7') : '#FFFFFF';

  return (
    <div className="causal-node-enter" style={{
      padding: '8px 14px', borderRadius: 8,
      border: `2px solid ${borderColor}`, background: bg,
      fontSize: 12, fontWeight: 600, color: '#0F172A',
      minWidth: 130, textAlign: 'center',
      boxShadow: selected ? '0 0 0 2px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {data.label}
      <div style={{ fontSize: 10, fontWeight: 500, color: '#475569', marginTop: 2 }}>
        {data.weight} weight
      </div>
      <Handle type="source" position={Position.Right} style={{ background: borderColor, width: 6, height: 6, border: 'none' }} />
    </div>
  );
}

function ModelNodeComponent({ data }) {
  return (
    <div className="causal-node-enter" style={{
      padding: '16px 20px', borderRadius: 12,
      border: '2px solid #2563EB', background: '#EFF6FF',
      fontSize: 13, fontWeight: 700, color: '#1E40AF',
      textAlign: 'center', minWidth: 150,
      boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
    }}>
      ⬡ {data.label}
      <Handle type="target" position={Position.Left} style={{ background: '#2563EB', width: 6, height: 6, border: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#2563EB', width: 6, height: 6, border: 'none' }} />
    </div>
  );
}

function OutputNodeComponent({ data }) {
  return (
    <div className="causal-node-enter" style={{
      width: 80, height: 80, borderRadius: '50%',
      border: '3px solid #2563EB', background: '#DBEAFE',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      fontSize: 12, fontWeight: 700, color: '#1E40AF',
      boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
    }}>
      {data.label}
      <Handle type="target" position={Position.Left} style={{ background: '#2563EB', width: 6, height: 6, border: 'none' }} />
    </div>
  );
}

const nodeTypes = {
  inputNode: InputNodeComponent,
  modelNode: ModelNodeComponent,
  outputNode: OutputNodeComponent,
};

/* ── Inner graph with useReactFlow hook ──────────────────────────────────── */
function CausalGraphInner({ modelId }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const initialData = useMemo(() => buildFlowData(modelId), [modelId]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);
  const { fitView } = useReactFlow();

  // Reset when model changes
  useEffect(() => {
    const d = buildFlowData(modelId);
    setNodes(d.nodes);
    setEdges(d.edges);
    setSelectedNode(null);
    // Delay fitView so nodes render first
    setTimeout(() => fitView({ padding: 0.3, duration: 600 }), 100);
  }, [modelId, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback((_, node) => {
    if (node.data.type === 'clinical' || node.data.type === 'demographic') {
      setSelectedNode(node.data);
    }
  }, []);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.3, duration: 400 });
  }, [fitView]);

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Reset View button */}
        <button
          className="btn btn-secondary"
          onClick={handleResetView}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            fontSize: 12, padding: '5px 12px',
          }}
        >
          ↺ Reset View
        </button>
        <div style={{ height: 560, border: '1px solid var(--brd)', borderRadius: 10, overflow: 'hidden', background: '#FAFBFC' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#E2E8F0" gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ width: 260, flexShrink: 0 }}>
        {selectedNode ? (
          <div className="card-sm" style={{ position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: selectedNode.type === 'demographic' ? 'var(--err)' : 'var(--ok)', marginBottom: 8 }}>
              {selectedNode.type === 'demographic' ? '⚠ Demographic Factor' : '✓ Clinical Factor'}
            </div>
            <h4 style={{ marginBottom: 8 }}>{selectedNode.label}</h4>
            <div className="flex-row mb-2" style={{ gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>Weight:</span>
              <span className={`badge ${selectedNode.weight === 'High' ? 'badge-err' : selectedNode.weight === 'Medium' ? 'badge-warn' : 'badge-ok'}`}>
                {selectedNode.weight}
              </span>
            </div>
            <div className="flex-row mb-4" style={{ gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>Justified:</span>
              <span className={`badge ${selectedNode.justified ? 'badge-ok' : 'badge-err'}`}>
                {selectedNode.justified ? 'Yes' : 'No'}
              </span>
            </div>
            {selectedNode.detail && (
              <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                {selectedNode.detail}
              </p>
            )}
          </div>
        ) : (
          <div className="card-inset" style={{ textAlign: 'center', padding: '40px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--t3)' }}>
              Click any input node to see its weight classification and clinical justification.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="card-inset mt-4" style={{ padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>EDGE LEGEND</div>
          {[
            ['Thick red', 'High demographic weight (bias)', '#DC2626'],
            ['Medium orange', 'Medium demographic weight', '#EA580C'],
            ['Green', 'Clinical factor', '#16A34A'],
            ['Grey thin', 'Low / no influence', '#94A3B8'],
          ].map(([label, desc, color]) => (
            <div key={label} className="flex-row" style={{ gap: 8, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: color, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: 'var(--t2)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Exported wrapper with ReactFlowProvider ─────────────────────────────── */
export default function CausalGraph({ modelId }) {
  return (
    <ReactFlowProvider>
      <CausalGraphInner modelId={modelId} />
    </ReactFlowProvider>
  );
}
