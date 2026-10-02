import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * ISS 3D Model Loader and Procedural Station Engine.
 * Supports custom GLTF/GLB models loaded from /models/iss/scene.gltf, /models/iss.glb, etc.
 * Provides a high-visibility, large-scale 3D model sized for prominent visibility on the 3D Globe.
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
      '/models/iss/scene.gltf',
      '/models/iss.glb',
      '/models/iss.gltf',
      '/iss.glb',
      '/iss.gltf',
      '/models/iss/iss.glb'
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
          
          // Re-center geometry
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          // Sized prominently for Globe (R=100) -> Target dimension ~ 14.0 units
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = 14.0 / (maxDim || 1);
          model.scale.set(targetScale, targetScale, targetScale);

          // Wrap inside a container with orbital beacons & beacon lights
          const container = new THREE.Group();
          container.add(model);

          // High-intensity emissive beacon lights to illuminate the station in dark space
          const beaconLight = new THREE.PointLight(0x38bdf8, 5, 40);
          beaconLight.position.set(0, 3, 0);
          container.add(beaconLight);

          const ambientFill = new THREE.AmbientLight(0xffffff, 2.5);
          container.add(ambientFill);

          // Glowing Target Reticle Ring around station
          const reticleGeo = new THREE.RingGeometry(8.0, 9.0, 48);
          const reticleMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          });
          const reticle = new THREE.Mesh(reticleGeo, reticleMat);
          reticle.rotation.x = Math.PI / 2;
          container.add(reticle);

          // Glowing Sphere marker at center of ISS
          const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
          const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const coreMesh = new THREE.Mesh(coreGeo, coreMat);
          container.add(coreMesh);

          this.customModel = container;
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
   * Sized for Globe R=100 (Span ~ 15.0 units)
   */
  public createProceduralISS(): THREE.Group {
    const station = new THREE.Group();

    // 1. Central Truss Framework (Horizontal Spine)
    const trussGeo = new THREE.BoxGeometry(15.0, 0.9, 0.9);
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xa1a1aa,
      emissiveIntensity: 0.4,
    });
    const truss = new THREE.Mesh(trussGeo, trussMat);
    station.add(truss);

    // 2. Pressurized Modules (Destiny Lab, Unity, Zarya, Kibo)
    const moduleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
    });
    const mainHabGeo = new THREE.CylinderGeometry(0.9, 0.9, 6.0, 24);
    const mainHab = new THREE.Mesh(mainHabGeo, moduleMat);
    mainHab.rotation.x = Math.PI / 2;
    mainHab.position.set(0, -0.4, 0);
    station.add(mainHab);

    // Cross-module
    const crossHabGeo = new THREE.CylinderGeometry(0.75, 0.75, 4.0, 24);
    const crossHab = new THREE.Mesh(crossHabGeo, moduleMat);
    crossHab.rotation.z = Math.PI / 2;
    crossHab.position.set(0, -0.4, 1.2);
    station.add(crossHab);

    // 3. Solar Array Wings (Photovoltaic Panels) - Sizable, Glowing Blue
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Solar blue
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1,
    });

    const panelGeo = new THREE.BoxGeometry(3.5, 0.15, 6.5);

    // Left Solar Wing Pair
    const leftWing1 = new THREE.Mesh(panelGeo, solarMat);
    leftWing1.position.set(-6.0, 0, 0);
    station.add(leftWing1);

    const leftWing2 = new THREE.Mesh(panelGeo, solarMat);
    leftWing2.position.set(-6.0, 0, 4.5);
    station.add(leftWing2);

    // Right Solar Wing Pair
    const rightWing1 = new THREE.Mesh(panelGeo, solarMat);
    rightWing1.position.set(6.0, 0, 0);
    station.add(rightWing1);

    const rightWing2 = new THREE.Mesh(panelGeo, solarMat);
    rightWing2.position.set(6.0, 0, 4.5);
    station.add(rightWing2);

    // 4. Radiator Thermal Panels
    const radiatorMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7,
    });
    const radGeo = new THREE.BoxGeometry(1.5, 0.15, 3.0);
    const rad1 = new THREE.Mesh(radGeo, radiatorMat);
    rad1.position.set(-2.0, 0.6, -1.5);
    station.add(rad1);

    const rad2 = new THREE.Mesh(radGeo, radiatorMat);
    rad2.position.set(2.0, 0.6, -1.5);
    station.add(rad2);

    // 5. Navigation & Telemetry Beacons
    const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const greenBeaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const cyanBeaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    const portBeacon = new THREE.Mesh(beaconGeo, redBeaconMat);
    portBeacon.position.set(-7.8, 0.2, 0);
    station.add(portBeacon);

    const stbdBeacon = new THREE.Mesh(beaconGeo, greenBeaconMat);
    stbdBeacon.position.set(7.8, 0.2, 0);
    station.add(stbdBeacon);

    const zenithBeacon = new THREE.Mesh(beaconGeo, cyanBeaconMat);
    zenithBeacon.position.set(0, 1.5, 0);
    station.add(zenithBeacon);

    // Glowing Target Reticle Ring around station
    const reticleGeo = new THREE.RingGeometry(8.0, 9.0, 48);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.rotation.x = Math.PI / 2;
    station.add(reticle);

    // Self-illumination PointLight
    const light = new THREE.PointLight(0x38bdf8, 5, 40);
    light.position.set(0, 2.5, 0);
    station.add(light);

    const ambLight = new THREE.AmbientLight(0xffffff, 2.0);
    station.add(ambLight);

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
