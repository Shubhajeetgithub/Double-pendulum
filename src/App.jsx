import React, { useRef, useEffect, useState, useCallback } from 'react';
function rk4(dvdt, v0, t0, dt) {
    const k1 = dvdt(t0, v0);
    const k2 = dvdt(t0 + dt / 2, v0.map((vi, i) => vi + k1[i] * dt / 2));
    const k3 = dvdt(t0 + dt / 2, v0.map((vi, i) => vi + k2[i] * dt / 2));
    const k4 = dvdt(t0 + dt, v0.map((vi, i) => vi + k3[i] * dt));
    
    const result = [];
    for (let i = 0; i < v0.length; i++) {
        result[i] = v0[i] + (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * dt / 6;
    }
    return result;
};
function solve2Linear(a, b, c, p, q, r) {
    try {
        let x = (b*r - q*c)/(a*q - b*p);
        let y = (p*c - a*r)/(a*q - b*p);
        return [x, y];
    } catch (error) {
        return [0, 0]
    }
};
function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const [l1, setl1] = useState(150);
  const [l2, setl2] = useState(150);
  const [g, setg] = useState(9.81);
  const [m1, setm1] = useState(100);
  const [m2, setm2] = useState(100);
  const [a1, seta1] = useState(Math.PI / 4);
  const [a2, seta2] = useState(Math.PI / 6);
  const [a1dotm, seta1dotm] = useState(1);
  const [a2dotm, seta2dotm] = useState(1);
  const [isRunning, setIsRunning] = useState(true);
  const dt = 0.07;

  const [pendulumState, setPendulumState] = useState([a1, a2, 0, 0]);

  const pendulumDerivative = useCallback((t, state) => {
        let a1 = state[0];
        let a2 = state[1];
        let a3 = state[2];
        let a4 = state[3];

        let a1dot = a3;
        let a2dot = a4;

        const A = (m1 + m2) * l1;
        const B = m2 * l2 * Math.cos(a1 - a2);
        const C = m2 * l2 * a4 * a4 * Math.sin(a1 - a2) + (m1 + m2) * g * Math.sin(a1);

        const P = l1 * Math.cos(a1 - a2);
        const Q = l2;
        const R = g * Math.sin(a2) - l1 * a3 * a3 * Math.sin(a1 - a2);

        const sol = solve2Linear(A, B, C, P, Q, R);

        return [a1dot, a2dot, sol[0], sol[1]];
  }, [l1, l2, m1, m2, g, pendulumState]);

  const drawPendulum = useCallback((ctx, angle1, angle2, pivotX, pivotY) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const x1 = pivotX + l1 * Math.sin(angle1);
    const y1 = pivotY + l1 * Math.cos(angle1);

    const x2 = x1 + l2 * Math.sin(angle2);
    const y2 = y1 + l2 * Math.cos(angle2);
    
    // Draw pivot point
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw string
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    
    // Draw string
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw pendulum bob
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x1, y1, 15, 0, 2 * Math.PI);
    ctx.fill();


    // Draw pendulum bob
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x2, y2, 15, 0, 2 * Math.PI);
    ctx.fill();
  }, [l1, l2]);

  useEffect(() => {
    let a1dot = pendulumState[2], a2dot = pendulumState[3];
    setPendulumState([a1, a2, a1dot * a1dotm, a2dot * a2dotm]);
  }, [pendulumState, l1, l2, m1, m2, g]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 600;

    const pivotX = canvas.width / 2;
    const pivotY = 200;


    let currentState = [...pendulumState];

    const animate = () => {
        if (isRunning) {
            currentState = rk4(pendulumDerivative, currentState, 0, dt);
            setPendulumState([...currentState]);
            seta1(currentState[0]);
            seta2(currentState[1]);
        }
        drawPendulum(ctx, currentState[0], currentState[1], pivotX, pivotY);
        animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };
  }, [pendulumDerivative, drawPendulum, isRunning]);

  return (
    <div>
      <h1 className='bg-amber-600 text-2xl text-center p-2'>Double Pendulum stimulation</h1>
      <div className='flex items-center justify-between gap-x-1 flex-wrap m-1.5'>
        <div>
        <input type="range" min={100} max={300} value={l1} className='cursor-pointer' onChange={(e) => setl1(parseFloat(e.target.value))} />
        <label>l<sub>1</sub>: {l1}</label>
        </div>
        <div>
        <input type="range" min={100} max={300} value={l2} className='cursor-pointer' onChange={(e) => setl2(parseFloat(e.target.value))} />
        <label>l<sub>2</sub>: {l2}</label>
        </div>
        <div>
        <input type="range" min={100} max={300} value={m1} className='cursor-pointer' onChange={(e) => setm1(parseFloat(e.target.value))} />
        <label>m<sub>1</sub>: {m1}</label>
        </div>
        <div>
        <input type="range" min={100} max={300} value={m2} className='cursor-pointer' onChange={(e) => setm2(parseFloat(e.target.value))} />
        <label>m<sub>2</sub>: {m2}</label>
        </div>
        <div>
        <input type="range" min={5} max={20} step={0.2} value={g} className='cursor-pointer' onChange={(e) => setg(parseFloat(e.target.value))} />
        <label>g: {g}</label>
        </div>
      </div>
      <hr />
      <div className='flex items-center justify-between gap-x-1 flex-wrap m-1.5'>
        <div>
        <input type="range" min={-180} max={180} value={((Math.round(a1) + 180) % 360 + 360) % 360 - 180} className='cursor-pointer' onChange={(e) => seta1(parseFloat(e.target.value) * Math.PI / 180)} />
        <label>θ<sub>1</sub>: {((Math.round(a1) + 180) % 360 + 360) % 360 - 180} &deg;</label>
        </div>
        <div>
        <input type="range" min={-2} max={4} step={0.1} value={a1dotm} className='cursor-pointer' onChange={(e) => seta1dotm(parseFloat(e.target.value))} />
        <label>ω<sub>1</sub>: {a1dotm}x</label>
        </div>
        <div>
        <input type="range" min={-180} max={180} value={((Math.round(a2) + 180) % 360 + 360) % 360 - 180} className='cursor-pointer' onChange={(e) => seta2(parseFloat(e.target.value) * Math.PI / 180)} />
        <label>θ<sub>2</sub>: {((Math.round(a2) + 180) % 360 + 360) % 360 - 180} &deg;</label>
        </div>
        <div>
        <input type="range" min={-2} max={4} step={0.1} value={a2dotm} className='cursor-pointer' onChange={(e) => seta2dotm(parseFloat(e.target.value))} />
        <label>ω<sub>2</sub>: {a2dotm}x</label>
        </div>
      </div>
      <hr />
      <div className='flex justify-center'>
      <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`${isRunning ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'}
             text-white font-bold py-2 px-4 mt-1 rounded cursor-pointer`}
        >
          {isRunning ? 'Pause' : 'Play'}
      </button>
      <button 
          onClick={() => {
            seta1(Math.PI / 4);
            seta2(Math.PI / 6);
            seta1dotm(1);
            seta2dotm(1);
            setIsRunning(false);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-1 ml-1 rounded cursor-pointer"
        >
          Reset
      </button>
      </div>
      <div className="flex justify-center mt-2">
        <canvas 
          ref={canvasRef}
          className="border border-gray-300 rounded"
        />
      </div>
    </div>
  )
}

export default App