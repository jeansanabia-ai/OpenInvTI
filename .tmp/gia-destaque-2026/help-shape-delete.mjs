import { FileBlob, PresentationFile } from "@oai/artifact-tool";
const presentation = await PresentationFile.importPptx(await FileBlob.load("C:/OpenInvTI/.tmp/gia-destaque-2026/template-starter.pptx"));
console.log(presentation.help("*", {
  search: "slide.shapes.delete|shape.delete|slide.shapes.add|deleteAll",
  include: ["index", "examples", "notes"],
  maxChars: 12000,
}).ndjson);
