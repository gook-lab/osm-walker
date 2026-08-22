#!/usr/bin/env node

/**
 * FBX to GLB 변환 스크립트
 *
 * FBX 파일들을 Three.js로 로드하여 GLB 포맷으로 변환합니다.
 * 선택적으로 Draco 압축을 적용할 수 있습니다.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

// Three.js를 Node.js에서 사용하기 위한 폴리필 설정
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});

// Global 설정
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.self = dom.window;
globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
globalThis.Blob = dom.window.Blob;
globalThis.FileReader = dom.window.FileReader;
globalThis.atob = dom.window.atob;
globalThis.btoa = dom.window.btoa;

// Node.js v23+에서는 navigator가 getter-only
try {
  globalThis.navigator = { userAgent: "node" };
} catch {
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent: "node" },
    writable: true,
    configurable: true,
  });
}

// URL.createObjectURL polyfill for Node.js
const blobURLs = new Map();
let blobIdCounter = 0;

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = (blob) => {
    const id = `blob:nodedata:${blobIdCounter++}`;
    blobURLs.set(id, blob);
    return id;
  };
}

if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = (url) => {
    blobURLs.delete(url);
  };
}

// window에도 URL 설정
dom.window.URL.createObjectURL =
  dom.window.URL.createObjectURL || globalThis.URL.createObjectURL;
dom.window.URL.revokeObjectURL =
  dom.window.URL.revokeObjectURL || globalThis.URL.revokeObjectURL;

// OffscreenCanvas polyfill
globalThis.OffscreenCanvas = class OffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      transform: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
    };
  }
  transferToImageBitmap() {
    return null;
  }
};

// Three.js imports (DOM 설정 후에 import)
const THREE = await import("three");
const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
const { GLTFExporter } = await import(
  "three/examples/jsm/exporters/GLTFExporter.js"
);

// gltf-transform imports
import { NodeIO } from "@gltf-transform/core";
import {
  dedup,
  prune,
  quantize,
  weld,
  reorder,
  draco,
} from "@gltf-transform/functions";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3d";
import { MeshoptEncoder } from "meshoptimizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const MODELS_DIR = path.join(ROOT_DIR, "public", "models");

// 변환할 FBX 파일 목록
// 참고: basic_lamp, kiosk_v3_fbx는 호환되지 않는 FBX 형식이라 제외됨
const FBX_FILES = [
  "buildings/Building_01.fbx",
  "buildings/Building_02.fbx",
  "buildings/Building_03.fbx",
  "buildings/Building_04.fbx",
  "buildings/Building_05.fbx",
  "houses/Building_01.fbx",
  "houses/Building_02.fbx",
  "houses/Building_03.fbx",
  "houses/Building_04.fbx",
  "houses/Building_05.fbx",
  "flattown/LP_FlatTown_1.fbx",
  "roads/highway road.fbx",
  "cars/LowPolyCars.fbx",
];

/**
 * MeshPhongMaterial을 MeshStandardMaterial로 변환
 */
function convertMaterials(object) {
  object.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      const convertedMaterials = materials.map((mat) => {
        if (
          mat.isMeshPhongMaterial ||
          mat.isMeshLambertMaterial ||
          mat.type === "MeshPhongMaterial" ||
          mat.type === "MeshLambertMaterial"
        ) {
          const newMat = new THREE.MeshStandardMaterial({
            name: mat.name,
            color: mat.color,
            map: mat.map,
            normalMap: mat.normalMap,
            transparent: mat.transparent,
            opacity: mat.opacity,
            side: mat.side,
            roughness: 0.7,
            metalness: 0.0,
          });
          return newMat;
        }
        return mat;
      });

      child.material = Array.isArray(child.material)
        ? convertedMaterials
        : convertedMaterials[0];
    }
  });
}

/**
 * FBX 파일을 로드하여 Three.js Object3D로 반환
 */
async function loadFBX(filePath) {
  const loader = new FBXLoader();
  const data = await fs.readFile(filePath);

  return new Promise((resolve, reject) => {
    try {
      const result = loader.parse(data.buffer, path.dirname(filePath) + "/");
      // Material 변환
      convertMaterials(result);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Three.js Object3D를 GLB ArrayBuffer로 변환
 */
async function exportToGLB(object) {
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      },
      { binary: true }
    );
  });
}

/**
 * gltf-transform을 사용하여 GLB 최적화 (Draco 압축 포함)
 */
