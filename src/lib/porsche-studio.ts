import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const PORSCHE_ZONES = ["LEFT_DOOR", "RIGHT_DOOR", "HOOD", "REAR_WINDOW"] as const;
export type PorscheZone = (typeof PORSCHE_ZONES)[number];
export type SurfacePoint = { position: number[]; normal: number[]; mesh: string };
export type Sticker = SurfacePoint & {
  id: string;
  zone: PorscheZone;
  image: string;
  name: string;
  aspect: number;
  size: number;
  angle: number;
  opacity: number;
};
type EditorState = {
  stickers: Sticker[];
  selected: string | null;
  zone: PorscheZone;
  moving: boolean;
  showZones: boolean;
};
type Callbacks = {
  ready: () => void;
  progress: (percent: number) => void;
  error: () => void;
  move: (id: string, point: SurfacePoint) => void;
  select: (id: string) => void;
  zone: (zone: PorscheZone) => void;
  outside: () => void;
};
const VIEWS: Record<PorscheZone, number[]> = {
  LEFT_DOOR: [5.8, 2.1, 2.5],
  RIGHT_DOOR: [-5.8, 2.1, 2.5],
  HOOD: [0, 6, 6.5],
  REAR_WINDOW: [0, 5.4, -6.8],
};
const MAX_SIZE: Record<PorscheZone, [number, number]> = {
  LEFT_DOOR: [0.95, 0.42], RIGHT_DOOR: [0.95, 0.42],
  HOOD: [1.05, 0.72], REAR_WINDOW: [0.8, 0.43],
};

// Bounds are in the supplied model's metre-scale coordinates after grounding.
// The rear window is a separate mesh; body decals never project onto glass.
function inZone(point: THREE.Vector3, zone: PorscheZone) {
  const { x, y, z } = point;
  if (zone === "LEFT_DOOR" || zone === "RIGHT_DOOR")
    return (zone === "LEFT_DOOR" ? x > 0.66 : x < -0.68) &&
      y > 0.27 && y < 0.83 && z > -0.62 && z < 0.55;
  if (zone === "HOOD") return Math.abs(x) < 0.59 && y > 0.48 && y < 1 && z > 0.95 && z < 1.87;
  return Math.abs(x) < 0.5 && y > 0.87 && y < 1.18 && z > -1.6 && z < -0.91;
}
function surfaceAllowed(mesh: THREE.Mesh, zone: PorscheZone) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return zone === "REAR_WINDOW"
    ? mesh.name.startsWith("window_rear") && materials.some(m => m.name === "window")
    : materials.some(m => m.name === "paint" || m.name === "coat");
}
function disposeObject(object: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  object.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    for (const mat of Array.isArray(child.material) ? child.material : [child.material]) materials.add(mat);
  });
  materials.forEach(mat => {
    Object.values(mat).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    mat.dispose();
  });
  textures.forEach(texture => {
    texture.dispose();
    if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) texture.image.close();
  });
}

