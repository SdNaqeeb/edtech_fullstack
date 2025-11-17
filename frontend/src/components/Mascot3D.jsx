// src/components/Mascot3D.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMascot } from '../contexts/MascotContext';

// Floating AI Orb with Holographic Effect
function FloatingOrb({ emotion }) {
  const orbRef = useRef();
  const ringsRef = useRef([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!orbRef.current) return;

    // Gentle floating
    orbRef.current.position.y = Math.sin(time * 0.8) * 0.15;
    orbRef.current.rotation.y = time * 0.3;

    // Rotate holographic rings
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x = time * (0.5 + i * 0.1);
        ring.rotation.y = time * (0.3 + i * 0.15);
        ring.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.05);
      }
    });
  });

  const orbColor = emotion.color || '#3B82F6';

  return (
    <group ref={orbRef} position={[0, 0, 0]}>
      {/* Main Glowing Orb */}
      <Sphere args={[0.8, 64, 64]}>
        <meshPhysicalMaterial
          color={orbColor}
          emissive={orbColor}
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
          transmission={0.3}
          thickness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>

      {/* Inner Core */}
      <Sphere args={[0.5, 32, 32]}>
        <meshPhysicalMaterial
          color="#ffffff"
          emissive={orbColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </Sphere>

      {/* Holographic Rings */}
      {[1.2, 1.4, 1.6].map((radius, i) => (
        <mesh
          key={i}
          ref={(el) => (ringsRef.current[i] = el)}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[radius, 0.02, 16, 100]} />
          <meshPhysicalMaterial
            color={orbColor}
            emissive={orbColor}
            emissiveIntensity={1}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Particle Effects */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 1.3;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle + i) * 0.3,
              Math.sin(angle) * radius,
            ]}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial
              color={orbColor}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Glossy Humanoid Robot
function GlossyRobot({ emotion }) {
  const robotRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const screenRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!robotRef.current) return;

    // Base animations
    const emotionName = emotion.name;

    // Floating
    robotRef.current.position.y = Math.sin(time * 1) * 0.08;

    // Emotion-specific animations
    switch (emotionName) {
      case 'happy':
      case 'excited':
      case 'celebrating':
        // Bouncing
        robotRef.current.position.y = Math.abs(Math.sin(time * 3)) * 0.2;
        robotRef.current.rotation.z = Math.sin(time * 2) * 0.08;

        // Arms up celebrating
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = Math.sin(time * 3) * 0.3 + 0.6;
          leftArmRef.current.rotation.x = Math.sin(time * 2) * 0.2;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = Math.sin(time * 3) * -0.3 - 0.6;
          rightArmRef.current.rotation.x = Math.sin(time * 2) * 0.2;
        }

        // Happy eyes
        if (leftEyeRef.current && rightEyeRef.current) {
          leftEyeRef.current.scale.set(1.3, 0.8, 1);
          rightEyeRef.current.scale.set(1.3, 0.8, 1);
        }
        break;

      case 'sad':
        // Drooping
        robotRef.current.position.y = Math.sin(time * 0.5) * 0.03 - 0.1;
        if (headRef.current) {
          headRef.current.rotation.x = 0.2;
        }
        if (leftArmRef.current) leftArmRef.current.rotation.z = 0.15;
        if (rightArmRef.current) rightArmRef.current.rotation.z = -0.15;

        // Sad eyes
        if (leftEyeRef.current && rightEyeRef.current) {
          leftEyeRef.current.scale.set(0.8, 1.2, 1);
          rightEyeRef.current.scale.set(0.8, 1.2, 1);
        }
        break;

      case 'thinking':
        // Head tilt
        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(time * 0.8) * 0.3;
          headRef.current.rotation.z = Math.sin(time * 0.6) * 0.1;
        }
        // Hand on chin
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -1.2;
          rightArmRef.current.rotation.x = 0.3;
        }
        break;

      case 'teaching':
        // Nodding
        if (headRef.current) {
          headRef.current.rotation.x = Math.sin(time * 2) * 0.15;
        }
        // Pointing
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = Math.sin(time * 1.5) * 0.2 - 0.9;
          rightArmRef.current.rotation.y = 0.3;
        }
        break;

      case 'waving':
      case 'idle':
      default:
        // Gentle wave
        robotRef.current.rotation.y = Math.sin(time * 0.3) * 0.08;
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = Math.sin(time * 2) * 0.4 - 0.4;
          rightArmRef.current.rotation.x = Math.sin(time * 2.5) * 0.3;
        }
        break;
    }

    // Screen glow effect
    if (screenRef.current) {
      screenRef.current.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.2;
    }
  });

  const robotColor = emotion.color || '#3B82F6';

  // Premium materials
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: robotColor,
    metalness: 0.9,
    roughness: 0.15,
    envMapIntensity: 1.5,
  }), [robotColor]);

  const glossMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 1,
    roughness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    reflectivity: 1,
  }), []);

  return (
    <group ref={robotRef} position={[0, -0.5, 0]}>
      {/* Body */}
      <group position={[0, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.4, 0.8, 32, 32]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Chest Screen */}
        <mesh ref={screenRef} position={[0, 0.1, 0.41]} castShadow>
          <planeGeometry args={[0.5, 0.6]} />
          <meshPhysicalMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Chest Details - Holographic Lines */}
        {[-0.15, 0, 0.15].map((y, i) => (
          <mesh key={i} position={[0, y, 0.42]}>
            <boxGeometry args={[0.4, 0.02, 0.01]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.1, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Face Screen */}
        <mesh position={[0, 0, 0.36]}>
          <circleGeometry args={[0.25, 32]} />
          <meshPhysicalMaterial
            color="#000033"
            emissive="#0066ff"
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.1}
          />
        </mesh>

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.12, 0.05, 0.37]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={2}
          />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.12, 0.05, 0.37]} castShadow>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={2}
          />
        </mesh>

        {/* Antenna */}
        <group position={[0, 0.35, 0]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 16]} />
            <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={1.5}
            />
          </mesh>
          {/* Antenna rings */}
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.15 + i * 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.08 + i * 0.03, 0.005, 8, 32]} />
              <meshBasicMaterial color="#FFD700" transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.5, 0.6, 0]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.08, 0.5, 16, 16]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <primitive object={glossMaterial} attach="material" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.5, 0.6, 0]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.08, 0.5, 16, 16]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <primitive object={glossMaterial} attach="material" />
        </mesh>
      </group>

      {/* Legs */}
      <group position={[0, -0.4, 0]}>
        {/* Left Leg */}
        <mesh position={[-0.15, -0.3, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.1, 0.5, 16, 16]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
        {/* Right Leg */}
        <mesh position={[0.15, -0.3, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.1, 0.5, 16, 16]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Feet */}
        <mesh position={[-0.15, -0.6, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.08, 0.25]} />
          <primitive object={glossMaterial} attach="material" />
        </mesh>
        <mesh position={[0.15, -0.6, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.08, 0.25]} />
          <primitive object={glossMaterial} attach="material" />
        </mesh>
      </group>

      {/* Floating energy rings around robot */}
      {[0.4, 0.8, 1.2].map((y, i) => (
        <mesh
          key={i}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.6 + i * 0.1, 0.01, 16, 64]} />
          <meshBasicMaterial
            color={robotColor}
            transparent
            opacity={0.15 - i * 0.03}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main Mascot3D Component
const Mascot3D = ({ style = 'robot' }) => {
  const { currentEmotion } = useMascot();

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.8} color={currentEmotion.color} />
        <pointLight position={[0, -5, 5]} intensity={0.5} color="#ffffff" />
        <spotLight
          position={[0, 8, 0]}
          angle={0.5}
          penumbra={1}
          intensity={1}
          castShadow
          color={currentEmotion.color}
        />

        {/* Choose style */}
        {style === 'orb' ? (
          <FloatingOrb emotion={currentEmotion} />
        ) : (
          <GlossyRobot emotion={currentEmotion} />
        )}

        {/* Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Environment */}
        <color attach="background" args={['transparent']} />
      </Canvas>
    </div>
  );
};

export default Mascot3D;
