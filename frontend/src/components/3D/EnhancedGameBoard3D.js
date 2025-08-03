import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere, 
  Cylinder,
  RoundedBox,
  useTexture,
  Environment,
  Stars,
  Sparkles
} from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

const BoardCell = ({ position, value, onClick, disabled, isLastMove, gameType, index }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (hovered && !disabled) {
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const getCellGeometry = () => {
    switch (gameType) {
      case 'tic-tac-toe':
        return <Box args={[0.8, 0.8, 0.1]} />;
      case 'connect-four':
        return <Cylinder args={[0.3, 0.3, 0.1, 8]} />;
      case 'checkers':
        return <Cylinder args={[0.25, 0.25, 0.05, 8]} />;
      default:
        return <Box args={[0.8, 0.8, 0.1]} />;
    }
  };

  const getPieceGeometry = () => {
    switch (gameType) {
      case 'tic-tac-toe':
        return value === 'X' ? (
          <group>
            <Box args={[0.1, 0.6, 0.1]} position={[0, 0, 0.1]} />
            <Box args={[0.6, 0.1, 0.1]} position={[0, 0, 0.1]} />
          </group>
        ) : value === 'O' ? (
          <Cylinder args={[0.25, 0.25, 0.1, 8]} position={[0, 0, 0.1]} />
        ) : null;
      case 'connect-four':
        return <Sphere args={[0.25, 8, 8]} position={[0, 0, 0.1]} />;
      case 'checkers':
        return <Cylinder args={[0.2, 0.2, 0.03, 8]} position={[0, 0, 0.05]} />;
      default:
        return null;
    }
  };

  const getPieceColor = () => {
    switch (gameType) {
      case 'tic-tac-toe':
        return value === 'X' ? '#ff4757' : '#3742fa';
      case 'connect-four':
        return value === 'red' ? '#ff4757' : '#ffa502';
      case 'checkers':
        return value === 'red' ? '#ff4757' : '#2f3542';
      default:
        return '#ffffff';
    }
  };

  return (
    <motion.group
      ref={meshRef}
      position={position}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      onPointerOver={() => !disabled && setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => !disabled && onClick()}
    >
      <mesh>
        <primitive object={getCellGeometry()} />
        <meshStandardMaterial 
          color={isLastMove ? '#ffa502' : '#ffffff'} 
          transparent 
          opacity={0.8}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>
      
      {value && (
        <motion.mesh
          initial={{ scale: 0, rotateZ: 0 }}
          animate={{ scale: 1, rotateZ: 360 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <primitive object={getPieceGeometry()} />
          <meshStandardMaterial 
            color={getPieceColor()}
            metalness={0.8}
            roughness={0.2}
          />
        </motion.mesh>
      )}
      
      {isLastMove && (
        <Sparkles 
          count={20} 
          scale={1} 
          size={2} 
          speed={0.3} 
          color="#ffa502"
        />
      )}
    </motion.group>
  );
};

const GameBoard = ({ board, onMove, disabled, lastMove, gameType }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const getBoardLayout = () => {
    switch (gameType) {
      case 'tic-tac-toe':
        return Array.from({ length: 9 }, (_, i) => ({
          position: [
            (i % 3 - 1) * 1.2,
            Math.floor(i / 3) * -1.2 + 1.2,
            0
          ],
          index: i
        }));
      case 'connect-four':
        return Array.from({ length: 42 }, (_, i) => ({
          position: [
            (i % 7 - 3) * 0.8,
            Math.floor(i / 7) * -0.8 + 2.5,
            0
          ],
          index: i
        }));
      case 'checkers':
        return Array.from({ length: 32 }, (_, i) => ({
          position: [
            (i % 8 - 3.5) * 0.6,
            Math.floor(i / 8) * -0.6 + 1.4,
            0
          ],
          index: i
        }));
      default:
        return [];
    }
  };

  const boardLayout = useMemo(() => getBoardLayout(), [gameType]);

  return (
    <motion.group
      ref={groupRef}
      initial={{ rotateY: -Math.PI / 4, rotateX: Math.PI / 6 }}
      animate={{ rotateY: -Math.PI / 4, rotateX: Math.PI / 6 }}
      transition={{ duration: 1 }}
    >
      {/* Board background */}
      <mesh position={[0, 0, -0.1]}>
        <Box args={[gameType === 'connect-four' ? 6 : 4, gameType === 'connect-four' ? 5 : 4, 0.2]} />
        <meshStandardMaterial 
          color="#2f3542" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Grid lines */}
      {gameType === 'tic-tac-toe' && (
        <group>
          {[1, 2].map(i => (
            <mesh key={`v${i}`} position={[(i - 1.5) * 1.2, 0, 0]}>
              <Box args={[0.05, 3.6, 0.05]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          {[1, 2].map(i => (
            <mesh key={`h${i}`} position={[0, (i - 1.5) * 1.2, 0]}>
              <Box args={[3.6, 0.05, 0.05]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      )}

      {/* Cells */}
      {boardLayout.map(({ position, index }) => (
        <BoardCell
          key={index}
          position={position}
          value={board[index]}
          onClick={() => onMove(index)}
          disabled={disabled}
          isLastMove={lastMove === index}
          gameType={gameType}
          index={index}
        />
      ))}
    </motion.group>
  );
};

const Lighting = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4a90e2" />
      <pointLight position={[10, -10, -5]} intensity={0.3} color="#ff6b6b" />
      <Environment preset="sunset" />
    </>
  );
};

const FloatingParticles = () => {
  const particlesRef = useRef();
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <Stars 
      ref={particlesRef}
      radius={100} 
      depth={50} 
      count={5000} 
      factor={4} 
      saturation={0} 
      fade 
      speed={1}
    />
  );
};

const EnhancedGameBoard3D = ({ board, onMove, disabled, lastMove, gameType = 'tic-tac-toe' }) => {
  const [cameraPosition, setCameraPosition] = useState([0, 0, 8]);

  useEffect(() => {
    // Adjust camera based on game type
    switch (gameType) {
      case 'connect-four':
        setCameraPosition([0, 0, 12]);
        break;
      case 'checkers':
        setCameraPosition([0, 0, 10]);
        break;
      default:
        setCameraPosition([0, 0, 8]);
    }
  }, [gameType]);

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Lighting />
        <FloatingParticles />
        
        <GameBoard
          board={board}
          onMove={onMove}
          disabled={disabled}
          lastMove={lastMove}
          gameType={gameType}
        />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 6}
          maxDistance={20}
          minDistance={5}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
      
      {/* Game type indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '20px',
        fontSize: '14px',
        textTransform: 'capitalize'
      }}>
        {gameType.replace('-', ' ')}
      </div>
    </div>
  );
};

export default EnhancedGameBoard3D; 