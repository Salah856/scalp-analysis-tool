import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Text, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import heic2any from 'heic2any';
import html2canvas from 'html2canvas'; 
// import useAuth from './useAuth';


interface PolygonArea {
  id: string;
  color: string;
  points: number[];
  areaPixels: number;
  customDensity?: number; 
};

interface ColorDensity {
  color: string;
  density: number;
  label?: string;
}

const defaultDensities: ColorDensity[] = [
  { color: '#FF0000', density: 40, label: 'High Density' },
  { color: '#FFFF00', density: 35, label: 'Medium-High' },
  { color: '#0000FF', density: 30, label: 'Medium' },
  { color: '#00FF00', density: 25, label: 'Medium-Low' },
  { color: '#800080', density: 20, label: 'Low Density' }
];

const ScalpAnalysisTool: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const [imageURL, setImageURL] = useState<string | null>(null);
  const [image] = useImage(imageURL || '');
  const [polygons, setPolygons] = useState<PolygonArea[]>([]);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<number[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<number[]>([]);
  const [currentColor, setCurrentColor] = useState<string>('#FF0000');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isSquareMode, setIsSquareMode] = useState<boolean>(false);
  const [squareStart, setSquareStart] = useState<{ x: number, y: number } | null>(null);
  const [squarePreview, setSquarePreview] = useState<{ x: number, y: number, size: number } | null>(null);
  const [pixelsPerCm, setPixelsPerCm] = useState<number>(1);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [fileName, setFileName] = useState<string>('scalp-analysis');
  const [colorDensities, setColorDensities] = useState<ColorDensity[]>(defaultDensities);
  const [showDensityModal, setShowDensityModal] = useState<boolean>(false);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [tempDensity, setTempDensity] = useState<string>('');

  const [referenceFactor, setReferenceFactor] = useState(1); 

  const getDensityForColor = (color: string): number => {
    const densityObj = colorDensities.find(d => d.color === color);
    return densityObj ? densityObj.density : 0;
  };

  const updatePolygonDensity = (id: string, density: number) => {
    setPolygons(polygons.map(poly => 
      poly.id === id ? { ...poly, customDensity: density } : poly
    ));
  };

  const handleDensityInput = (polygon: PolygonArea) => {
    setEditingPolygonId(polygon.id);
    setTempDensity(polygon.customDensity?.toString() || getDensityForColor(polygon.color).toString());
    setShowDensityModal(true);
  };

  const saveCustomDensity = () => {
    if (editingPolygonId && tempDensity) {
      const densityValue = parseFloat(tempDensity);
      if (!isNaN(densityValue)) {
        updatePolygonDensity(editingPolygonId, densityValue);
        // Also update the color densities if this color isn't already in the list
        const polygon = polygons.find(p => p.id === editingPolygonId);
        if (polygon && !colorDensities.some(d => d.color === polygon.color)) {
          setColorDensities([
            ...colorDensities,
            { color: polygon.color, density: densityValue }
          ]);
        }
      }
    }
    setShowDensityModal(false);
  };

  // Function to find the closest predefined color
  const getClosestColor = (color: string): ColorDensity => {
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const colorDistance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
      return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
      );
    };

    const inputRgb = hexToRgb(color);
    
    let closestColor = colorDensities[0];
    let minDistance = colorDistance(inputRgb, hexToRgb(colorDensities[0].color));

    for (let i = 1; i < colorDensities.length; i++) {
      const distance = colorDistance(inputRgb, hexToRgb(colorDensities[i].color));
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = colorDensities[i];
      }
    }

    return closestColor;
  };

  // Open in new tab function
  const openInNewTab = () => {
    if (!exportRef.current) return;
    
    html2canvas(exportRef.current).then(canvas => {
      const dataUrl = canvas.toDataURL('image/png');
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<img src="${dataUrl}" style="max-width:100%;"/>`);
        newWindow.document.title = 'Scalp Analysis Result';
      }
    });
  };

  // Save as image function
  const saveAsImage = () => {
    if (!exportRef.current) return;
    
    html2canvas(exportRef.current).then(canvas => {
      const link = document.createElement('a');
      link.download = `${fileName || 'scalp-analysis'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  // Save as JSON function
  const saveAsJSON = () => {
    const data = {
      image: imageURL,
      polygons: polygons,
      colorDensities: colorDensities,
      createdAt: new Date().toISOString(),
      settings: {
        pixelsPerCm,
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${fileName || 'scalp-analysis'}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Load from JSON function
  const loadFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.image) setImageURL(data.image);
        if (data.polygons) setPolygons(data.polygons);
        if (data.colorDensities) setColorDensities(data.colorDensities);
      } catch (error) {
        alert('Failed to load file. Invalid format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const getDeviceDPI = () => window.devicePixelRatio * 96;
    const dpi = getDeviceDPI();
    const pxPerCm = dpi / 2.54;
    setPixelsPerCm(pxPerCm);
  }, []);

  useEffect(() => {
    const updateStageSize = () => {
      if (image) {
        const containerWidth = window.innerWidth - 32;
        const scale = image.width > containerWidth ? containerWidth / image.width : 1;
        setStageSize({
          width: image.width * scale,
          height: image.height * scale,
        });
      }
    };
    updateStageSize();
    window.addEventListener('resize', updateStageSize);
    return () => window.removeEventListener('resize', updateStageSize);
  }, [image]);


  const getPointerPos = (e: any) => {
    const stage = e.target.getStage();
    return stage.getPointerPosition();
  };

  function isMobileDevice() {
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUA || isSmallScreen;
  }

  let isMobile = isMobileDevice();
  let scaleFactor = isMobile ? 16 : (1 / 2.64);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
      try {
        const convertedBlob = (await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8,
        })) as Blob;
        const convertedURL = URL.createObjectURL(convertedBlob);
        setImageURL(convertedURL);
      } catch (error) {
        alert('Failed to convert HEIC image.');
        console.error(error);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImageURL(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: any) => {
    if (!isDrawing) return;

    const pos = getPointerPos(e);

    if (isSquareMode) {
      setSquareStart(pos);
      setSquarePreview(null);
    } else {
      setDrawingPoints([pos.x, pos.y]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const pos = getPointerPos(e);

    if (isSquareMode && squareStart) {
      const dx = pos.x - squareStart.x;
      const dy = pos.y - squareStart.y;
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      setSquarePreview({
        x: squareStart.x,
        y: squareStart.y,
        size,
      });
    } else if (drawingPoints.length > 0) {
      setDrawingPoints((prev) => [...prev, pos.x, pos.y]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (isSquareMode && squareStart && squarePreview) {
      const { x, y, size } = squarePreview;
      const points = [x, y, x + size, y, x + size, y + size, x, y + size];
      const areaPixels = size * size;

      const newPolygon: PolygonArea = {
        id: Date.now().toString(),
        color: currentColor,
        points,
        areaPixels,
      };

      setPolygons((prev) => [...prev, newPolygon]);
      setSquareStart(null);
      setSquarePreview(null);
      setIsDrawing(false);
    } else if (drawingPoints.length >= 6) {
      finishPolygon(drawingPoints);
      setDrawingPoints([]);
    }
  };

  const handleTouchStart = handleMouseDown;
  const handleTouchMove = handleMouseMove;
  const handleTouchEnd = handleMouseUp;

  const finishPolygon = (points: number[] = currentPolygonPoints) => {
    if (points.length < 6) return;

    const coords: any = [];
    for (let i = 0; i < points.length; i += 2) {
      coords.push({ x: points[i], y: points[i + 1] });
    }

    const areaPixels = Math.abs(
      coords?.reduce((sum: any, curr: any, i: any) => {
        const next = coords[(i + 1) % coords.length];
        return sum + (curr.x * next.y - next.x * curr.y);
      }, 0) / 2
    );

    const newPolygon: PolygonArea = {
      id: Date.now().toString(),
      color: currentColor,
      points,
      areaPixels,
    };

    setPolygons((prev) => [...prev, newPolygon]);
    setCurrentPolygonPoints([]);
    setIsDrawing(false);
  };

  const undoLastPolygon = () => {
    setPolygons((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    setPolygons([]);
    setDrawingPoints([]);
    setCurrentPolygonPoints([]);
  };

  return (
    <div style={styles.container}>
      <div ref={exportRef} style={styles.exportContainer}>
        <h2 style={styles.heading}>Scalp Analysis Tool</h2>
        
        <div ref={containerRef} style={styles.toolContainer}>
          <div style={styles.controls}>
            <div style={styles.fileGroup}>
              <label style={styles.fileInputLabel}>
                Upload Image
                <input 
                  type="file" 
                  accept="image/*,.heic" 
                  onChange={handleImageUpload} 
                  style={styles.fileInput} 
                />
              </label>
              <label style={styles.fileInputLabel}>
                Load Project
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={loadFromJSON} 
                  style={styles.fileInput} 
                />
              </label>
            </div>

            <div style={styles.drawingControls}>
              <label style={styles.label}>
                Color:
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  style={styles.colorPicker}
                />
              </label>

              <button 
                onClick={() => { setIsDrawing(true); setIsSquareMode(false); }} 
                disabled={!image} 
                style={styles.button}
              >
                Free Draw
              </button>

              <button 
                onClick={() => { setIsDrawing(true); setIsSquareMode(true); }} 
                disabled={!image} 
                style={styles.button}
              >
                Draw Square
              </button>

              <button 
                onClick={undoLastPolygon} 
                disabled={polygons.length === 0} 
                style={styles.undoButton}
              >
                Undo Last
              </button>

              <button 
                onClick={clearAll} 
                disabled={polygons.length === 0 && drawingPoints.length === 0} 
                style={styles.clearButton}
              >
                Clear All
              </button>
            </div>

            <div style={styles.exportControls}>
              <label style={styles.label}>
                Filename:
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  style={styles.filenameInput}
                />
              </label>
              <label style={styles.label}>
                Reference Factor:
                <input
                  type="number"
                  onChange={(e) => setReferenceFactor(+e?.target?.value || 1)}
                  style={styles?.filenameInput}
                />
              </label>
              <button onClick={openInNewTab} disabled={!image} style={styles.exportButton}>
                Open in New Tab
              </button>
              <button onClick={saveAsImage} disabled={!image} style={styles.exportButton}>
                Save as Image
              </button>
              <button onClick={saveAsJSON} disabled={!image} style={styles.exportButton}>
                Save as Project
              </button>
            </div>
          </div>

          {image && (
            <div style={{ ...styles.canvasWrapper, width: stageSize.width }}>
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none', border: '1px solid #ccc' }}
              >
                <Layer>
                  <Image image={image} width={stageSize.width} height={stageSize.height} />

                  {polygons.map((poly) => {
                    const areaCm = poly.areaPixels * scaleFactor / (pixelsPerCm * pixelsPerCm);
                    const matchedColor = getClosestColor(poly.color);
                    const density = poly.customDensity || matchedColor.density;
                    const grafts = Math.round(areaCm * density);

                    return (
                      <Group key={poly.id} onClick={() => handleDensityInput(poly)}>
                        <Line
                          points={poly.points}
                          closed
                          fill={poly.color}
                          opacity={0.4}
                          stroke="black"
                          strokeWidth={1}
                        />
                        <Text
                          x={poly.points[0]}
                          y={poly.points[1] - 40}
                          text={`Area: ${areaCm.toFixed(2)} cm²`}
                          fontSize={14}
                          fill="black"
                        />
                        <Text
                          x={poly.points[0]}
                          y={poly.points[1] - 20}
                          text={`Grafts: ${grafts} (${density} grafts/cm²)`}
                          fontSize={14}
                          fill="black"
                        />
                      </Group>
                    );
                  })}

                  {drawingPoints.length > 2 && (
                    <Line
                      points={drawingPoints}
                      stroke={currentColor}
                      strokeWidth={2}
                      lineJoin="round"
                      tension={0.4}
                    />
                  )}

                  {squarePreview && (
                    <Rect
                      x={squarePreview.x}
                      y={squarePreview.y}
                      width={squarePreview.size}
                      height={squarePreview.size}
                      fill={currentColor}
                      opacity={0.4}
                      stroke="black"
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          )}

          <div style={styles.regionList}>
            <h3>Regions</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {polygons.map((p) => {
                const areaCm = p.areaPixels * scaleFactor / (pixelsPerCm * pixelsPerCm);
                const matchedColor = getClosestColor(p.color);
                const density = p.customDensity || matchedColor.density;
                const grafts = Math.round(areaCm * density);
                const actualGrafts = grafts * referenceFactor; 

                return (
                  <li 
                    key={p.id} 
                    style={{ 
                      marginBottom: '8px', 
                      padding: '8px', 
                      backgroundColor: 'black',
                      borderRadius: '4px',
                      cursor: 'pointer', 
                      color: 'white',
                    }}
                    onClick={() => handleDensityInput(p)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: p.color,
                          width: '16px',
                          height: '16px',
                          display: 'inline-block',
                          marginRight: '12px',
                          borderRadius: '50%',
                        }}
                      />
                      <div>
                        <div>
                          <strong>Area:</strong> {areaCm?.toFixed(2)} cm²
                        </div>
                        <div>
                          <strong>Relative Required Grafts:</strong> {grafts} (Density: {density} grafts/cm²)
                        </div>
                        <div>
                          <strong>Actual Required Grafts:</strong> {actualGrafts}
                        </div>
                        {p?.customDensity && (
                          <div style={{ color: '#666', fontSize: '0.8em' }}>
                            Custom density applied
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {showDensityModal && (
        <div style={styles?.modalOverlay}>
          <div style={styles?.modalContent}>
            <h3>Set Graft Density</h3>
            <p>Enter grafts per cm² for this region:</p>
            <input
              type="number"
              value={tempDensity}
              onChange={(e) => setTempDensity(e?.target?.value)}
              style={styles.densityInput}
              placeholder="Grafts per cm²"
            />
            <div style={styles.modalButtons}>
              <button onClick={saveCustomDensity} style={styles.modalButton}>
                Save
              </button>
              <button 
                onClick={() => setShowDensityModal(false)} 
                style={{ ...styles.modalButton, backgroundColor: '#dc3545' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          Developed by Salah Elhossiny
          <div style={styles.socialLinks}>
            <a href="https://github.com/Salah856" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              GitHub
            </a>
            <span style={styles.linkSeparator}>|</span>
            <a href="https://www.linkedin.com/in/salah-elhossiny/" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};


const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '1rem',
    fontFamily: 'sans-serif',
    maxWidth: '100%',
    background: 'black',
  },
  exportContainer: {
    background: 'black',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  toolContainer: {
    maxWidth: '100%',
  },
  heading: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1rem',
  },
  fileGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  drawingControls: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  exportControls: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
  },
  fileInputLabel: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'inline-block',
  },
  fileInput: {
    display: 'none',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
  },
  colorPicker: {
    width: '40px',
    height: '30px',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  button: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '120px',
  },
  undoButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '120px',
  },
  clearButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#ffc107',
    color: '#212529',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '120px',
  },
  exportButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '160px',
  },
  filenameInput: {
    padding: '0.5rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginLeft: '0.5rem',
  },
  canvasWrapper: {
    maxWidth: '100%',
    overflowX: 'auto',
    marginBottom: '1rem',
  },
  regionList: {
    marginTop: '1rem',
    fontSize: '0.9rem',
    backgroundColor: 'black',
    padding: '1rem',
    borderRadius: '6px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'black',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '400px',
    width: '100%',
  },
  densityInput: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '15px',
  },
  modalButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '2rem',
    padding: '1rem',
    textAlign: 'center',
    color: 'white',
    fontSize: '0.9rem',
    borderTop: '1px solid #eee',
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  socialLinks: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  socialLink: {
    color: '#007bff',
    textDecoration: 'none',
  },
  linkSeparator: {
    color: '#999',
  },
};

export default ScalpAnalysisTool;
