import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * ISS 3D Model Loader and Procedural Station Engine.
 * Supports custom .glb/.gltf models loaded from /models/iss.glb, /iss.glb,
 * and provides a high-fidelity procedural 3D model fallback.
 */

class ISSModelEngine {
  private customModel: THREE.Object3D | null = null;
  private isLoaded = false;
  private gltfLoader = new GLTFLoader();

  constructor() {
    this.attemptLoadCustomModel();
  }

  /**
   * Attempts to load user-provided 3D model from public directory
   */
  private attemptLoadCustomModel() {
    const candidatePaths = [
      '/models/iss.glb',
      '/models/iss.gltf',
      '/iss.glb',
      '/iss.gltf'
    ];

    const tryNext = (index: number) => {
      if (index >= candidatePaths.length) {
        return;
      }
      const path = candidatePaths[index];
      this.gltfLoader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          // Normalize scale to fit nicely in globe space (~0.05 to 0.08 units)
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = 0.06 / (maxDim || 1);
          model.scale.set(targetScale, targetScale, targetScale);

          // Add a subtle glowing beacon light to custom model
          const beacon = new THREE.PointLight(0x22d3ee, 1.5, 2);
          beacon.position.set(0, 0.02, 0);
          model.add(beacon);

          this.customModel = model;
          this.isLoaded = true;
          console.log(`✅ Loaded custom 3D ISS model from ${path}`);
        },
        undefined,
        () => {
          tryNext(index + 1);
        }
      );
    };

    tryNext(0);
  }

  /**
   * Builds a high-fidelity procedural 3D ISS station if no custom GLB is available
   */
  public createProceduralISS(): THREE.Group {
    const station = new THREE.Group();

    // 1. Central Truss Framework (Horizontal Spine)
    const trussGeo = new THREE.BoxGeometry(0.16, 0.008, 0.008);
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const truss = new THREE.Mesh(trussGeo, trussMat);
    station.add(truss);

    // 2. Pressurized Modules (Destiny Lab, Unity, Zarya, Kibo)
    const moduleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.3,
    });
    const mainHabGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.06, 16);
    const mainHab = new THREE.Mesh(mainHabGeo, moduleMat);
    mainHab.rotation.x = Math.PI / 2;
    mainHab.position.set(0, -0.004, 0);
    station.add(mainHab);

    // Cross-module
    const crossHabGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.04, 16);
    const crossHab = new THREE.Mesh(crossHabGeo, moduleMat);
    crossHab.rotation.z = Math.PI / 2;
    crossHab.position.set(0, -0.004, 0.012);
    station.add(crossHab);

    // 3. Solar Array Wings (Photovoltaic Panels)
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep solar blue
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.1,
    });

    const panelGeo = new THREE.BoxGeometry(0.035, 0.001, 0.07);

    // Left Solar Wing Pair
    const leftWing1 = new THREE.Mesh(panelGeo, solarMat);
    leftWing1.position.set(-0.065, 0, 0);
    station.add(leftWing1);

    const leftWing2 = new THREE.Mesh(panelGeo, solarMat);
    leftWing2.position.set(-0.065, 0, 0.045);
    station.add(leftWing2);

    // Right Solar Wing Pair
    const rightWing1 = new THREE.Mesh(panelGeo, solarMat);
    rightWing1.position.set(0.065, 0, 0);
    station.add(rightWing1);

    const rightWing2 = new THREE.Mesh(panelGeo, solarMat);
    rightWing2.position.set(0.065, 0, 0.045);
    station.add(rightWing2);

    // 4. Radiator Thermal Panels
    const radiatorMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      metalness: 0.2,
      roughness: 0.8,
    });
    const radGeo = new THREE.BoxGeometry(0.015, 0.001, 0.03);
    const rad1 = new THREE.Mesh(radGeo, radiatorMat);
    rad1.position.set(-0.02, 0.006, -0.015);
    station.add(rad1);

    const rad2 = new THREE.Mesh(radGeo, radiatorMat);
    rad2.position.set(0.02, 0.006, -0.015);
    station.add(rad2);

    // 5. Navigation & Telemetry Beacons
    const beaconGeo = new THREE.SphereGeometry(0.003, 8, 8);
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const greenBeaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const cyanBeaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    const portBeacon = new THREE.Mesh(beaconGeo, redBeaconMat);
    portBeacon.position.set(-0.08, 0.002, 0);
    station.add(portBeacon);

    const stbdBeacon = new THREE.Mesh(beaconGeo, greenBeaconMat);
    stbdBeacon.position.set(0.08, 0.002, 0);
    station.add(stbdBeacon);

    const zenithBeacon = new THREE.Mesh(beaconGeo, cyanBeaconMat);
    zenithBeacon.position.set(0, 0.015, 0);
    station.add(zenithBeacon);

    // Glowing Halo around station
    const haloGeo = new THREE.RingGeometry(0.07, 0.08, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    station.add(halo);

    return station;
  }

  /**
   * Instantiates an ISS 3D object for the Globe
   */
  public getStationObject(): THREE.Object3D {
    if (this.customModel) {
      return this.customModel.clone();
    }
    return this.createProceduralISS();
  }
}

export const issModelEngine = new ISSModelEngine();
