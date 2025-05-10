export type Point = [number, number];
export type Mode = 'reference' | 'region';
export type Region = {
  points: Point[];
  color: string;
  areaCm2?: number;
};
export const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];


export const handleImageUpload = (
    e: any, 
    setImage: any, 
    setRegions: any, 
    setPixelsPerCm: any, 
) => {
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

export const calculateArea = (points: Point[], offscreenCanvasRef: any, pixelsPerCm: any): number => {
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

