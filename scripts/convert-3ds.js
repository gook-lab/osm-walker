/**
 * 3DS to GLB 변환 스크립트
 * Three.js TDSLoader를 사용하여 3DS 파일을 GLB로 변환
 */

import * as THREE from 'three';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// JSDOM 설정 (Node.js 환경에서 Three.js 사용)
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});
global.window = dom.window;
global.document = dom.window.document;
global.self = dom.window;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.FileReader = dom.window.FileReader;

const INPUT_FILE = 'public/models/props/Bus_Stop_06.3DS';
const OUTPUT_FILE = 'public/models/props/bus_stop.glb';

async function convert3DSToGLB() {
  console.log(`Converting: ${INPUT_FILE}`);

  const loader = new TDSLoader();
  const absolutePath = path.resolve(INPUT_FILE);

  // 파일 읽기
  const buffer = fs.readFileSync(absolutePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  try {
    // 3DS 파싱
    const group = loader.parse(arrayBuffer, path.dirname(absolutePath) + '/');

    // 스케일 조정 (3DS 파일은 보통 크기가 큼)
    group.scale.set(0.01, 0.01, 0.01);

    // 머티리얼 기본값 설정
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.7,
            metalness: 0.3,
          });
        } else if (child.material instanceof THREE.MeshPhongMaterial) {
          // MeshPhongMaterial을 MeshStandardMaterial로 변환
          const oldMat = child.material;
          child.material = new THREE.MeshStandardMaterial({
            color: oldMat.color,
            roughness: 0.7,
            metalness: 0.3,
          });
        }
      }
    });

    // GLB로 내보내기
    const exporter = new GLTFExporter();

    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        group,
        (result) => resolve(result),
        (error) => reject(error),
        { binary: true }
      );
    });

    // 파일 저장
    const outputPath = path.resolve(OUTPUT_FILE);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(glbBuffer));

    const stats = fs.statSync(outputPath);
    console.log(`Success: ${OUTPUT_FILE} (${(stats.size / 1024).toFixed(2)} KB)`);

  } catch (error) {
    console.error('Conversion failed:', error.message);
    process.exit(1);
  }
}

convert3DSToGLB();
