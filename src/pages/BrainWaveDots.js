import React, { useEffect, useRef } from "react";


// dot shape
// { positionX, positionY, size, colorString, label }

const labelMap = {
  "delta": "Delta: Relaxation",
  "theta": "Theta: Inward Calm",
  "alpha": "Alpha: Passive",
  "beta": "Beta: Outward",
  "gamma": "Gamma: Focus",
}

const BrainWaveDots = ({ getDots }) => {
  const canvasRef = useRef(null);
  const prevDots = useRef();

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(255, 255, 255, 0.008)"; // 1% opacity white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = "brightness(1.005)";
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none"; // Reset the filter


    getDots().forEach((dot, i) => {
      if (!prevDots.current || !prevDots.current[i]
        || (prevDots.current[i].positionX - dot.positionX) ** 2 + (prevDots.current[i].positionY - dot.positionY) ** 2 > 500 ** 2
      ) {
        ctx.beginPath();
        ctx.arc(dot.positionX, dot.positionY, dot.size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = dot.colorString;
        ctx.fill();
        ctx.closePath();
      } else {
        // draw a line from prevDots to dot
        ctx.beginPath();
        ctx.moveTo(prevDots.current[i].positionX, prevDots.current[i].positionY);
        ctx.lineTo(dot.positionX, dot.positionY);
        ctx.strokeStyle = dot.colorString;
        ctx.lineWidth = dot.size;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    });

    prevDots.current = getDots();
  }, [getDots()]);

  return (
    <>
      <div className="flex flex-col items-center bg-white rounded-2xl">
        <canvas ref={canvasRef} width={1000} height={1000} />
      </div>
      <div className="flex flex-col items-center mt-4">
        <h2 className="text-lg font-semibold">Legend</h2>
        <div className="flex flex-wrap justify-center mt-2 flex-col">
          {getDots().map(dot => (
            <div key={dot.label} className="flex items-center m-1">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: dot.colorString }}></div>
              <span>{labelMap[dot.label]}</span>
            </div>
          ))}
        </div>
      </div>



      <button className="my-4 bg-blue-200 rounded-full p-2 hover:bg-blue-400 hover:text-white w-64" onClick={clearCanvas}>
        Clear Canvas
      </button>
    </>
  );
};

export default BrainWaveDots;