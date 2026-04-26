import { Background, Controls, MarkerType, ReactFlow } from "@xyflow/react";

function buildNodes(graph) {
  const clinicalNodes = graph.clinical.map((node, index) => ({
    id: `clinical-${node.label}`,
    position: { x: 24, y: 24 + index * 96 },
    data: {
      label: (
        <div className="flow-node-card">
          <strong>{node.label}</strong>
          <span>{node.weight}</span>
        </div>
      ),
    },
    style: {
      width: 180,
      borderRadius: 16,
      border: "1.5px solid #b8d5f0",
      background: "#f4faff",
      color: "#1f3864",
      boxShadow: "0 14px 26px rgba(31, 56, 100, 0.08)",
    },
  }));

  const demographicNodes = graph.demographic.map((node, index) => ({
    id: `demographic-${node.label}`,
    position: { x: 24, y: 24 + (graph.clinical.length + index) * 96 },
    data: {
      label: (
        <div className="flow-node-card">
          <strong>{node.label}</strong>
          <span>{node.weight}</span>
        </div>
      ),
    },
    style: {
      width: 180,
      borderRadius: 16,
      border: "1.5px dashed #c00000",
      background: "#fff4f4",
      color: "#8b1d1d",
      boxShadow: "0 14px 26px rgba(192, 0, 0, 0.08)",
    },
  }));

  const targetY = Math.max(
    160,
    ((clinicalNodes.length + demographicNodes.length - 1) * 96) / 2
  );

  return [
    ...clinicalNodes,
    ...demographicNodes,
    {
      id: "risk-score",
      position: { x: 470, y: targetY },
      data: {
        label: (
          <div className="flow-node-card flow-node-card-target">
            <strong>Risk Score</strong>
            <span>Decision output</span>
          </div>
        ),
      },
      style: {
        width: 180,
        borderRadius: 18,
        border: "1px solid #1f3864",
        background: "#1f3864",
        color: "#ffffff",
        boxShadow: "0 16px 32px rgba(31, 56, 100, 0.18)",
      },
    },
  ];
}

function buildEdges(graph) {
  const clinicalEdges = graph.clinical.map((node) => ({
    id: `edge-${node.label}`,
    source: `clinical-${node.label}`,
    target: "risk-score",
    label: `${node.weight} - clinically justified`,
    labelStyle: { fill: "#375623", fontSize: 11, fontWeight: 600 },
    style: { stroke: "#375623", strokeWidth: 2.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: "#375623",
    },
  }));

  const demographicEdges = graph.demographic.map((node) => ({
    id: `edge-${node.label}`,
    source: `demographic-${node.label}`,
    target: "risk-score",
    label: `${node.weight} - NOT clinically justified`,
    labelStyle: { fill: "#c00000", fontSize: 11, fontWeight: 600 },
    style: { stroke: "#c00000", strokeWidth: 2.5, strokeDasharray: "8 6" },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: "#c00000",
    },
  }));

  return [...clinicalEdges, ...demographicEdges];
}

export default function CausalGraph({ graph }) {
  const nodes = buildNodes(graph);
  const edges = buildEdges(graph);

  return (
    <div className="graph-card">
      <div className="section-heading">
        <h3>How this model made its decision</h3>
        <p>
          Green clinical drivers are expected. Red demographic edges indicate
          influence without clinical justification.
        </p>
      </div>
      <div className="flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.14 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
        >
          <Background color="#dfe7f0" gap={18} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
