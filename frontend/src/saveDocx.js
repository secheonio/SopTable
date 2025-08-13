import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';

export async function saveCurriculumAsDocx(title, htmlContent) {
  // htmlContent: curriculum-pdf-area의 innerText 또는 innerHTML
  // 간단하게 텍스트만 docx로 저장
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: title, heading: "Heading1" }),
          new Paragraph("")
        ].concat(
          htmlContent
            .split("\n")
            .map((line) => new Paragraph(line.trim()))
        ),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
}