async function optimizeGLB(glbBuffer, useDraco = true) {
  // MeshoptEncoder 초기화
  await MeshoptEncoder.ready;

  // Draco 인코더/디코더 초기화
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

  let dracoReady = false;
  if (useDraco) {
    try {
      const encoderModule = await draco3d.createEncoderModule();
      const decoderModule = await draco3d.createDecoderModule();

      io.registerDependencies({
        "draco3d.encoder": encoderModule,
        "draco3d.decoder": decoderModule,
      });
      dracoReady = true;
    } catch (error) {
      console.warn(
        "  Draco 초기화 실패, Draco 압축 없이 진행:",
        error.message
      );
    }
  }

  // GLB 읽기
  const document = await io.readBinary(new Uint8Array(glbBuffer));

  // 최적화 transforms 적용
  // weld: 중복 정점 병합, reorder: 캐시 최적화를 위한 정점 재정렬
  const transforms = [
    weld(), // 중복 정점 병합
    dedup(), // 중복 리소스 제거
    prune(), // 사용하지 않는 리소스 제거
    reorder({ encoder: MeshoptEncoder }), // 정점 재정렬
  ];

  // Draco 압축 적용 (인덱스 버퍼가 있는 메시에만 적용됨)
  if (dracoReady && useDraco) {
    transforms.push(draco());
  }

  // quantize는 Draco 후에 적용
  transforms.push(quantize());

  await document.transform(...transforms);

  // 최적화된 GLB 출력
  const optimizedBuffer = await io.writeBinary(document);
  return optimizedBuffer;
}

/**
 * 단일 FBX 파일을 GLB로 변환
 */
async function convertFile(relativePath, options = {}) {
  const { skipOptimize = false, skipDraco = false } = options;

  const inputPath = path.join(MODELS_DIR, relativePath);
  const outputPath = inputPath.replace(/\.fbx$/i, ".glb");

  console.log(`\n변환 중: ${relativePath}`);

  try {
    // 입력 파일 존재 확인
    try {
      await fs.access(inputPath);
    } catch {
      throw new Error(`파일을 찾을 수 없음: ${inputPath}`);
    }

    // 1. FBX 로드
    console.log("  FBX 로딩...");
    const object = await loadFBX(inputPath);

    // 2. GLB로 export
    console.log("  GLB로 변환...");
    const glbBuffer = await exportToGLB(object);

    let finalBuffer = glbBuffer;

    // 3. 최적화 (옵션)
    if (!skipOptimize) {
      console.log("  최적화 중...");
      try {
        finalBuffer = await optimizeGLB(glbBuffer, !skipDraco);
      } catch (error) {
        console.warn("  최적화 실패, 원본 GLB 저장:", error.message);
      }
    }

    // 4. 파일 저장
    await fs.writeFile(outputPath, Buffer.from(finalBuffer));

    // 파일 크기 비교
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    const ratio = ((outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(
      `  완료: ${(inputStats.size / 1024 / 1024).toFixed(2)}MB → ${(outputStats.size / 1024 / 1024).toFixed(2)}MB (${ratio}%)`
    );

    return {
      success: true,
      inputPath,
      outputPath,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
    };
  } catch (error) {
    console.error(`  실패: ${error.message}`);
    return {
      success: false,
      inputPath,
      error: error.message,
    };
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log("=".repeat(60));
  console.log("FBX → GLB 변환 스크립트");
  console.log("=".repeat(60));

  // CLI 옵션 파싱
  const args = process.argv.slice(2);
  const skipOptimize = args.includes("--skip-optimize");
  const skipDraco = args.includes("--skip-draco");
  const specificFile = args.find((arg) => !arg.startsWith("--"));

  if (skipOptimize) {
    console.log("옵션: 최적화 건너뛰기");
  }
  if (skipDraco) {
    console.log("옵션: Draco 압축 건너뛰기");
  }

  // 변환할 파일 목록
  const filesToConvert = specificFile
    ? FBX_FILES.filter((f) => f.includes(specificFile))
    : FBX_FILES;

  if (filesToConvert.length === 0) {
    console.error("변환할 파일을 찾을 수 없습니다.");
    process.exit(1);
  }

  console.log(`\n총 ${filesToConvert.length}개 파일 변환 예정`);

  const results = [];
  for (const file of filesToConvert) {
    const result = await convertFile(file, { skipOptimize, skipDraco });
    results.push(result);
  }

  // 결과 요약
  console.log("\n" + "=".repeat(60));
  console.log("변환 결과 요약");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`성공: ${successful.length}개`);
  console.log(`실패: ${failed.length}개`);

  if (successful.length > 0) {
    const totalInput = successful.reduce((sum, r) => sum + r.inputSize, 0);
    const totalOutput = successful.reduce((sum, r) => sum + r.outputSize, 0);
    console.log(
      `\n총 크기: ${(totalInput / 1024 / 1024).toFixed(2)}MB → ${(totalOutput / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `압축률: ${((1 - totalOutput / totalInput) * 100).toFixed(1)}% 감소`
    );
  }

  if (failed.length > 0) {
    console.log("\n실패한 파일:");
    failed.forEach((r) => {
      console.log(`  - ${r.inputPath}: ${r.error}`);
    });
    // 일부 실패해도 성공한 파일이 있으면 exit 0
    if (successful.length === 0) {
      process.exit(1);
    }
  }

  console.log("\n변환 완료!");
}

main().catch((error) => {
  console.error("스크립트 실행 실패:", error);
  process.exit(1);
});