export class PorscheEditor {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.05, 80);
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private model: THREE.Object3D | null = null;
  private meshes: THREE.Mesh[] = [];
  private anchors = new Map<PorscheZone, SurfacePoint>();
  private decals = new Map<string, { mesh: THREE.Mesh; signature: string }>();
  private textures = new Map<string, THREE.Texture>();
  private markers = new Map<PorscheZone, HTMLButtonElement>();
  private highlight: THREE.Mesh | null = null;
  private state: EditorState = { stickers: [], selected: null, zone: "LEFT_DOOR", moving: false, showZones: true };
  private ray = new THREE.Raycaster();
  private abort = new AbortController();
  private resize: ResizeObserver;
  private visible = true;
  private visibility: IntersectionObserver;
  private disposed = false;
  private frame = 0;
  private dirty = true;
  private rebuilding = false;
  private cameraGoal: THREE.Vector3 | null = null;
  private env: THREE.WebGLRenderTarget;
  private drag: { id: string; point: SurfacePoint } | null = null;
  private pointer: { x: number; y: number } | null = null;
  private exporting = false;

  constructor(private host: HTMLElement, private callbacks: Callbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor(0xe9ece6);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute("aria-label", "Porsche 911 Carrera 4S — 3D");
    this.renderer.domElement.setAttribute("tabindex", "0");
    host.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.1;
    this.controls.maxDistance = 11;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.025;
    this.controls.target.set(0, 0.66, 0);
    this.camera.position.fromArray(VIEWS.LEFT_DOOR);
    this.controls.update();
    this.controls.addEventListener("start", this.cancelCamera);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    this.scene.environment = this.env.texture;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7564, 2));
    const key = new THREE.DirectionalLight(0xfff9ee, 3);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.1, far: 20 });
    key.shadow.bias = -0.0005;
    this.scene.add(key);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.18 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.012;
    floor.receiveShadow = true;
    this.scene.add(floor);
    for (const [index, zone] of PORSCHE_ZONES.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "decal-marker";
      button.textContent = String(index + 1).padStart(2, "0");
      button.style.visibility = "hidden";
      button.addEventListener("click", () => callbacks.zone(zone));
      host.appendChild(button);
      this.markers.set(zone, button);
    }
    this.resize = new ResizeObserver(() => {
      if (this.exporting) return;
      const { width, height } = host.getBoundingClientRect();
      this.renderer.setSize(Math.max(1, width), Math.max(1, height));
      this.camera.aspect = width / Math.max(1, height);
      this.camera.fov = Math.min(65, 36 + Math.max(0, 1.3 - this.camera.aspect) * 30);
      this.camera.updateProjectionMatrix();
      this.dirty = true;
    });
    this.resize.observe(host);
    this.visibility = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; this.dirty = true; });
    this.visibility.observe(host);
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", this.down, true);
    canvas.addEventListener("pointermove", this.move, true);
    canvas.addEventListener("pointerup", this.up, true);
    canvas.addEventListener("pointercancel", this.cancel, true);
    canvas.addEventListener("webglcontextlost", this.contextLost);
    this.tick();
    void this.load();
  }

  private cancelCamera = () => { this.cameraGoal = null; };
  private contextLost = (event: Event) => { event.preventDefault(); this.callbacks.error(); };

  private async load() {
    try {
      const response = await fetch("/models/porsche-911-carrera-4s.glb", { signal: this.abort.signal });
      if (!response.ok || !response.body) throw Error("MODEL_LOAD");
      const total = Number(response.headers.get("content-length")) || 25 * 1024 * 1024;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (!this.disposed) this.callbacks.progress(Math.min(95, Math.round(received / total * 95)));
      }
      const data = new Uint8Array(received);
      let offset = 0;
      chunks.forEach(chunk => { data.set(chunk, offset); offset += chunk.length; });
      const gltf = await new GLTFLoader().parseAsync(data.buffer, "");
      if (this.disposed) { disposeObject(gltf.scene); return; }
      this.model = gltf.scene;
      const remove: THREE.Object3D[] = [];
      this.model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        // The source includes a flat baked-shadow plane. Use our studio shadow instead.
        if (materials.some(m => m.name === "Material")) { remove.push(object); return; }
        object.castShadow = true;
        object.receiveShadow = true;
        this.meshes.push(object);
      });
      remove.forEach(object => { object.removeFromParent(); disposeObject(object); });
      const bounds = new THREE.Box3().setFromObject(this.model);
      this.model.position.y -= bounds.min.y;
      this.scene.add(this.model);
      this.model.updateMatrixWorld(true);
      const origins: Record<PorscheZone, number[]> = {
        LEFT_DOOR: [3, 0.55, -0.03], RIGHT_DOOR: [-3, 0.55, -0.03],
        HOOD: [0, 3, 1.35], REAR_WINDOW: [0, 3, -1.24],
      };
      for (const zone of PORSCHE_ZONES) {
        const direction = zone === "LEFT_DOOR" ? [-1, 0, 0] : zone === "RIGHT_DOOR" ? [1, 0, 0] : [0, -1, 0];
        this.ray.set(new THREE.Vector3().fromArray(origins[zone]), new THREE.Vector3().fromArray(direction));
        const hit = this.zoneHit(zone);
        if (!hit) throw Error("PLACEMENT_SURFACE");
        this.anchors.set(zone, this.serialize(hit));
      }
      this.rebuilding = true;
      this.updateHighlight();
      this.callbacks.progress(100);
      this.callbacks.ready();
    } catch (error) {
      if (!this.disposed && !(error instanceof DOMException && error.name === "AbortError")) this.callbacks.error();
    }
  }

  private zoneHit(zone: PorscheZone) {
    return this.ray.intersectObjects(this.meshes, false).find(hit =>
      surfaceAllowed(hit.object as THREE.Mesh, zone) && inZone(hit.point, zone));
  }
  private serialize(hit: THREE.Intersection): SurfacePoint {
    const normal = hit.face!.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
    return { position: hit.point.toArray(), normal: normal.toArray(), mesh: hit.object.name };
  }
  private pointAt(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1,
    ), this.camera);
  }
  private down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;
    this.pointer = { x: event.clientX, y: event.clientY };
    if (!this.state.moving || !this.state.selected) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.pointAt(event);
    const hit = this.zoneHit(this.state.zone);
    if (!hit) { this.callbacks.outside(); return; }
    this.renderer.domElement.setPointerCapture(event.pointerId);
    this.drag = { id: this.state.selected, point: this.serialize(hit) };
    this.previewMove();
  };
  private previewMove() {
    if (!this.drag) return;
    const { id, point } = this.drag;
    this.state = { ...this.state, stickers: this.state.stickers.map(sticker => sticker.id === id ? { ...sticker, ...point } : sticker) };
    this.rebuilding = true;
  }
  private move = (event: PointerEvent) => {
    if (!this.drag || !event.isPrimary) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.pointAt(event);
    const hit = this.zoneHit(this.state.zone);
    if (!hit) return;
    this.drag.point = this.serialize(hit);
    this.previewMove();
  };
  private up = (event: PointerEvent) => {
    if (!event.isPrimary) return;
    if (this.drag) {
      event.stopImmediatePropagation();
      const { id, point } = this.drag;
      this.drag = null;
      if (this.renderer.domElement.hasPointerCapture(event.pointerId)) this.renderer.domElement.releasePointerCapture(event.pointerId);
      this.callbacks.move(id, point);
    } else if (!this.state.moving && this.pointer && Math.hypot(event.clientX - this.pointer.x, event.clientY - this.pointer.y) < 5) {
      this.pointAt(event);
      const hit = this.ray.intersectObjects([...this.decals.values()].map(d => d.mesh), false)[0];
      if (hit) this.callbacks.select(hit.object.userData.stickerId);
    }
    this.pointer = null;
  };
  private cancel = (event: PointerEvent) => { this.up(event); };

  anchor(zone: PorscheZone) { return this.anchors.get(zone); }

  focus(zone: PorscheZone) {
    const target = new THREE.Vector3().fromArray(VIEWS[zone]);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.camera.position.copy(target);
      this.controls.update();
      this.cameraGoal = null;
    } else this.cameraGoal = target;
    this.dirty = true;
  }
  zoom(direction: number) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(direction > 0 ? 0.85 : 1.15).clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.dirty = true;
  }
  setLabels(labels: Record<PorscheZone, string>) {
    this.markers.forEach((marker, zone) => { marker.title = labels[zone]; marker.setAttribute("aria-label", labels[zone]); });
  }
  setState(state: EditorState) {
    const zoneChanged = state.zone !== this.state.zone;
    const showChanged = state.showZones !== this.state.showZones;
    this.state = state;
    this.controls.enableRotate = !state.moving;
    this.host.dataset.moving = String(state.moving);
    this.rebuilding = true;
    if (zoneChanged || showChanged) this.updateHighlight();
  }

  private orientation(point: SurfacePoint, zone: PorscheZone, angle: number) {
    const normal = new THREE.Vector3().fromArray(point.normal).normalize();
    const up = new THREE.Vector3(...(zone === "HOOD" ? [0, 0, -1] as const : zone === "REAR_WINDOW" ? [0, 0, 1] as const : [0, 1, 0] as const));
    const right = up.clone().cross(normal).normalize();
    up.copy(normal).cross(right).normalize();
    const matrix = new THREE.Matrix4().makeBasis(right, up, normal);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
    quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle * Math.PI / 180));
    return new THREE.Euler().setFromQuaternion(quaternion);
  }
  private project(point: SurfacePoint, zone: PorscheZone, width: number, height: number, angle: number) {
    const surface = this.meshes.find(mesh => mesh.name === point.mesh);
    if (!surface) return null;
    const geometry = new DecalGeometry(surface, new THREE.Vector3().fromArray(point.position), this.orientation(point, zone, angle), new THREE.Vector3(width, height, 0.22));
    // Clip to the allowed panel: an oversized decal cannot spill onto windows or wheels.
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    const uvs = geometry.getAttribute("uv");
    const p: number[] = [], n: number[] = [], uv: number[] = [];
    const center = new THREE.Vector3();
    for (let i = 0; i < positions.count; i += 3) {
      center.set(0, 0, 0);
      for (let j = 0; j < 3; j++) center.add(new THREE.Vector3().fromBufferAttribute(positions, i + j));
      if (!inZone(center.multiplyScalar(1 / 3), zone)) continue;
      for (let j = 0; j < 3; j++) {
        p.push(positions.getX(i + j), positions.getY(i + j), positions.getZ(i + j));
        n.push(normals.getX(i + j), normals.getY(i + j), normals.getZ(i + j));
        uv.push(uvs.getX(i + j), uvs.getY(i + j));
      }
    }
    geometry.dispose();
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    result.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
    result.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    return result;
  }
  private updateHighlight() {
    if (this.highlight) {
      this.highlight.removeFromParent();
      this.highlight.geometry.dispose();
      (this.highlight.material as THREE.Material).dispose();
      this.highlight = null;
    }
    const point = this.anchors.get(this.state.zone);
    if (point && this.state.showZones) {
      const [width, height] = MAX_SIZE[this.state.zone];
      const geometry = this.project(point, this.state.zone, width, height, 0);
      if (geometry) {
        this.highlight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xbed69a, opacity: 0.28, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
        this.highlight.renderOrder = 90;
        this.scene.add(this.highlight);
      }
    }
    this.dirty = true;
  }
  private rebuild() {
    this.rebuilding = false;
    if (!this.model) return;
    const ids = new Set(this.state.stickers.map(s => s.id));
    this.decals.forEach((decal, id) => {
      if (!ids.has(id)) { decal.mesh.removeFromParent(); decal.mesh.geometry.dispose(); (decal.mesh.material as THREE.Material).dispose(); this.decals.delete(id); }
    });
    this.state.stickers.forEach((sticker, index) => {
      const signature = JSON.stringify([sticker.position, sticker.normal, sticker.mesh, sticker.size, sticker.angle, sticker.opacity]);
      const existing = this.decals.get(sticker.id);
      if (existing?.signature === signature) return;
      if (existing) { existing.mesh.removeFromParent(); existing.mesh.geometry.dispose(); (existing.mesh.material as THREE.Material).dispose(); this.decals.delete(sticker.id); }
      const [maxW, maxH] = MAX_SIZE[sticker.zone];
      const width = Math.min(maxW, maxH * sticker.aspect) * sticker.size / 100;
      const geometry = this.project(sticker, sticker.zone, width, width / sticker.aspect, sticker.angle);
      if (!geometry) return;
      let texture = this.textures.get(sticker.image);
      if (!texture) {
        texture = new THREE.TextureLoader().load(sticker.image, () => { this.dirty = true; });
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        this.textures.set(sticker.image, texture);
      }
      const material = new THREE.MeshStandardMaterial({
        map: texture, transparent: true, opacity: sticker.opacity / 100, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -5 - index, polygonOffsetUnits: -1,
        roughness: 0.65, metalness: 0, alphaTest: 0.015,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 100 + index;
      mesh.userData.stickerId = sticker.id;
      this.scene.add(mesh);
      this.decals.set(sticker.id, { mesh, signature });
    });
    const images = new Set(this.state.stickers.map(s => s.image));
    this.textures.forEach((texture, image) => { if (!images.has(image)) { texture.dispose(); this.textures.delete(image); } });
    this.dirty = true;
  }
  private updateMarkers() {
    this.markers.forEach((marker, zone) => {
      const point = this.anchors.get(zone);
      if (!point || !this.state.showZones || this.state.moving) { marker.style.visibility = "hidden"; return; }
      const world = new THREE.Vector3().fromArray(point.position);
      const normal = new THREE.Vector3().fromArray(point.normal);
      const direction = this.camera.position.clone().sub(world);
      let visible = direction.dot(normal) > 0;
      if (visible) {
        const distance = direction.length();
        this.ray.set(this.camera.position, direction.negate().normalize());
        const hit = this.ray.intersectObjects(this.meshes, false)[0];
        visible = !hit || hit.distance > distance - 0.045;
      }
      const projected = world.project(this.camera);
      visible = visible && projected.z < 1 && Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1;
      marker.style.visibility = visible ? "visible" : "hidden";
      marker.style.left = `${(projected.x + 1) * 50}%`;
      marker.style.top = `${(1 - projected.y) * 50}%`;
      marker.setAttribute("aria-pressed", String(zone === this.state.zone));
    });
  }
  private tick = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    if (!this.visible || document.hidden || this.exporting) return;
    if (this.cameraGoal) {
      this.camera.position.lerp(this.cameraGoal, 0.12);
      if (this.camera.position.distanceTo(this.cameraGoal) < 0.005) { this.camera.position.copy(this.cameraGoal); this.cameraGoal = null; }
      this.dirty = true;
    }
    if (this.rebuilding) this.rebuild();
    if (this.controls.update()) this.dirty = true;
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.updateMarkers();
      this.dirty = false;
    }
  };

  async exportPNG(): Promise<Blob> {
    if (!this.model || this.exporting) throw Error("NOT_READY");
    this.exporting = true;
    const size = this.renderer.getSize(new THREE.Vector2());
    const ratio = this.renderer.getPixelRatio();
    if (this.rebuilding) this.rebuild();
    if (this.highlight) this.highlight.visible = false;
    try {
      const width = Math.min(2400, Math.max(1400, Math.round(size.x * 2)));
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(width, Math.round(width / this.camera.aspect), false);
      this.renderer.render(this.scene, this.camera);
      const canvas = document.createElement("canvas");
      const footer = Math.round(width * 0.043);
      canvas.width = width;
      canvas.height = this.renderer.domElement.height + footer;
      const context = canvas.getContext("2d");
      if (!context) throw Error("PNG_EXPORT");
      context.drawImage(this.renderer.domElement, 0, 0);
      context.fillStyle = "#e9ece6";
      context.fillRect(0, canvas.height - footer, width, footer);
      context.fillStyle = "#4f5a4d";
      context.font = `${Math.round(width * 0.0085)}px Arial, sans-serif`;
      context.fillText("ONROAD DESIGN STUDIO · Porsche 911 Carrera 4S", width * 0.02, canvas.height - footer * 0.6);
      context.fillText("3D: Karol Miklas · CC BY-SA 4.0 · creativecommons.org/licenses/by-sa/4.0/", width * 0.02, canvas.height - footer * 0.25);
      return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error("PNG_EXPORT")), "image/png"));
    } finally {
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(size.x, size.y, false);
      if (this.highlight) this.highlight.visible = this.state.showZones;
      this.exporting = false;
      this.dirty = true;
    }
  }

  dispose() {
    this.disposed = true;
    this.abort.abort();
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.visibility.disconnect();
    this.controls.removeEventListener("start", this.cancelCamera);
    this.controls.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.down, true);
    canvas.removeEventListener("pointermove", this.move, true);
    canvas.removeEventListener("pointerup", this.up, true);
    canvas.removeEventListener("pointercancel", this.cancel, true);
    canvas.removeEventListener("webglcontextlost", this.contextLost);
    disposeObject(this.scene);
    this.env.dispose();
    this.renderer.dispose();
    canvas.remove();
    this.markers.forEach(marker => marker.remove());
  }
}
