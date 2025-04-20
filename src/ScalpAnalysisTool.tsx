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

import React, { useRef, useState } from 'react';
import { Stage, Layer, Image, Line, Text, Group, Circle } from 'react-konva';
import useImage from 'use-image';

interface PolygonArea {
  id: string;
  color: string;
  points: number[];
  areaPixels: number;
}

const ScalpAnalysisTool: React.FC = () => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [image] = useImage(imageURL || '');
  const [polygons, setPolygons] = useState<PolygonArea[]>([]);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<number[]>([]);
  const [currentColor, setCurrentColor] = useState<string>('#FF0000');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const stageRef = useRef<any>(null);

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

  const getPixelsPerCm = () => {
    const div = document.createElement('div');
    div.style.width = '1cm';
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    document.body.appendChild(div);
    const pixelsPerCm = div.offsetWidth;
    document.body.removeChild(div);
    return pixelsPerCm;
  };
  
  console.log(getPixelsPerCm());   

  const handleClick = (e: any) => {
    if (!isDrawing) return;

    const { x, y } = e.target.getStage().getPointerPosition();
    const points = [...currentPolygonPoints, x, y];

    if (points.length >= 6) {
      const dx = points[0] - x;
      const dy = points[1] - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) {
        finishPolygon();
        return;
      }
    }

    setCurrentPolygonPoints(points);
  };

  const finishPolygon = () => {
    if (currentPolygonPoints.length < 6) return;

    const coords: any = [];
    for (let i = 0; i < currentPolygonPoints.length; i += 2) {
      coords.push({ x: currentPolygonPoints[i], y: currentPolygonPoints[i + 1] });
    }

    const areaPixels = Math.abs(
      coords.reduce((sum: number, curr: { x: number; y: number }, i: number) => {
        const next = coords[(i + 1) % coords.length];
        return sum + (curr.x * next.y - next.x * curr.y);
      }, 0) / 2
    );

    const newPolygon: PolygonArea = {
      id: Date.now().toString(),
      color: currentColor,
      points: currentPolygonPoints,
      areaPixels,
    };

    setPolygons([...polygons, newPolygon]);
    setCurrentPolygonPoints([]);
    setIsDrawing(false);
  };

  return (
    <div>
      <h1>Scalp Analysis Tool – Freehand Mode</h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      <label style={{ marginLeft: '1rem' }}>
        Select Color:
        <input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} />
      </label>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setIsDrawing(true)} disabled={!image}>
          Start Drawing Region
        </button>
        <button onClick={finishPolygon} disabled={currentPolygonPoints.length < 6}>
          Finish Region
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', marginTop: '1rem' }}>
        {image && (
          <Stage
            ref={stageRef}
            width={image.width}
            height={image.height}
            onClick={handleClick}
            style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
          >
            <Layer>
              <Image
                image={image}
                width={window.innerWidth / 2}
                height={image.height / 2 * (window.innerWidth / image.width)}
              />

              {polygons?.map((poly) => (
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
                    text={
                      `Area: ${
                        Number(+poly?.areaPixels?.toFixed(2) / (getPixelsPerCm() * getPixelsPerCm()))?.toFixed(2)
                      } cm²`
                    }
                    fontSize={14}
                    fill="black"
                  />
                </Group>
              ))}

              {/* Currently drawing polygon */}
              {currentPolygonPoints.length > 2 && (
                <>
                  <Line
                    points={currentPolygonPoints}
                    stroke={currentColor}
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                  {currentPolygonPoints.map((_, i) =>
                    i % 2 === 0 ? (
                      <Circle
                        key={i}
                        x={currentPolygonPoints[i]}
                        y={currentPolygonPoints[i + 1]}
                        radius={3}
                        fill={currentColor}
                      />
                    ) : null
                  )}
                </>
              )}
            </Layer>
          </Stage>
        )}
      </div>

      <h3>Regions Drawn</h3>
      <ul>
        {polygons.map((p) => (
          <li key={p.id}>
            <div
              style={{
                backgroundColor: p.color,
                width: 20,
                height: 20,
                display: 'inline-block',
                marginRight: 10,
              }}
            ></div>
            {p.points.length / 2} points — {p.areaPixels.toFixed(2)} px²
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScalpAnalysisTool;



///////////////////////////////////

