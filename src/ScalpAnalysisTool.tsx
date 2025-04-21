import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Text, Group } from 'react-konva';
import useImage from 'use-image';
import heic2any from 'heic2any';

interface PolygonArea {
  id: string;
  color: string;
  points: number[];
  areaPixels: number;
}

const ScalpAnalysisTool: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [imageURL, setImageURL] = useState<string | null>(null);
  const [image] = useImage(imageURL || '');
  const [polygons, setPolygons] = useState<PolygonArea[]>([]);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<number[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<number[]>([]);
  const [currentColor, setCurrentColor] = useState<string>('#FF0000');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [pixelsPerCm, setPixelsPerCm] = useState<number>(1);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const getDeviceDPI = () => {
      return window.devicePixelRatio * 96;
    };

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
  let scaleFactor = isMobile ? 16 : ( 1 / 2.64); 

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setDrawingPoints([pos.x, pos.y]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || drawingPoints.length === 0) return;
    const pos = getPointerPos(e);
    setDrawingPoints((prev) => [...prev, pos.x, pos.y]);
  };

  const handleMouseUp = () => {
    if (drawingPoints.length >= 6) {
      setCurrentPolygonPoints(drawingPoints);
      setDrawingPoints([]);
      finishPolygon(drawingPoints);
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
      coords.reduce((sum: any, curr: any, i: any) => {
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

    setPolygons([...polygons, newPolygon]);
    setCurrentPolygonPoints([]);
    setIsDrawing(false);
  };

  const undoLastPolygon = () => {
    setPolygons((prev) => prev.slice(0, -1));
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <h2 style={styles.heading}>Scalp Analysis Tool</h2>
      {/* <h3>Device Type: </h3>
      {
        `${navigator.userAgent} and width: ${window.innerWidth}px`
      } */}

      <div style={styles.controls}>
        <input type="file" accept="image/*,.heic" onChange={handleImageUpload} style={styles.fileInput} />

        <label style={styles.label}>
          Color:
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            style={styles.colorPicker}
          />
        </label>

        <button onClick={() => setIsDrawing(true)} disabled={!image} style={styles.button}>
          Start Drawing
        </button>

        <button onClick={undoLastPolygon} disabled={polygons.length === 0} style={styles.undoButton}>
          Undo Last
        </button>
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

              {polygons.map((poly) => (
                <Group key={poly.id}>
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
                    y={poly.points[1] - 20}
                    text={`Area: ${(poly.areaPixels * scaleFactor / (pixelsPerCm * pixelsPerCm))?.toFixed(2)} cm²`}
                    fontSize={14}
                    fill="black"
                  />
                </Group>
              ))}

              {drawingPoints.length > 2 && (
                <Line
                  points={drawingPoints}
                  stroke={currentColor}
                  strokeWidth={2}
                  lineJoin="round"
                  tension={0.4}
                />
              )}
            </Layer>
          </Stage>
        </div>
      )}

      <div style={styles.regionList}>
        <h3>Regions</h3>
        <ul>
          {polygons.map((p) => (
            <li key={p.id}>
              <span
                style={{
                  backgroundColor: p.color,
                  width: 12,
                  height: 12,
                  display: 'inline-block',
                  marginRight: 8,
                  borderRadius: '50%',
                }}
              />
              {p.points.length / 2} points – {(p.areaPixels * scaleFactor / (pixelsPerCm * pixelsPerCm))?.toFixed(2)} cm²
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '1rem',
    fontFamily: 'sans-serif',
    maxWidth: '100%',
  },
  heading: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  fileInput: {
    fontSize: '1rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  colorPicker: {
    width: '40px',
    height: '30px',
    border: 'none',
    padding: 0,
  },
  button: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  undoButton: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  canvasWrapper: {
    maxWidth: '100%',
    overflowX: 'auto',
    marginBottom: '1rem',
  },
  regionList: {
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
};

export default ScalpAnalysisTool;
