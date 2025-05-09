import React, { useRef, useState, useEffect, useCallback } from 'react';

type Point = [number, number];
type Mode = 'reference' | 'region';
type Region = {
  points: Point[];
  color: string;
  areaCm2?: number;
};

const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

const FreehandAreaMeasurement = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<Mode>('reference');
  const [pixelsPerCm, setPixelsPerCm] = useState<number | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);

  // Initialize canvases when image loads
  const initializeCanvases = useCallback(() => {
    if (!image || !canvasRef.current || !offscreenCanvasRef.current) return;

    const { naturalWidth: width, naturalHeight: height } = image;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    offscreenCanvasRef.current.width = width;
    offscreenCanvasRef.current.height = height;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) ctx.drawImage(image, 0, 0, width, height);
  }, [image]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      setRegions([]);
      setPixelsPerCm(null);
    };
    img.onerror = () => alert('Error loading image');
    img.src = URL.createObjectURL(file);
  };

  // Get accurate canvas position accounting for CSS scaling
  const getCanvasPosition = useCallback((clientX: number, clientY: number): Point => {
    if (!canvasRef.current) return [0, 0];
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    return [
      (clientX - rect.left) * scaleX,
      (clientY - rect.top) * scaleY
    ];
  }, []);

  // Drawing handlers
  const startDrawing = (x: number, y: number) => {
    setCurrentPoints([[x, y]]);
    setDrawing(true);
  };

  const continueDrawing = (x: number, y: number) => {
    if (!drawing) return;
    setCurrentPoints(prev => [...prev, [x, y]]);
  };

  const stopDrawing = () => {
    if (!drawing || currentPoints.length < 2) {
      setDrawing(false);
      return;
    }

    if (mode === 'reference') {
      const [x1, y1] = currentPoints[0];
      const [x2, y2] = currentPoints[currentPoints.length - 1];
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      setPixelsPerCm(dist);
      alert(`Reference line length: ${dist.toFixed(2)} px = 1 cm`);
    } else {
      if (!pixelsPerCm) {
        alert('Please draw a 1 cm reference line first.');
        return;
      }
      const areaCm2 = calculateArea(currentPoints);
      setRegions(prev => [...prev, {
        points: [...currentPoints],
        color: currentColor,
        areaCm2
      }]);
      alert(`Region area: ${areaCm2.toFixed(2)} cm²`);
    }

    setDrawing(false);
    setCurrentPoints([]);
  };

  // Calculate area using offscreen canvas
  const calculateArea = (points: Point[]): number => {
    if (!offscreenCanvasRef.current || !pixelsPerCm) return 0;

    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let filledPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 0) filledPixels++;
    }

    return filledPixels / (pixelsPerCm * pixelsPerCm);
  };

  // Redraw the canvas
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear and redraw base image
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(image, 0, 0);

    // Draw all regions
    regions.forEach(region => {
      if (region.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(region.points[0][0], region.points[0][1]);
      region.points.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.strokeStyle = region.color;
      ctx.fillStyle = `${region.color}80`; // Add transparency
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fill();
      
      // Display area text
      if (region.areaCm2) {
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.fillText(`${region.areaCm2.toFixed(2)} cm²`, region.points[0][0], region.points[0][1]);
      }
    });

    // Draw current stroke
    if (currentPoints.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(currentPoints[0][0], currentPoints[0][1]);
      currentPoints.forEach(([x, y]) => ctx.lineTo(x, y));
      if (mode === 'region') ctx.closePath();
      ctx.strokeStyle = mode === 'reference' ? 'blue' : currentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [image, regions, currentPoints, mode, currentColor]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasPosition(e.clientX, e.clientY);
    startDrawing(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasPosition(e.clientX, e.clientY);
    continueDrawing(x, y);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const [x, y] = getCanvasPosition(touch.clientX, touch.clientY);
    startDrawing(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const [x, y] = getCanvasPosition(touch.clientX, touch.clientY);
    continueDrawing(x, y);
  };

  // Clear all regions
  const clearRegions = () => {
    setRegions([]);
    if (canvasRef.current && image) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.drawImage(image, 0, 0);
    }
  };

  // Effects
  useEffect(() => {
    initializeCanvases();
  }, [initializeCanvases]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <div className="measurement-tool">
      <div className="controls">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={() => setMode('reference')} disabled={mode === 'reference'}>
          Draw 1 cm Reference
        </button>
        <button onClick={() => setMode('region')} disabled={mode === 'region' || !pixelsPerCm}>
          Draw Region
        </button>
        <button onClick={clearRegions}>Clear Regions</button>
        
        <div className="color-picker">
          {COLORS.map(color => (
            <button
              key={color}
              className={`color-btn ${currentColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
            />
          ))}
        </div>
        
        <div className="status">
          <p>Mode: <strong>{mode}</strong></p>
          {pixelsPerCm && <p>Scale: 1 cm = {pixelsPerCm.toFixed(1)} px</p>}
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
        />
      </div>

      <canvas ref={offscreenCanvasRef} style={{ display: 'none' }} />

      {regions.length > 0 && (
        <div className="region-list">
          <h3>Measured Regions:</h3>
          <ul>
            {regions.map((region, i) => (
              <li key={i} style={{ color: region.color }}>
                Region {i + 1}: {region.areaCm2?.toFixed(2)} cm²
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FreehandAreaMeasurement;


