import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Box, RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

const FloatingCard = ({ game, onClick, index }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = React.useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + index) * 0.1;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <motion.group
      ref={meshRef}
      initial={{ scale: 0, opacity: 0, y: 2 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.2,
        type: "spring",
        stiffness: 100,
        damping: 10
      }}
      whileHover={{ 
        scale: 1.1, 
        z: 0.5,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card background */}
      <RoundedBox args={[2, 1.5, 0.1]} radius={0.1}>
        <meshStandardMaterial 
          color={hovered ? "#4a90e2" : "#ffffff"}
          transparent
          opacity={0.9}
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Card content */}
      <Text
        position={[0, 0.3, 0.06]}
        fontSize={0.2}
        color="#333"
        anchorX="center"
        anchorY="middle"
        font="/fonts/helvetiker_regular.typeface.json"
      >
        Game #{game.id.slice(-6)}
      </Text>

      <Text
        position={[0, 0, 0.06]}
        fontSize={0.15}
        color="#666"
        anchorX="center"
        anchorY="middle"
        font="/fonts/helvetiker_regular.typeface.json"
      >
        Players: {game.players.length}/2
      </Text>

      <Text
        position={[0, -0.3, 0.06]}
        fontSize={0.12}
        color="#999"
        anchorX="center"
        anchorY="middle"
        font="/fonts/helvetiker_regular.typeface.json"
      >
        Click to Join
      </Text>

      {/* Glow effect */}
      {hovered && (
        <motion.pointLight
          position={[0, 0, 2]}
          intensity={2}
          color="#4a90e2"
          initial={{ intensity: 0 }}
          animate={{ intensity: 2 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.group>
  );
};

const FloatingGameCards = ({ games, onJoinGame }) => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4a90e2" />
        
        {games.map((game, index) => (
          <FloatingCard
            key={game.id}
            game={game}
            index={index}
            onClick={() => onJoinGame(game.id)}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default FloatingGameCards; 