// import React, { useState, useRef } from 'react';
// import useImage from 'use-image';
// import { Stage, Layer, Image, Rect, Text, Group } from 'react-konva';

// interface AreaMeasurement {
//   id: string;
//   color: string;
//   areaCm2: number;
//   rect: {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   };
// }

// const ScalpAnalysisTool: React.FC = () => {
//   const [imageURL, setImageURL] = useState<string | null>(null);
//   const [image] = useImage(imageURL || '');
//   const [measurements, setMeasurements] = useState<AreaMeasurement[]>([]);
//   const [currentColor, setCurrentColor] = useState<string>('#FF0000');
//   const [drawingMode, setDrawingMode] = useState<'rectangle' | null>('rectangle');
//   const [drawingRect, setDrawingRect] = useState<any>(null);
//   const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
//   const [referencePixels, setReferencePixels] = useState<number | null>(null);
//   const [referenceLengthCm, setReferenceLengthCm] = useState<number>(1);

//   const stageRef = useRef<any>(null);

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         setImageURL(event.target?.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleMouseDown = (e: any) => {
//     if (drawingMode === 'rectangle' && image) {
//       const { x, y } = e.target.getStage().getPointerPosition();
//       setStartPoint({ x, y });
//       setDrawingRect({
//         x,
//         y,
//         width: 0,
//         height: 0,
//         color: currentColor,
//       });
//     }
//   };

//   const handleMouseMove = (e: any) => {
//     if (!startPoint || !drawingRect) return;

//     const { x, y } = e.target.getStage().getPointerPosition();
//     const newWidth = x - startPoint.x;
//     const newHeight = y - startPoint.y;

//     setDrawingRect({
//       ...drawingRect,
//       width: newWidth,
//       height: newHeight,
//     });
//   };

//   const handleMouseUp = () => {
//     if (drawingRect && startPoint) {
//       const width = Math.abs(drawingRect.width);
//       const height = Math.abs(drawingRect.height);

//       if (width > 5 && height > 5) {
//         const pixelsPerCm = referencePixels && referenceLengthCm ? referencePixels / referenceLengthCm : 1;
//         const areaPixels = width * height;
//         const areaCm2 = areaPixels / Math.pow(pixelsPerCm, 2);

//         const normalizedRect = {
//           x: drawingRect.width < 0 ? drawingRect.x + drawingRect.width : drawingRect.x,
//           y: drawingRect.height < 0 ? drawingRect.y + drawingRect.height : drawingRect.y,
//           width,
//           height,
//         };

//         const newMeasurement: AreaMeasurement = {
//           id: Date.now().toString(),
//           color: currentColor,
//           areaCm2,
//           rect: normalizedRect,
//         };

//         console.log('New Measurement:', newMeasurement);

//         setMeasurements((prev) => [...prev, newMeasurement]);
//       }
//     }

//     setDrawingRect(null);
//     setStartPoint(null);
//   };

//   const startAreaMeasurement = () => {
//     setDrawingMode('rectangle');
//   };

//   return (
//     <div className="container">
//       <h1>Scalp Analysis Tool</h1>

//       <div className="controls">
//         <input type="file" accept="image/*" onChange={handleImageUpload} />
//         <div>
//           <button onClick={startAreaMeasurement} disabled={!image}>
//             Start Area Measurement
//           </button>
//         </div>
//         <div>
//           <label>
//             Select Color:
//             <input
//               type="color"
//               value={currentColor}
//               onChange={(e) => setCurrentColor(e.target.value)}
//             />
//           </label>
//         </div>
//         <div>
//           <label>
//             Reference Length (cm):
//             <input
//               type="number"
//               value={referenceLengthCm}
//               onChange={(e) => setReferenceLengthCm(Number(e.target.value))}
//               step="0.1"
//               min="0.1"
//             />
//           </label>
//         </div>
//         <div>
//           {referencePixels && <span>Reference Pixels: {referencePixels}</span>}
//         </div>
//       </div>

//       <div className="canvas-container" style={{ width: '100%', height: '80vh', border: '1px solid black' }}>
//         {image && (
//           <Stage
//             ref={stageRef}
//             width={image.width}
//             height={image.height}
//             onMouseDown={handleMouseDown}
//             onMouseMove={handleMouseMove}
//             onMouseUp={handleMouseUp}
//           >
//             <Layer>
//               <Image image={image} />

//               {/* Active drawing rect */}
//               {drawingRect && (
//                 <Rect
//                   x={drawingRect.width < 0 ? drawingRect.x + drawingRect.width : drawingRect.x}
//                   y={drawingRect.height < 0 ? drawingRect.y + drawingRect.height : drawingRect.y}
//                   width={Math.abs(drawingRect.width)}
//                   height={Math.abs(drawingRect.height)}
//                   fill={drawingRect.color}
//                   stroke="black"
//                   strokeWidth={1}
//                   opacity={0.5}
//                 />
//               )}

//               {/* Finalized measurements */}
//               {measurements.map((measurement) => (
//                 <Group key={measurement.id}>
//                   <Rect
//                     x={measurement.rect.x}
//                     y={measurement.rect.y}
//                     width={measurement.rect.width}
//                     height={measurement.rect.height}
//                     fill={measurement.color}
//                     stroke="black"
//                     strokeWidth={1}
//                     opacity={0.5}
//                   />
//                   <Text
//                     x={measurement.rect.x}
//                     y={measurement.rect.y - 20}
//                     text={`Area: ${measurement.areaCm2.toFixed(2)} cm²`}
//                     fontSize={14}
//                     fill="black"
//                   />
//                 </Group>
//               ))}
//             </Layer>
//           </Stage>
//         )}
//       </div>

//       <div className="measurements">
//         <h3>Saved Measurements:</h3>
//         {!!measurements.length ? (
//           <ul>
//             {measurements.map((measurement) => (
//               <li key={measurement.id}>
//                 <div
//                   style={{
//                     backgroundColor: measurement.color,
//                     width: '20px',
//                     height: '20px',
//                     display: 'inline-block',
//                     marginRight: '10px',
//                   }}
//                 ></div>
//                 <span>{`Area: ${measurement.areaCm2.toFixed(2)} cm²`}</span>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <p>No measurements yet.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ScalpAnalysisTool;


//////////////////////////////////////////////////////////////////////////////////////


import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Text, Group } from 'react-konva';
import useImage from 'use-image';

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
    const calcPixelsPerCm = () => {
      const div = document.createElement('div');
      div.style.width = '1cm';
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      document.body.appendChild(div);
      const pxPerCm = div.offsetWidth;
      document.body.removeChild(div);
      return pxPerCm;
    };
    setPixelsPerCm(calcPixelsPerCm());
  }, []);

  useEffect(() => {
    if (image) {
      const containerWidth = window.innerWidth - 32;
      const scale = image.width > containerWidth ? containerWidth / image.width : 1;
      setStageSize({
        width: image.width * scale,
        height: image.height * scale,
      });
    }
  }, [image]);

  const getPointerPos = (e: any) => {
    const stage = e.target.getStage();
    return stage.getPointerPosition();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      coords.reduce((sum: number, curr: any, i: any) => {
        const next = coords[(i + 1) % coords?.length];
        return sum + (curr?.x * next?.y - next?.x * curr?.y);
      }, 0) / 2,
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

      <div style={styles.controls}>
        <input type="file" accept="image/*" onChange={handleImageUpload} style={styles.fileInput} />

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
                    text={`Area: ${(poly.areaPixels / (pixelsPerCm * pixelsPerCm)).toFixed(2)} cm²`}
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
              {p.points.length / 2} points – {(p.areaPixels / (pixelsPerCm * pixelsPerCm)).toFixed(2)} cm²
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
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
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




///////////////////////////////////

