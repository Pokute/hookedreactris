import React, { Component, useState, useEffect, useMemo } from 'react';
import './App.css';

type BlockState = 'empty' | 'used' | 'falling';
const blockStateColors = {
  empty: 'black',
  used: 'white',
  falling: 'green',
};

const Block = ({bs} : {bs: BlockState}) => (
  <div style={{
    width:'20px',
    height:'20px',
    backgroundColor: blockStateColors[bs]
  }}>
  </div>
)

const intialShapes = {
  line: {
    shape:  '  x  '
          + '  x  '
          + '  x  '
          + '  x  ',
    offset: { x: 2, y: 1 },
  },
  t: {
    shape:  '  x  '
          + ' xxx ',
    offset: { x: 2, y: 1 },
  },
  square: {
    shape:  ' xx  '
          + ' xx  ',
    offset: { x: 2, y: 0 },
  },
  z: {
    shape:  ' xx  '
          + '  xx ',
    offset: { x: 2, y: 0 },
  },
  s: {
    shape:  '  xx '
          + ' xx  ',
    offset: { x: 2, y: 0 },
  },
  l: {
    shape:  '  x  '
          + '  x  '
          + '  xx ',
    offset: { x: 2, y: 1 },
  },
  j: {
    shape:  '   x '
          + '   x '
          + '  xx ',
    offset: { x: 2, y: 1 },
  },
};
const es = Object.entries(intialShapes);
const pshapes: any[][] = es.map(([shapeName, shape]) => [
  shapeName,
  {
    ...shape,
    shapeA: shape.shape.split('')
      .map(block => block === 'x' ? true : false)
      .reduce((acc: Array<{x: number, y: number}>, block, i) => (block ? [...acc, {x: i % 5 - shape.offset.x, y : Math.floor(i / 5) - shape.offset.y}] : acc), []),
  }
])
const shapes = pshapes.reduce((acc: any, cur) => ({...acc, [cur[0]]: cur[1]}), {});

