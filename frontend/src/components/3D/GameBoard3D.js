import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

const BoardCell = ({ position, value, onClick, disabled, isLastMove }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <motion.mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      whileHover={{ scale: disabled ? 1 : 1.1, z: 0.5 }}
      animate={{
        scale: isLastMove ? [1, 1.2, 1] : 1,
        transition: { duration: 0.3 }
      }}
    >
      <boxGeometry args={[0.8, 0.8, 0.1]} />
      <meshStandardMaterial 
        color={hovered && !disabled ? "#4a90e2" : "#ffffff"}
        transparent
        opacity={0.9}
        metalness={0.8}
        roughness={0.2}
      />
      {value && (
        <motion.group
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.4}
            color={value === 'X' ? "#ff6b6b" : "#4ecdc4"}
            anchorX="center"
            anchorY="middle"
            font="/fonts/helvetiker_regular.typeface.json"
          >
            {value}
          </Text>
        </motion.group>
      )}
    </motion.mesh>
  );
};

const GameBoard = ({ board, onMove, disabled, lastMove }) => {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const handleCellClick = (row, col) => {
    if (disabled || board[row][col] !== '') return;
    onMove(row, col);
  };

  const isLastMove = (row, col) => {
    return lastMove && lastMove.row === row && lastMove.col === col;
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Board background */}
      <Box args={[3.5, 3.5, 0.2]} position={[0, 0, -0.1]}>
        <meshStandardMaterial 
          color="#1a1a1a"
          transparent
          opacity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </Box>
      
      {/* Grid lines */}
      {[-1, 0, 1].map((x) => (
        <Box key={`v${x}`} args={[0.02, 3, 0.05]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#4a90e2" transparent opacity={0.6} />
        </Box>
      ))}
      {[-1, 0, 1].map((y) => (
        <Box key={`h${y}`} args={[3, 0.02, 0.05]} position={[0, y, 0]}>
          <meshStandardMaterial color="#4a90e2" transparent opacity={0.6} />
        </Box>
      ))}

      {/* Cells */}
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <BoardCell
            key={`${rowIndex}-${colIndex}`}
            position={[
              (colIndex - 1) * 1.1,
              (1 - rowIndex) * 1.1,
              0
            ]}
            value={cell}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            disabled={disabled}
            isLastMove={isLastMove(rowIndex, colIndex)}
          />
        ))
      )}
    </group>
  );
};

const Lighting = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4a90e2" />
      <pointLight position={[10, -10, 5]} intensity={0.5} color="#ff6b6b" />
    </>
  );
};

const GameBoard3D = ({ board, onMove, disabled, lastMove }) => {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Lighting />
        <GameBoard 
          board={board} 
          onMove={onMove} 
          disabled={disabled} 
          lastMove={lastMove} 
        />
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
};

export default GameBoard3D; 