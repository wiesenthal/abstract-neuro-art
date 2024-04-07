import React, { useEffect, useRef } from "react";

const BrainWaveDot = ({ positionX, positionY, size, colorR, colorG, colorB }) => {
  const canvasRef = useRef(null);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the dot
    ctx.beginPath();
    ctx.arc(positionX, positionY, size, 0, 2 * Math.PI);
    ctx.fillStyle = `rgb(${colorR}, ${colorG}, ${colorB})`;
    ctx.fill();
    ctx.closePath();
  }, [positionX, positionY, size, colorR, colorG, colorB]);

  return (
    <>
      <div className="flex flex-col items-center bg-white rounded-2xl">
        <canvas ref={canvasRef} width={1000} height={1000} />
      </div>
      <button className="my-4 bg-blue-200 rounded-full p-2 hover:bg-blue-400 hover:text-white w-64" onClick={clearCanvas}>
        Clear Canvas
      </button>
    </>
  );
};

export default BrainWaveDot;