const HookedReacTris = () => {
  const initialBlockPosition = {x: 4, y: -2};
  const height = 16;
  const width = 9;
  type Grid = any;
  const newRandomShape = () => Object.keys(shapes)[Math.floor(Math.random() * Object.keys(shapes).length)];
  const [alive, setAlive] = useState(true);
  const [completedLines, setCompletedLines] = useState(0);
  const [grid, setGrid] = useState(new Array(width * height).fill('empty'));
  const [blockShape, setBlockShape] = useState(newRandomShape());
  const [blockRotation, setBlockRotation] = useState(0);
  const [blockPosition, setBlockPosition] = useState(initialBlockPosition);
  
  const rotationMatrices = [
    [1, 0, 0, 1],
    [0, 1, -1, 0],
    [-1, 0, 0, -1],
    [0, -1, 1, 0],
  ];

  const rotate = (elements: Array<{x: number, y: number}>, rotation: 0 | 1 | 2 | 3) => {
    const rM = rotationMatrices[rotation];
    return elements.map(({x, y}) => ({x: x * rM[0] + y * rM[1], y: x * rM[2] + y * rM[3]}));
  }

  const rotatedShape = useMemo(() => rotate(shapes[blockShape].shapeA, blockRotation as (0 | 1 | 2 | 3)), [blockRotation, blockShape]);

  const onStep = useMemo(() => () => {
    if (!alive) return;
    const getGraphics = (usedGrid: any) => usedGrid.map((block: BlockState) => blockStateColors[block][0]).join('')

    const nextStep = getGridWithA(addOffsetToA(rotatedShape, {x: blockPosition.x, y: blockPosition.y + 1}))
    if (addOffsetToA(rotatedShape, {x: blockPosition.x, y: blockPosition.y + 1}).some(({x, y}) => (y >= height) || (grid[y * width + x] === 'used'))) {
      const newGrid = getGridWithA(addOffsetToA(rotatedShape, blockPosition), 'used')
        .reduce((rows: BlockState[][], block, blockIndex) => (blockIndex % width === 0) ? [...rows, [block]] : [...rows.slice(0, -1), [...rows[rows.length-1], block] ], [])
        .filter(row => !row.every(block => block === 'used'))
      const completedLines = (height - newGrid.length);
      setCompletedLines(lines => lines + completedLines);
      const filledGrid = [...(new Array(completedLines)).fill(undefined).map(val => new Array(width).fill('empty')), ...newGrid]
        .reduce((acc, row) => [...acc, ...row], []);

      setGrid(filledGrid);

      if (addOffsetToA(rotatedShape, {x: blockPosition.x, y: blockPosition.y + 1}).some(({y}) => y < 0)) {
        setAlive(false);
        return;
      }

      setBlockPosition(initialBlockPosition);
      setBlockShape(newRandomShape());
    } else {
      setBlockPosition(({x, y}) => ({x, y: y + 1}));
    }
  }, [grid, rotatedShape, blockPosition, rotatedShape, blockShape])

  useEffect(() => {
    const interval = setTimeout(onStep, 250);
    return () => clearTimeout(interval);
  }, [onStep])

  const addOffsetToA = (elements: Array<{x: number, y: number}>, offset: {x: number, y: number}) =>
    elements.map(({x, y}) => ({x: x+offset.x, y: y+offset.y}))

  const getGridWithA = (elements: Array<{x: number, y: number}>, state: BlockState = 'used') => {
    return (grid.map((curr: BlockState, blockIndex: number) => elements.find(({x, y}) => (blockIndex === (y * width + x))) ? state : curr));
  }

  const gridWithFalling = alive ? getGridWithA(addOffsetToA(rotatedShape, blockPosition), 'falling') : grid;

  const tryMove = useMemo(() => (xDelta: -1 | 1) => {
    if (!alive) return;
    if (addOffsetToA(rotatedShape, {x: blockPosition.x + xDelta, y: blockPosition.y}).every(({x, y}) => ((x >= 0) && (x <= width - 1) && (y <= height -1) && ((y < 0) || (grid[y * width + x] === 'empty'))))) {
      setBlockPosition(({x, y}) => ({x: x + xDelta, y}));
    }
  }, [alive, rotatedShape, blockPosition, grid]);

  const tryRotate = useMemo(() => (rDelta: -1 | 1) => {
    if (!alive) return;
    const newRotation: 0 | 1 | 2 | 3 = (blockRotation + rDelta) % 4 as 0 | 1 | 2 | 3;
    if (addOffsetToA(rotate(shapes[blockShape].shapeA, newRotation), blockPosition).every(({x, y}) => ((x >= 0) && (x <= width - 1) && (y <= height -1) &&  ((y < 0) || (grid[y * width + x] === 'empty'))))) {
      setBlockRotation(newRotation);
    }
  }, [alive, blockShape, blockPosition, blockRotation, grid]);

  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <h1>HookedReacTris</h1>
      <h2>Score: {completedLines}</h2>
      {!alive && (<h2>Game over</h2>)}
      <table
        style={{alignSelf: 'center'}}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'ArrowLeft': tryMove(-1); break;
            case 'ArrowRight': tryMove(1); break;
            case 'ArrowUp': tryRotate(1); break;
            case 'ArrowDown': onStep(); break;
          }
        }}
        tabIndex={0}
      >
        <tbody>
          {gridWithFalling
            .filter((_: any, blockIndex: number) => (blockIndex % width) === 0)
            .map((row: any, rowIndex: number) => (
              <tr key={rowIndex}>
                {gridWithFalling
                  .filter((_: any, blockIndex: number) => Math.floor(blockIndex / width) === 0)
                  .map((block: any, c: number) => (
                  <td key={c}><Block bs={gridWithFalling[rowIndex * width + c]}/></td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
      <p>Click the play area for keyboard play</p>
      <div>
        <button
          onClick={() => tryRotate(1)}
        >
        </button>
        <button
          onClick={() => tryMove(-1)}
        >
          &lt;-
        </button>
        <button
          onClick={onStep}
        >
          Step
        </button>
        <button
          onClick={() => tryMove(1)}
          >
          -&gt;
        </button>
      </div>
    </div>
  );
}

const App = () => {
  const [gameNumber, setGameNumber] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <HookedReacTris key={gameNumber}/>
        <button onClick={() => setGameNumber(gn => gn + 1)}>New game</button>
      </header>
    </div>
  );
}

export default App;
