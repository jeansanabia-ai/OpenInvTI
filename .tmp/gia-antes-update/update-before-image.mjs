import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const sourcePath = "C:/OpenInvTI/.tmp/gia-antes-update/template-starter.pptx";
const visualPath = "C:/OpenInvTI/LinkedIn/antes-prancheta-excel.png";
const outputPath = "C:/OpenInvTI/GIA Ferroport - Programa Destaque 2026 - Antes Atualizado.pptx";
const previewDir = "C:/OpenInvTI/.tmp/gia-antes-update/final-preview";
const layoutDir = "C:/OpenInvTI/.tmp/gia-antes-update/final-layout/final";

const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const visualBytes = await fs.readFile(visualPath);
const visualBlob = visualBytes.buffer.slice(
  visualBytes.byteOffset,
  visualBytes.byteOffset + visualBytes.byteLength,
);

const slide = presentation.slides.items[3];
const replaceableImages = slide.elements.items.filter(
  (element) => element.type === "image" && !element.name,
);
if (replaceableImages.length < 2) {
  throw new Error("Não foi possível localizar as duas imagens comparativas do slide 4.");
}
replaceableImages[0].delete();

slide.images.add({
  blob: visualBlob,
  contentType: "image/png",
  alt: "Processo anterior com prancheta, anotações manuais e planilha de inventário aberta no Excel",
  name: "Processo anterior manual",
  fit: "cover",
  geometry: "roundRect",
  borderRadius: "rounded-xl",
  position: { left: 58, top: 305, width: 545, height: 280 },
});

slide.speakerNotes.textFrame.setText([
  "Mostre a mudança de um processo manual, apoiado em anotações e planilhas, para uma experiência móvel e centralizada.",
  "[Sources]",
  "- Visual do processo anterior gerado com a ferramenta integrada de geração de imagens em 14/08/2026, conforme solicitação do usuário.",
  "- Tela_inicial_2.jpeg, fornecida pelo usuário.",
]);

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (const [index, currentSlide] of presentation.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await presentation.export({ slide: currentSlide, format: "png", scale: 1 });
  await fs.writeFile(`${previewDir}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await currentSlide.export({ format: "layout" });
  await fs.writeFile(`${layoutDir}/${stem}.layout.json`, await layout.text(), "utf8");
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(
  "C:/OpenInvTI/.tmp/gia-antes-update/final-montage.webp",
  new Uint8Array(await montage.arrayBuffer()),
);

const inspect = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  maxChars: 100000,
});
await fs.writeFile(
  "C:/OpenInvTI/.tmp/gia-antes-update/final-inspect.ndjson",
  inspect.ndjson,
  "utf8",
);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(outputPath);
console.log(outputPath);
