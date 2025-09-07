import imageCompression from "browser-image-compression";

export async function compressToWebp(file: File, maxW = 1600) {
  const out = await imageCompression(file, {
    maxWidthOrHeight: maxW,
    maxSizeMB: 2,
    initialQuality: 0.8,
    fileType: "image/webp",
    useWebWorker: true,
  });
  const { width, height } = await getDims(out);
  return { blob: out, width, height, type: out.type };
}

function getDims(blob: Blob): Promise<{width:number;height:number}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }); };
    img.onerror = reject;
    img.src = url;
  });
}
