// ThreeDBackground.jsx - Futuristic 3D Animated Background
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line, Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './ThreeDBackground.css';

// Animated Particle System
function ParticleField({ count = 5000 }) {
  const points = useRef();
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    points.current.rotation.x = time * 0.05;
    points.current.rotation.y = time * 0.075;

    // Animate individual particles
    const positions = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3 + 1] = Math.sin(time + positions[i3]) * 0.5;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00BCD4"
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Floating Geometric Shapes
function FloatingShape({ position, geometry, speed = 1 }) {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = time * speed * 0.3;
    meshRef.current.rotation.y = time * speed * 0.5;
    meshRef.current.position.y = position[1] + Math.sin(time * speed) * 0.5;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <primitive object={geometry} />
      <meshStandardMaterial
        color="#00BCD4"
        emissive="#00BCD4"
        emissiveIntensity={0.5}
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

// Neural Network Connections
function NeuralNetwork({ nodeCount = 50 }) {
  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      ),
      connections: []
    }));
  }, [nodeCount]);

  // Create connections between nearby nodes
  useMemo(() => {
    nodes.forEach((node, i) => {
      nodes.forEach((otherNode, j) => {
        if (i !== j && node.position.distanceTo(otherNode.position) < 5) {
          node.connections.push(otherNode.position);
        }
      });
    });
  }, [nodes]);

  return (
    <group>
      {/* Render nodes */}
      {nodes.map((node, i) => (
        <Sphere key={`node-${i}`} args={[0.1, 8, 8]} position={node.position}>
          <meshStandardMaterial
            color="#2196F3"
            emissive="#2196F3"
            emissiveIntensity={1}
          />
        </Sphere>
      ))}

      {/* Render connections */}
      {nodes.map((node, i) =>
        node.connections.map((targetPos, j) => (
          <Line
            key={`line-${i}-${j}`}
            points={[node.position, targetPos]}
            color="#00BCD4"
            lineWidth={1}
            transparent
            opacity={0.2}
          />
        ))
      )}
    </group>
  );
}

// Orbiting Rings
function OrbitingRings() {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ring1.current.rotation.x = time * 0.3;
    ring1.current.rotation.y = time * 0.2;
    ring2.current.rotation.x = time * -0.2;
    ring2.current.rotation.z = time * 0.4;
    ring3.current.rotation.y = time * 0.5;
    ring3.current.rotation.z = time * -0.3;
  });

  return (
    <group>
      <mesh ref={ring1}>
        <torusGeometry args={[8, 0.1, 16, 100]} />
        <meshStandardMaterial
          color="#00BCD4"
          emissive="#00BCD4"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[10, 0.1, 16, 100]} />
        <meshStandardMaterial
          color="#2196F3"
          emissive="#2196F3"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[12, 0.1, 16, 100]} />
        <meshStandardMaterial
          color="#3F51B5"
          emissive="#3F51B5"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

// Pulsating Energy Sphere
function EnergySphere() {
  const sphereRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(time * 2) * 0.2;
    sphereRef.current.scale.set(scale, scale, scale);
    sphereRef.current.rotation.x = time * 0.1;
    sphereRef.current.rotation.y = time * 0.15;
  });

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        color="#00BCD4"
        emissive="#00BCD4"
        emissiveIntensity={1}
        transparent
        opacity={0.1}
        wireframe
      />
    </mesh>
  );
}

// Main 3D Scene
function Scene() {
  const geometries = useMemo(() => [
    new THREE.OctahedronGeometry(1),
    new THREE.IcosahedronGeometry(1),
    new THREE.TetrahedronGeometry(1),
    new THREE.BoxGeometry(1, 1, 1),
  ], []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00BCD4" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2196F3" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={1} color="#3F51B5" />

      {/* Particle Field */}
      <ParticleField count={5000} />

      {/* Floating Geometric Shapes */}
      <FloatingShape position={[-5, 2, -5]} geometry={geometries[0]} speed={0.8} />
      <FloatingShape position={[5, -2, -3]} geometry={geometries[1]} speed={1.2} />
      <FloatingShape position={[-3, -3, 5]} geometry={geometries[2]} speed={1.0} />
      <FloatingShape position={[4, 3, 3]} geometry={geometries[3]} speed={0.9} />

      {/* Neural Network */}
      <NeuralNetwork nodeCount={40} />

      {/* Orbiting Rings */}
      <OrbitingRings />

      {/* Energy Sphere */}
      <EnergySphere />
    </>
  );
}

// Main Component
export default function ThreeDBackground({ isDarkMode }) {
  return (
    <div className="threejs-background">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <color attach="background" args={[isDarkMode ? '#0f172a' : '#fafbfc']} />
        <fog attach="fog" args={[isDarkMode ? '#0f172a' : '#fafbfc', 20, 50]} />
        <Scene />
      </Canvas>

      {/* Animated Overlay Effects */}
      <div className="overlay-effects">
        <div className="scan-line"></div>
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>
    </div>
  );
}
