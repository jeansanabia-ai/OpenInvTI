import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const sourcePath = "C:/OpenInvTI/.tmp/gia-logo-update/template-starter.pptx";
const logoPath = "C:/OpenInvTI/.tmp/gia-logo-update/ferroport-logo-oficial-contraste.png";
const outputPath = "C:/OpenInvTI/GIA Ferroport - Programa Destaque 2026 - Logo Oficial.pptx";
const previewDir = "C:/OpenInvTI/.tmp/gia-logo-update/final-preview";
const layoutDir = "C:/OpenInvTI/.tmp/gia-logo-update/final-layout/final";

const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const logoBytes = await fs.readFile(logoPath);
const logoBlob = logoBytes.buffer.slice(
  logoBytes.byteOffset,
  logoBytes.byteOffset + logoBytes.byteLength,
);

const findImage = (slide, name) => {
  const image = slide.elements.items.find(
    (element) => element.type === "image" && element.name === name,
  );
  if (!image) throw new Error(`Imagem ${name} não encontrada no slide ${slide.id}`);
  return image;
};

const applyOfficialLogo = ({ slide, imageName, position }) => {
  findImage(slide, imageName).delete();
  slide.images.add({
    blob: logoBlob,
    contentType: "image/png",
    alt: "Logotipo oficial da Ferroport",
    name: "Logotipo oficial Ferroport",
    fit: "contain",
    geometry: "roundRect",
    borderRadius: "rounded-lg",
    position,
  });
};

const slides = presentation.slides.items;
applyOfficialLogo({
  slide: slides[0],
  imageName: "Gráfico 8",
  position: { left: 1080, top: 590, width: 190, height: 108 },
});
slides[0].speakerNotes.textFrame.setText([
  "Apresente o GIA como evolução do protótipo OpenInvTI para a realidade da Ferroport.",
  "[Sources]",
  "- Modelo visual: Apresentação Programa Destaque 2026.pptx, fornecido pelo usuário.",
  "- Conteúdo do projeto: repositório local OpenInvTI e requisitos fornecidos pelo usuário.",
  "- Logotipo oficial Ferroport: arquivo PNG fornecido pelo usuário em 14/08/2026.",
]);

applyOfficialLogo({
  slide: slides[5],
  imageName: "Gráfico 3",
  position: { left: 1007, top: 518, width: 246, height: 135 },
});
slides[5].speakerNotes.textFrame.setText([
  "Encerre reforçando o potencial de expansão do GIA para outras categorias de ativos e áreas da Ferroport.",
  "[Sources]",
  "- Encerramento institucional preservado do modelo Apresentação Programa Destaque 2026.pptx.",
  "- Logotipo oficial Ferroport: arquivo PNG fornecido pelo usuário em 14/08/2026.",
]);

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (const [index, slide] of slides.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(`${previewDir}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${layoutDir}/${stem}.layout.json`, await layout.text(), "utf8");
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(
  "C:/OpenInvTI/.tmp/gia-logo-update/final-montage.webp",
  new Uint8Array(await montage.arrayBuffer()),
);

const inspect = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  maxChars: 100000,
});
await fs.writeFile(
  "C:/OpenInvTI/.tmp/gia-logo-update/final-inspect.ndjson",
  inspect.ndjson,
  "utf8",
);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(outputPath);
console.log(outputPath);
