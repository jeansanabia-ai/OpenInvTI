import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const starterPath = "C:/OpenInvTI/.tmp/gia-destaque-2026/template-starter.pptx";
const finalPath = "C:/OpenInvTI/GIA Ferroport - Programa Destaque 2026.pptx";
const previewDir = "C:/OpenInvTI/.tmp/gia-destaque-2026/final-preview";
const layoutDir = "C:/OpenInvTI/.tmp/gia-destaque-2026/final-layout/final";

const presentation = await PresentationFile.importPptx(await FileBlob.load(starterPath));

const readBytes = async (filePath) => {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

const headerText = (shape) => {
  shape.text.set([
    [{ run: "Projetos de Melhoria Contínua 2026", textStyle: { typeface: "Aptos Black", fontSize: "24pt", color: "#00AFD7", bold: true } }],
    [{ run: "GIA – Gestão Inteligente de Ativos", textStyle: { typeface: "Aptos", fontSize: "23pt", color: "#78BE20", bold: true, italic: true } }],
  ]);
};

const bulletParagraph = (runs) => ({
  bulletCharacter: "•",
  marginLeft: 28,
  indent: -16,
  spaceAfter: 9,
  runs,
});

const addScreenshot = async ({ slide, placeholder, path, contentType, alt, position, fit = "contain" }) => {
  placeholder.delete();
  slide.images.add({
    blob: await readBytes(path),
    contentType,
    alt,
    fit,
    geometry: "roundRect",
    borderRadius: "rounded-xl",
    position,
  });
};

const shapeById = (slide, id) => {
  const shape = slide.elements.items.find((element) => element.type === "shape" && element.id === id);
  if (!shape) throw new Error(`Shape ${id} não encontrado no slide ${slide.id}`);
  return shape;
};

const slideItems = presentation.slides.items;
const slides = {
  cover: slideItems[0],
  overview: slideItems[1],
  progress: slideItems[2],
  comparison: slideItems[3],
  demo: slideItems[4],
  close: slideItems[5],
};

// Slide 1 — capa
headerText(shapeById(slides.cover, "15"));
slides.cover.speakerNotes.textFrame.setText([
  "Apresente o GIA como evolução do protótipo OpenInvTI para a realidade da Ferroport.",
  "[Sources]",
  "- Modelo visual: Apresentação Programa Destaque 2026.pptx, fornecido pelo usuário.",
  "- Conteúdo do projeto: repositório local OpenInvTI e requisitos fornecidos pelo usuário.",
]);

// Slide 2 — ficha do projeto
headerText(shapeById(slides.overview, "14"));
const overviewBody = shapeById(slides.overview, "11");
overviewBody.text.set([
  bulletParagraph([
    { run: "Área: ", textStyle: { typeface: "Aptos", fontSize: "20pt", color: "#00AFD7", bold: true } },
    { run: "Infraestrutura TSI", textStyle: { typeface: "Aptos", fontSize: "18pt", color: "#202124" } },
  ]),
  bulletParagraph([
    { run: "Categoria inscrita: ", textStyle: { typeface: "Aptos", fontSize: "20pt", color: "#78BE20", bold: true } },
    { run: "Melhoria contínua e inovação", textStyle: { typeface: "Aptos", fontSize: "18pt", color: "#202124" } },
  ]),
  bulletParagraph([
    { run: "Participante: ", textStyle: { typeface: "Aptos", fontSize: "20pt", color: "#00AFD7", bold: true } },
    { run: "Jean Sanabia", textStyle: { typeface: "Aptos", fontSize: "18pt", color: "#202124" } },
  ]),
  bulletParagraph([
    { run: "Implantação: ", textStyle: { typeface: "Aptos", fontSize: "20pt", color: "#78BE20", bold: true } },
    { run: "protótipo em 2026 · piloto corporativo em planejamento", textStyle: { typeface: "Aptos", fontSize: "18pt", color: "#202124" } },
  ]),
  bulletParagraph([
    { run: "Objetivo: ", textStyle: { typeface: "Aptos", fontSize: "20pt", color: "#00AFD7", bold: true } },
    { run: "eliminar planilhas e centralizar a gestão de ativos em um único WebApp, com identificação inteligente, prevenção de duplicidades e rastreabilidade.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } },
  ]),
]);
slides.overview.speakerNotes.textFrame.setText([
  "Reforce que o primeiro uso será no inventário de TI, com possibilidade de expansão para outras categorias de ativos.",
  "[Sources]",
  "- Objetivo e escopo informados pelo usuário nesta conversa.",
  "- Funcionalidades verificadas no repositório local OpenInvTI.",
]);

// Slide 3 — ações e resultados
headerText(shapeById(slides.progress, "19"));
shapeById(slides.progress, "15").text = "Ações realizadas";
shapeById(slides.progress, "18").text = "Resultados alcançados";

const actions = shapeById(slides.progress, "16");
actions.text.set([
  bulletParagraph([{ run: "Desenvolvimento e validação do protótipo funcional OpenInvTI.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
  bulletParagraph([{ run: "Levantamento dos requisitos e análise da base atual de inventário.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
  bulletParagraph([{ run: "Definição do GIA, da identidade visual e dos fluxos de cadastro e atualização.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
  bulletParagraph([{ run: "Planejamento da base centralizada, dos acessos e da implantação corporativa.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
]);

const results = shapeById(slides.progress, "11");
results.text.set([
  bulletParagraph([{ run: "WebApp móvel funcional com câmera, OCR e leitura de códigos.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
  bulletParagraph([{ run: "Protótipo construído com tecnologias gratuitas e recursos existentes.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
  bulletParagraph([{ run: "Processo preparado para reduzir duplicidades e padronizar os registros.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
  bulletParagraph([{ run: "Base tecnológica pronta para evoluir de TI para outras áreas da empresa.", textStyle: { typeface: "Aptos", fontSize: "17pt", color: "#202124" } }]),
]);
slides.progress.speakerNotes.textFrame.setText([
  "Os resultados apresentados referem-se ao protótipo/piloto; a implantação corporativa depende das aprovações internas.",
  "[Sources]",
  "- Repositório local OpenInvTI.",
  "- Formulário e requisitos fornecidos pelo usuário nesta conversa.",
]);

// Slide 4 — antes e depois
headerText(shapeById(slides.comparison, "4"));
const comparisonTitle = shapeById(slides.comparison, "11");
comparisonTitle.text = "Evolução do processo";
comparisonTitle.position = { left: 390, top: 126, width: 500, height: 55 };
const comparisonBefore = shapeById(slides.comparison, "5");
comparisonBefore.text = "Planilhas descentralizadas";
comparisonBefore.position = { left: 80, top: 205, width: 450, height: 47 };
const comparisonAfter = shapeById(slides.comparison, "6");
comparisonAfter.text = "Gestão em um único WebApp";
comparisonAfter.position = { left: 750, top: 205, width: 450, height: 47 };
await addScreenshot({
  slide: slides.comparison,
  placeholder: shapeById(slides.comparison, "15"),
  path: "C:/OpenInvTI/.tmp/gia-destaque-2026/planilha-antes.png",
  contentType: "image/png",
  alt: "Resumo da planilha utilizada no processo anterior",
  position: { left: 58, top: 305, width: 545, height: 280 },
  fit: "contain",
});
await addScreenshot({
  slide: slides.comparison,
  placeholder: shapeById(slides.comparison, "16"),
  path: "C:/OpenInvTI/LinkedIn/Tela_inicial_2.jpeg",
  contentType: "image/jpeg",
  alt: "Tela inicial do protótipo OpenInvTI em dispositivo móvel",
  position: { left: 835, top: 258, width: 265, height: 410 },
  fit: "contain",
});
slides.comparison.speakerNotes.textFrame.setText([
  "Mostre a mudança de uma base manual e fragmentada para uma experiência móvel e centralizada.",
  "[Sources]",
  "- Planilha de Inventário 2025.xlsx, fornecida pelo usuário; visualização resumida sem dados pessoais.",
  "- Tela_inicial_2.jpeg, fornecida pelo usuário.",
]);

// Slide 5 — demonstração
headerText(shapeById(slides.demo, "4"));
const demoTitle = shapeById(slides.demo, "11");
demoTitle.text = "Demonstração do aplicativo";
demoTitle.position = { left: 390, top: 126, width: 500, height: 55 };
const demoCapture = shapeById(slides.demo, "5");
demoCapture.text = "Captura inteligente";
demoCapture.position = { left: 80, top: 205, width: 450, height: 47 };
const demoForm = shapeById(slides.demo, "6");
demoForm.text = "Registro guiado";
demoForm.position = { left: 750, top: 205, width: 450, height: 47 };
await addScreenshot({
  slide: slides.demo,
  placeholder: shapeById(slides.demo, "15"),
  path: "C:/OpenInvTI/.tmp/gia-destaque-2026/video-frames/frame-captura.png",
  contentType: "image/png",
  alt: "Quadro do vídeo mostrando a câmera para captura da etiqueta",
  position: { left: 170, top: 258, width: 245, height: 410 },
  fit: "contain",
});
await addScreenshot({
  slide: slides.demo,
  placeholder: shapeById(slides.demo, "16"),
  path: "C:/OpenInvTI/.tmp/gia-destaque-2026/video-frames/frame-resultado.png",
  contentType: "image/png",
  alt: "Quadro do vídeo mostrando o formulário guiado do equipamento",
  position: { left: 855, top: 258, width: 245, height: 410 },
  fit: "contain",
});
slides.demo.speakerNotes.textFrame.setText([
  "Use o vídeo original para uma demonstração completa de 23 segundos, se houver tempo.",
  "[Sources]",
  "- Video_app.mp4, fornecido pelo usuário; quadros extraídos em aproximadamente 28% e 72% da duração.",
]);

// Slide 6 — encerramento institucional preservado
slides.close.speakerNotes.textFrame.setText([
  "Encerre reforçando o potencial de expansão do GIA para outras categorias de ativos e áreas da Ferroport.",
  "[Sources]",
  "- Encerramento institucional preservado do modelo Apresentação Programa Destaque 2026.pptx.",
]);

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (const [index, slide] of presentation.slides.items.entries()) {
  const padded = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(`${previewDir}/slide-${padded}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${layoutDir}/slide-${padded}.layout.json`, await layout.text(), "utf8");
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile("C:/OpenInvTI/.tmp/gia-destaque-2026/final-montage.webp", new Uint8Array(await montage.arrayBuffer()));

const finalInspect = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  maxChars: 100000,
});
await fs.writeFile("C:/OpenInvTI/.tmp/gia-destaque-2026/final-inspect.ndjson", finalInspect.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(finalPath);
console.log(finalPath);
