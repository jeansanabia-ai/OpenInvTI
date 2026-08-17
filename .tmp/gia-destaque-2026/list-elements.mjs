import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const deck = await PresentationFile.importPptx(
  await FileBlob.load("C:/OpenInvTI/.tmp/gia-destaque-2026/template-starter.pptx"),
);

for (const [slideIndex, slide] of deck.slides.items.entries()) {
  console.log(`SLIDE ${slideIndex + 1} id=${slide.id}`);
  for (const [elementIndex, element] of slide.elements.items.entries()) {
    let text = "";
    if (element.type === "shape") {
      try {
        text = element.text?.toString?.() ?? String(element.text ?? "");
      } catch {}
    }
    console.log(JSON.stringify({ elementIndex, type: element.type, id: element.id, name: element.name, text }));
  }
}
