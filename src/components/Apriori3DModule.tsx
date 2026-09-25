import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, DatasetCase } from '../types';
import { runAprioriStages, Lattice3DNode } from '../algorithms/apriori';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Sliders, 
  HelpCircle,
  Eye,
  Layers,
  Scissors
} from 'lucide-react';

interface Apriori3DModuleProps {
  currentCase: DatasetCase;
  transactions: Transaction[];
  minSup: number;
  setMinSup: (val: number) => void;
}

export const Apriori3DModule: React.FC<Apriori3DModuleProps> = ({
  currentCase,
  transactions,
  minSup,
  setMinSup,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute stages and lattice
  const aprioriData = useMemo(() => {
    return runAprioriStages(transactions, minSup, 3);
  }, [transactions, minSup]);

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<Lattice3DNode | null>(null);

  // 3D Camera Angles
  const [pitch, setPitch] = useState<number>(0.35); // Vertical tilt
  const [yaw, setYaw] = useState<number>(0.45); // Horizontal rotation
  const [zoom, setZoom] = useState<number>(1.0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeIdRef = useRef<string | null>(null);

  // Auto-advance stages when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev >= aprioriData.stages.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, aprioriData.stages.length]);

  // Handle Canvas mouse drag for 3D rotation & node dragging
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      // Hit-test on nodes
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let foundNode: Lattice3DNode | null = null;
      for (const node of aprioriData.latticeNodes) {
        // Project 3D to 2D
        const p = project3D(node.x, node.y, node.z, pitch, yaw, zoom, canvas.width, canvas.height);
        const dist = Math.hypot(p.x - clickX, p.y - clickY);
        if (dist <= 18) {
          foundNode = node;
          draggedNodeIdRef.current = node.id;
          break;
        }
      }
      setSelectedNode(foundNode);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (draggedNodeIdRef.current) {
        const node = aprioriData.latticeNodes.find((n) => n.id === draggedNodeIdRef.current);
        if (node) {
          node.x += dx * 0.8;
          node.z += dy * 0.8;
        }
      } else {
        setYaw((prev) => prev + dx * 0.008);
        setPitch((prev) => Math.max(-1.2, Math.min(1.2, prev + dy * 0.008)));
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      draggedNodeIdRef.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => Math.max(0.6, Math.min(2.0, prev - e.deltaY * 0.001)));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [pitch, yaw, zoom, aprioriData.latticeNodes]);

  // Project 3D point (x, y, z) into 2D canvas coordinates
  function project3D(
    x: number,
    y: number,
    z: number,
    pitchAngle: number,
    yawAngle: number,
    scale: number,
    width: number,
    height: number
  ) {
    // 1. Yaw rotation around Y axis
    const cosY = Math.cos(yawAngle);
    const sinY = Math.sin(yawAngle);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // 2. Pitch rotation around X axis
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    // 3. Perspective projection
    const cameraDistance = 600;
    const perspectiveFactor = cameraDistance / (cameraDistance + z2);

    const screenX = width / 2 + x1 * perspectiveFactor * scale;
    const screenY = height / 2 + y2 * perspectiveFactor * scale;

    return { x: screenX, y: screenY, depth: z2, scale: perspectiveFactor * scale };
  }

  // Draw 3D Lattice on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // Determine current active K limit
    const activeStage = aprioriData.stages[currentStageIdx];
    const maxActiveK = activeStage ? activeStage.k : 1;

    // Draw min-sup cut-off plane projection
    const cutoffY = 180 - (1 - minSup) * 220;
    const p1 = project3D(-240, cutoffY, -240, pitch, yaw, zoom, width, height);
    const p2 = project3D(240, cutoffY, -240, pitch, yaw, zoom, width, height);
    const p3 = project3D(240, cutoffY, 240, pitch, yaw, zoom, width, height);
    const p4 = project3D(-240, cutoffY, 240, pitch, yaw, zoom, width, height);

    ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Edges
    const nodeMap = new Map(aprioriData.latticeNodes.map((n) => [n.id, n]));
    aprioriData.latticeEdges.forEach((edge) => {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) return;
      if (tgt.k > maxActiveK) return;

      const pSrc = project3D(src.x, src.y, src.z, pitch, yaw, zoom, width, height);
      const pTgt = project3D(tgt.x, tgt.y, tgt.z, pitch, yaw, zoom, width, height);

      ctx.beginPath();
      ctx.moveTo(pSrc.x, pSrc.y);
      ctx.lineTo(pTgt.x, pTgt.y);

      if (edge.isPruned) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'rgba(13, 148, 136, 0.55)';
        ctx.setLineDash([]);
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Nodes sorted by depth (painter's algorithm)
    const renderableNodes = aprioriData.latticeNodes
      .filter((n) => n.k <= maxActiveK)
      .map((node) => {
        const proj = project3D(node.x, node.y, node.z, pitch, yaw, zoom, width, height);
        return { node, proj };
      })
      .sort((a, b) => b.proj.depth - a.proj.depth);

    renderableNodes.forEach(({ node, proj }) => {
      const isSelected = selectedNode?.id === node.id;
      const isFrequent = node.status === 'frequent';
      const isPrunedByApriori = node.status === 'pruned_by_property';

      const radius = isSelected ? 16 : isFrequent ? 12 : 9;

      ctx.save();

      // Shadow
      if (isFrequent) {
        ctx.shadowColor = 'rgba(13, 148, 136, 0.25)';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);

      if (node.id === 'ROOT') {
        ctx.fillStyle = '#334155';
        ctx.fill();
      } else if (isFrequent) {
        ctx.fillStyle = '#0D9488'; // Teal
        ctx.fill();
        ctx.strokeStyle = '#042F2E';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isPrunedByApriori) {
        ctx.fillStyle = '#F1F5F9';
        ctx.fill();
        ctx.strokeStyle = '#EF4444'; // Red prune
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Cutoff prune
        ctx.fillStyle = '#F1F5F9';
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();

      // Node text label
      ctx.fillStyle = isFrequent ? '#0F172A' : '#64748B';
      ctx.font = `${isSelected ? 'bold 11px' : '10px'} -apple-system, sans-serif`;
      ctx.textAlign = 'center';

      let label = node.items.map((it) => it.split(' ')[0]).join('·');
      if (label.length > 10) label = label.slice(0, 9) + '…';

      ctx.fillText(label, proj.x, proj.y - radius - 4);

      if (node.id !== 'ROOT') {
        ctx.fillStyle = isFrequent ? '#0D9488' : '#94A3B8';
        ctx.font = '9px monospace';
        ctx.fillText(`s=${(node.support * 100).toFixed(0)}%`, proj.x, proj.y + radius + 10);
      }
    });
  }, [aprioriData, currentStageIdx, pitch, yaw, zoom, minSup, selectedNode]);

  const currentStage = aprioriData.stages[currentStageIdx];

  return (
    <div className="space-y-6">
      {/* Header Slice */}
      <div className="bg-white border border-stone-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-stone-400">模块 02</span>
              <span className="text-stone-300">/</span>
              <span className="text-xs font-medium text-teal-700">Apriori 3D 项集格空间</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
              Apriori 逐层候选集连接与先验性质剪枝 3D 演播
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl">
              基于<strong>先验性质 (Apriori Property)</strong>：“频繁项集的所有非空子集必定也是频繁的；
              反之，若任何一个子集是非频繁的，则其所有超集必然非频繁，无需计算直接剪枝”。
            </p>
          </div>

          {/* 3D Interactivity instructions */}
          <div className="flex items-center gap-3 text-xs bg-stone-50 border border-stone-200 rounded px-3 py-2 text-stone-600">
            <Eye className="w-4 h-4 text-stone-400" />
            <span>鼠标左键拖拽旋转空间视角 · 滚轮缩放 · 点击节点查看剪枝归因</span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Visualizer Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
              <Layers className="w-4 h-4 text-teal-700" />
              <span>3D 项集格空间拓扑 (Itemset Lattice)</span>
            </div>
            <button
              onClick={() => {
                setPitch(0.35);
                setYaw(0.45);
                setZoom(1.0);
              }}
              className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              重置视角
            </button>
          </div>

          {/* Interactive Canvas */}
          <div className="relative w-full h-[480px] bg-radial from-stone-50 to-stone-100/60 rounded border border-stone-100 overflow-hidden cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              width={820}
              height={480}
              className="w-full h-full block"
            />

            {/* Cutoff Legend in Corner */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-stone-200 rounded p-2.5 text-[11px] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600 border border-teal-800 inline-block" />
                <span className="text-stone-800 font-medium">频繁项集 (L_k)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-stone-100 border border-dashed border-red-500 inline-block" />
                <span className="text-stone-600">先验性质剪枝 (Pruned by subset)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-stone-100 border border-dashed border-stone-400 inline-block" />
                <span className="text-stone-500">支持度截断排除 (Below min_sup)</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                <span className="w-3 h-1 bg-rose-400/80 inline-block" />
                <span className="text-rose-700 font-mono text-[10px]">Min Sup 截断平面 ({(minSup * 100).toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Playback & Step Bar */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStageIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentStageIdx === 0}
                className="p-1.5 border border-stone-200 rounded bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-stone-700 cursor-pointer"
                title="上一步"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? '暂停演播' : '自动演播'}</span>
              </button>

              <button
                onClick={() =>
                  setCurrentStageIdx((prev) =>
                    Math.min(aprioriData.stages.length - 1, prev + 1)
                  )
                }
                disabled={currentStageIdx >= aprioriData.stages.length - 1}
                className="p-1.5 border border-stone-200 rounded bg-stone-50 hover:bg-stone-100 disabled:opacity-40 text-stone-700 cursor-pointer"
                title="下一步"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <span className="text-xs text-stone-500 ml-2 font-mono">
                阶段 {currentStageIdx + 1} / {aprioriData.stages.length}
              </span>
            </div>

            {/* Min Sup Slider */}
            <div className="flex items-center gap-2 text-xs">
              <Scissors className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-600">截断线支持度:</span>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.05"
                value={minSup}
                onChange={(e) => setMinSup(parseFloat(e.target.value))}
                className="w-24 h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-teal-700"
              />
              <span className="font-mono text-teal-800 font-bold w-10">
                {(minSup * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Stage Explanation & Node Detail (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Current Step Explanation */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-900">
                当前阶段: 第 {currentStage?.k} 阶连接与剪枝
              </h3>
              <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                k = {currentStage?.k}
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded border border-stone-100">
              {currentStage?.description}
            </p>

            {/* Stage Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-stone-50 p-2 rounded">
                <div className="text-[10px] text-stone-400">生成候选数</div>
                <div className="font-mono font-bold text-stone-800 text-sm">
                  {currentStage?.candidates.length || 0}
                </div>
              </div>
              <div className="bg-red-50/60 p-2 rounded">
                <div className="text-[10px] text-red-700">先验剪枝移除</div>
                <div className="font-mono font-bold text-red-800 text-sm">
                  {currentStage?.candidates.filter((c) => c.prunedByApriori).length || 0}
                </div>
              </div>
              <div className="bg-teal-50 p-2 rounded">
                <div className="text-[10px] text-teal-700">留存频繁项</div>
                <div className="font-mono font-bold text-teal-900 text-sm">
                  {currentStage?.frequent.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Node Inspector Slice */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-stone-900 flex items-center justify-between">
              <span>项集节点深度归因检视</span>
              {selectedNode && (
                <span className="text-[10px] font-mono text-stone-400">
                  ID: {selectedNode.id}
                </span>
              )}
            </h3>

            {selectedNode ? (
              <div className="space-y-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded border border-stone-100">
                  <div className="text-stone-400 text-[10px]">项集内容 (Items):</div>
                  <div className="text-stone-900 font-semibold mt-0.5">
                    &#123;{selectedNode.items.join(', ')}&#125;
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-stone-400 text-[10px]">出现频数:</span>
                    <div className="font-mono font-bold text-stone-800">
                      {selectedNode.count} 笔
                    </div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded">
                    <span className="text-stone-400 text-[10px]">支持度:</span>
                    <div className="font-mono font-bold text-stone-800">
                      {(selectedNode.support * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div
                  className={`p-2.5 rounded text-[11px] leading-relaxed border ${
                    selectedNode.status === 'frequent'
                      ? 'bg-teal-50 border-teal-100 text-teal-900'
                      : selectedNode.status === 'pruned_by_property'
                      ? 'bg-red-50 border-red-100 text-red-900'
                      : 'bg-amber-50 border-amber-100 text-amber-900'
                  }`}
                >
                  <div className="font-semibold mb-0.5">
                    判定结果:{' '}
                    {selectedNode.status === 'frequent'
                      ? '✓ 频繁项集'
                      : selectedNode.status === 'pruned_by_property'
                      ? '✂ 先验性质剪枝'
                      : '✗ 支持度不足截断'}
                  </div>
                  <div>
                    {selectedNode.pruneReason ||
                      '支持度达到阈值，可作为频繁项集继续参与下一轮连接。'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-stone-400 flex flex-col items-center gap-1">
                <HelpCircle className="w-5 h-5 text-stone-300" />
                <span>点击左侧 3D 格空间中的任意圆点，查看其剪枝溯源</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
