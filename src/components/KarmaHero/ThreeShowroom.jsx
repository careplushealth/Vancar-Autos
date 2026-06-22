import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeShowroom() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create Scene
    const scene = new THREE.Scene();

    // Create Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.5, 2.0, 6.5);
    camera.lookAt(0, 0, 0);

    // Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Main Studio Spotlight (Directional)
    const studioLight = new THREE.DirectionalLight(0xffffff, 1.8);
    studioLight.position.set(5, 8, 4);
    studioLight.castShadow = true;
    studioLight.shadow.mapSize.width = 1024;
    studioLight.shadow.mapSize.height = 1024;
    studioLight.shadow.bias = -0.001;
    scene.add(studioLight);

    // Rim Light from back-left
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Soft overhead soft box light
    const overheadLight = new THREE.DirectionalLight(0xffffff, 0.5);
    overheadLight.position.set(0, 10, 0);
    scene.add(overheadLight);

    // ----------------------------------------------------
    // BUILD DYNAMIC 3D VEHICLE (HIGHLY REALISTIC DETAILS)
    // ----------------------------------------------------
    const carGroup = new THREE.Group();

    // Premium Materials (Physical clearcoat shaders)
    const paintMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0653A5, // Royal Blue Metallic Car Paint
      metalness: 0.95,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      sheen: 0.6,
      sheenRoughness: 0.1
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Carbon / Matte black trim
      metalness: 0.3,
      roughness: 0.5
    });

    const bodyTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark slate
      metalness: 0.5,
      roughness: 0.3
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x070a13, // Deep glossy window glass
      metalness: 0.98,
      roughness: 0.02,
      transparent: true,
      opacity: 0.9
    });

    const wheelRubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b0f19, // Deep black rubber tire
      roughness: 0.8
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Polish chrome rims / exhaust
      metalness: 1.0,
      roughness: 0.04
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Brake discs steel
      metalness: 0.9,
      roughness: 0.35
    });

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 3.5
    });

    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 2.5
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(3.6, 0.3, 1.6);
    const chassis = new THREE.Mesh(chassisGeo, paintMaterial);
    chassis.position.y = 0.06;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // 2. Front Hood/Nose slope
    const hoodGeo = new THREE.BoxGeometry(1.2, 0.26, 1.58);
    const hood = new THREE.Mesh(hoodGeo, paintMaterial);
    hood.position.set(1.2, 0.08, 0);
    hood.rotation.z = -0.07;
    hood.castShadow = true;
    hood.receiveShadow = true;
    carGroup.add(hood);

    // 3. Cabin Upper Block (Windshield & Roof)
    const cabinGeo = new THREE.BoxGeometry(1.48, 0.44, 1.34);
    const cabin = new THREE.Mesh(cabinGeo, paintMaterial);
    cabin.position.set(-0.25, 0.42, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);

    // Windshield Glass (Front Slope)
    const windshieldGeo = new THREE.BoxGeometry(0.66, 0.42, 1.25);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0.6, 0.32, 0);
    windshield.rotation.z = -0.56;
    carGroup.add(windshield);

    // Back Windshield Glass
    const backWindshieldGeo = new THREE.BoxGeometry(0.72, 0.42, 1.25);
    const backWindshield = new THREE.Mesh(backWindshieldGeo, glassMaterial);
    backWindshield.position.set(-1.1, 0.3, 0);
    backWindshield.rotation.z = 0.52;
    carGroup.add(backWindshield);

    // Side Windows
    const leftWindowGeo = new THREE.BoxGeometry(1.28, 0.3, 0.02);
    const leftWindow = new THREE.Mesh(leftWindowGeo, glassMaterial);
    leftWindow.position.set(-0.25, 0.4, 0.66);
    carGroup.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.z = -0.66;
    carGroup.add(rightWindow);

    // 4. Rear Spoiler GT Wing (Carbon fiber look)
    const spoilerGeo = new THREE.BoxGeometry(0.28, 0.04, 1.64);
    const spoiler = new THREE.Mesh(spoilerGeo, carbonMaterial);
    spoiler.position.set(-1.72, 0.44, 0);
    spoiler.castShadow = true;
    carGroup.add(spoiler);

    // Spoiler Struts
    const strutLeftGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
    const strutLeft = new THREE.Mesh(strutLeftGeo, carbonMaterial);
    strutLeft.position.set(-1.7, 0.32, 0.55);
    carGroup.add(strutLeft);

    const strutRight = strutLeft.clone();
    strutRight.position.z = -0.55;
    carGroup.add(strutRight);

    // 5. Front Bumper Splitter / Grille
    const grilleGeo = new THREE.BoxGeometry(0.04, 0.18, 0.9);
    const grille = new THREE.Mesh(grilleGeo, carbonMaterial);
    grille.position.set(1.801, 0.04, 0);
    carGroup.add(grille);

    // Side air intakes left/right
    const intakeGeo = new THREE.BoxGeometry(0.05, 0.14, 0.22);
    const intakeLeft = new THREE.Mesh(intakeGeo, carbonMaterial);
    intakeLeft.position.set(1.8, 0.02, 0.6);
    carGroup.add(intakeLeft);

    const intakeRight = intakeLeft.clone();
    intakeRight.position.z = -0.6;
    carGroup.add(intakeRight);

    // Front splitter lip (low ground effect)
    const splitterGeo = new THREE.BoxGeometry(0.4, 0.04, 1.62);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(1.64, -0.09, 0);
    carGroup.add(splitter);

    // Rear diffuser (aero details)
    const diffuserGeo = new THREE.BoxGeometry(0.4, 0.12, 1.54);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(-1.64, -0.08, 0);
    carGroup.add(diffuser);

    // 6. LED Headlights (Glossy Crystal Covers)
    const headlightLeftGeo = new THREE.BoxGeometry(0.08, 0.08, 0.22);
    const headlightLeft = new THREE.Mesh(headlightLeftGeo, headlightMaterial);
    headlightLeft.position.set(1.78, 0.14, 0.56);
    carGroup.add(headlightLeft);

    const headlightRight = headlightLeft.clone();
    headlightRight.position.z = -0.56;
    carGroup.add(headlightRight);

    // Headlight spotlight beams
    const headlightConeLeft = new THREE.SpotLight(0xffffff, 8, 12, Math.PI / 6, 0.5, 1);
    headlightConeLeft.position.set(1.8, 0.14, 0.56);
    headlightConeLeft.target.position.set(6, -0.5, 0.56);
    carGroup.add(headlightConeLeft);
    carGroup.add(headlightConeLeft.target);

    const headlightConeRight = headlightConeLeft.clone();
    headlightConeRight.position.z = -0.56;
    headlightConeRight.target.position.z = -0.56;
    carGroup.add(headlightConeRight);
    carGroup.add(headlightConeRight.target);

    // 7. Taillights (Red LED strips)
    const taillightLeftGeo = new THREE.BoxGeometry(0.05, 0.05, 0.32);
    const taillightLeft = new THREE.Mesh(taillightLeftGeo, taillightMaterial);
    taillightLeft.position.set(-1.801, 0.16, 0.54);
    carGroup.add(taillightLeft);

    const taillightRight = taillightLeft.clone();
    taillightRight.position.z = -0.54;
    carGroup.add(taillightRight);

    // 8. License Plates (UK Standard: Front White, Rear Yellow)
    const frontPlateGeo = new THREE.BoxGeometry(0.02, 0.08, 0.44);
    const frontPlateMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const frontPlate = new THREE.Mesh(frontPlateGeo, frontPlateMaterial);
    frontPlate.position.set(1.802, -0.06, 0);
    carGroup.add(frontPlate);

    const rearPlateGeo = new THREE.BoxGeometry(0.02, 0.08, 0.44);
    const rearPlateMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }); // Yellow
    const rearPlate = new THREE.Mesh(rearPlateGeo, rearPlateMaterial);
    rearPlate.position.set(-1.802, 0.05, 0);
    rearPlate.rotation.y = Math.PI; // Face backward
    carGroup.add(rearPlate);

    // 9. Twin Chrome Exhaust Pipes
    const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustLeft = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exhaustLeft.position.set(-1.76, -0.08, 0.44);
    carGroup.add(exhaustLeft);

    const exhaustRight = exhaustLeft.clone();
    exhaustRight.position.z = -0.44;
    carGroup.add(exhaustRight);

    // 10. Wheels, Static Brake Discs & Brake Calipers
    const wheels = [];

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.34, 24);
    wheelGeo.rotateX(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.35, 16);
    rimGeo.rotateX(Math.PI / 2);

    const spokeGeo = new THREE.BoxGeometry(0.54, 0.04, 0.04);
    const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16);
    discGeo.rotateX(Math.PI / 2);

    const caliperGeo = new THREE.BoxGeometry(0.07, 0.15, 0.1);

    const wheelPositions = [
      { x: 1.05, y: -0.15, z: 0.85, isLeft: true },
      { x: 1.05, y: -0.15, z: -0.85, isLeft: false },
      { x: -1.05, y: -0.15, z: 0.85, isLeft: true },
      { x: -1.05, y: -0.15, z: -0.85, isLeft: false }
    ];

    wheelPositions.forEach((pos) => {
      // Create static assembly for brakes (attached to carGroup so they DO NOT spin)
      const brakeAssembly = new THREE.Group();
      brakeAssembly.position.set(pos.x, pos.y, pos.z);

      const brakeDisc = new THREE.Mesh(discGeo, steelMaterial);
      brakeAssembly.add(brakeDisc);

      const brakeCaliper = new THREE.Mesh(caliperGeo, paintMaterial); // Caliper matches body red paint
      brakeCaliper.position.set(-0.06, 0.14, pos.isLeft ? 0.06 : -0.06);
      brakeCaliper.rotation.y = pos.isLeft ? 0.1 : -0.1;
      brakeAssembly.add(brakeCaliper);

      carGroup.add(brakeAssembly);

      // Create rotating tire assembly (added to wheels array to rotate in loop)
      const tireAssembly = new THREE.Group();
      tireAssembly.position.set(pos.x, pos.y, pos.z);

      // Rubber Tire
      const tire = new THREE.Mesh(wheelGeo, wheelRubberMaterial);
      tireAssembly.add(tire);

      // Chrome Rim
      const rim = new THREE.Mesh(rimGeo, chromeMaterial);
      tireAssembly.add(rim);

      // 5-Spoke Alloys
      const spokeGroup = new THREE.Group();
      spokeGroup.position.z = pos.isLeft ? 0.015 : -0.015;
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(spokeGeo, chromeMaterial);
        spoke.rotation.z = (s * Math.PI) / 2.5;
        spokeGroup.add(spoke);
      }
      tireAssembly.add(spokeGroup);

      tireAssembly.castShadow = true;
      carGroup.add(tireAssembly);
      wheels.push(tireAssembly);
    });

    // Elevate car so wheels align with turntable floor
    carGroup.position.y = 0.38;
    scene.add(carGroup);

    // 11. Royal Blue Neon Under-Car Glow Light
    const underGlow = new THREE.PointLight(0x0653A5, 4, 3.5, 1.5);
    underGlow.position.set(0, -0.22, 0); // Position underneath car
    carGroup.add(underGlow);

    // ----------------------------------------------------
    // PLATFORM & REFLECTIONS
    // ----------------------------------------------------
    const platformGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.06, 64);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.05,
      roughness: 0.4
    });
    const platform = new THREE.Mesh(platformGeo, platformMaterial);
    platform.position.y = -0.03;
    platform.receiveShadow = true;
    scene.add(platform);

    const ringGeo = new THREE.RingGeometry(2.22, 2.25, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x0653A5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMaterial);
    ring.position.y = 0.002;
    scene.add(ring);

    const floorGeo = new THREE.PlaneGeometry(15, 15);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.14 });
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.031;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(10, 10, 0x0653A5, 0xe2e8f0);
    gridHelper.position.y = -0.03;
    gridHelper.material.opacity = 0.28;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // ----------------------------------------------------
    // INTERACTION & ANIMATION LOOP
    // ----------------------------------------------------
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    container.addEventListener('mousemove', handleMouseMove);

    let clock = new THREE.Clock();
    let animationFrameId;

    const animateLoop = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for mouse controls
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      const baseRotation = elapsedTime * 0.18;
      carGroup.rotation.y = baseRotation + mouseRef.current.x * 0.8;
      carGroup.rotation.x = mouseRef.current.y * 0.35;
      carGroup.rotation.z = -mouseRef.current.x * 0.12;

      platform.rotation.y = baseRotation;
      ring.rotation.y = baseRotation;

      // Rotate wheel tires/alloys ONLY (brakes stay static)
      wheels.forEach((wheel) => {
        wheel.rotation.z = -elapsedTime * 0.8;
      });

      carGroup.position.y = 0.38 + Math.sin(elapsedTime * 2.2) * 0.024;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animateLoop);
    };

    animateLoop();

    // ----------------------------------------------------
    // RESIZE & CLEANUP
    // ----------------------------------------------------
    const handleResize = () => {
      if (!canvas || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderer.dispose();
      chassisGeo.dispose();
      hoodGeo.dispose();
      cabinGeo.dispose();
      windshieldGeo.dispose();
      backWindshieldGeo.dispose();
      leftWindowGeo.dispose();
      spoilerGeo.dispose();
      strutLeftGeo.dispose();
      grilleGeo.dispose();
      headlightLeftGeo.dispose();
      taillightLeftGeo.dispose();
      wheelGeo.dispose();
      rimGeo.dispose();
      spokeGeo.dispose();
      discGeo.dispose();
      caliperGeo.dispose();
      frontPlateGeo.dispose();
      rearPlateGeo.dispose();
      exhaustGeo.dispose();
      platformGeo.dispose();
      ringGeo.dispose();
      floorGeo.dispose();
      paintMaterial.dispose();
      carbonMaterial.dispose();
      bodyTrimMaterial.dispose();
      glassMaterial.dispose();
      wheelRubberMaterial.dispose();
      chromeMaterial.dispose();
      steelMaterial.dispose();
      headlightMaterial.dispose();
      taillightMaterial.dispose();
      platformMaterial.dispose();
      ringMaterial.dispose();
      floorMaterial.dispose();
    };
  }, []);

  return (
    <div className="karma-hero__visual" ref={containerRef}>
      <div className="karma-hero__canvas-container">
        <canvas className="karma-hero__canvas" ref={canvasRef} />
        <div className="karma-hero__ambient-glow" />
      </div>
    </div>
  );
}
