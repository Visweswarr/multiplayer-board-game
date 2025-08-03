import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const InteractiveParticles = ({ count = 2000, mousePosition, color = "#ffffff" }) => {
  const pointsRef = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      // Velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Color
      const colorObj = new THREE.Color(color);
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }
    
    return { positions, velocities, colors };
  }, [count, color]);

  useFrame((state) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array;
      const velocities = particles.velocities;
      
      for (let i = 0; i < count; i++) {
        // Update position based on velocity
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Mouse interaction
        if (mousePosition) {
          const dx = positions[i * 3] - mousePosition.x * 10;
          const dy = positions[i * 3 + 1] - mousePosition.y * 10;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 3) {
            const force = (3 - distance) * 0.01;
            velocities[i * 3] += dx * force;
            velocities[i * 3 + 1] += dy * force;
          }
        }
        
        // Bounce off boundaries
        if (Math.abs(positions[i * 3]) > 10) velocities[i * 3] *= -0.8;
        if (Math.abs(positions[i * 3 + 1]) > 10) velocities[i * 3 + 1] *= -0.8;
        if (Math.abs(positions[i * 3 + 2]) > 10) velocities[i * 3 + 2] *= -0.8;
        
        // Damping
        velocities[i * 3] *= 0.99;
        velocities[i * 3 + 1] *= 0.99;
        velocities[i * 3 + 2] *= 0.99;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </Points>
  );
};

const EnergyField = ({ intensity = 1, color = "#4a90e2" }) => {
  const fieldRef = useRef();
  
  useFrame((state) => {
    if (fieldRef.current) {
      fieldRef.current.rotation.y += 0.001;
      fieldRef.current.rotation.x += 0.0005;
      fieldRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh ref={fieldRef} position={[0, 0, -5]}>
      <sphereGeometry args={[15, 32, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.3}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

const FloatingOrbs = ({ count = 5 }) => {
  const orbsRef = useRef();
  
  useFrame((state) => {
    if (orbsRef.current) {
      orbsRef.current.children.forEach((orb, index) => {
        orb.position.y = Math.sin(state.clock.elapsedTime + index) * 2;
        orb.rotation.y += 0.01;
        orb.material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.2;
      });
    }
  });

  return (
    <group ref={orbsRef}>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * (Math.PI * 2 / count)) * 8,
            0,
            Math.sin(i * (Math.PI * 2 / count)) * 8
          ]}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial 
            color={`hsl(${i * 72}, 70%, 60%)`}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

const AdvancedParticleSystem = ({ mousePosition, theme = "dark" }) => {
  const colors = useMemo(() => {
    switch (theme) {
      case "dark":
        return {
          primary: "#4a90e2",
          secondary: "#ff6b6b",
          accent: "#ffa502"
        };
      case "light":
        return {
          primary: "#3742fa",
          secondary: "#ff4757",
          accent: "#ffa502"
        };
      default:
        return {
          primary: "#4a90e2",
          secondary: "#ff6b6b",
          accent: "#ffa502"
        };
    }
  }, [theme]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      background: theme === "dark" 
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)'
    }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <ambientLight intensity={0.2} />
        
        {/* Interactive particles */}
        <InteractiveParticles 
          count={1500} 
          mousePosition={mousePosition} 
          color={colors.primary}
        />
        
        {/* Secondary particle layer */}
        <InteractiveParticles 
          count={800} 
          mousePosition={mousePosition} 
          color={colors.secondary}
        />
        
        {/* Energy field */}
        <EnergyField intensity={0.5} color={colors.accent} />
        
        {/* Floating orbs */}
        <FloatingOrbs count={6} />
        
        {/* Background stars */}
        <Stars 
          radius={100} 
          depth={50} 
          count={3000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.5}
        />
        
        {/* Sparkles effect */}
        <Sparkles 
          count={100} 
          scale={20} 
          size={1} 
          speed={0.3} 
          color={colors.accent}
        />
      </Canvas>
    </div>
  );
};

export default AdvancedParticleSystem; 