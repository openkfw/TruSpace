import PDFDocument from 'pdfkit';

import { IpfsClient } from '../../../shared/clients/ipfs-client';

export interface ChatsExportFile {
  contentType: string;
  filename: string;
  stream: NodeJS.ReadableStream;
}

export async function getChatsExportByDocumentId(documentId: string): Promise<ChatsExportFile> {
  const client = new IpfsClient();
  const document = await client.getDocumentDetailsById(documentId);
  const result = await client.getMessagesByDocumentId(documentId);

  const doc = new PDFDocument();
  doc.fontSize(25).text(`Chat Messages for document "${document?.meta?.filename}"`);
  doc.fontSize(15).text(`Document ID: ${documentId}`);
  doc.fontSize(15).text(`Creator: ${document?.meta?.creatorName || 'UNKNOWN'}`);
  const formattedDate = new Date().toLocaleString();
  doc.fontSize(15).text(`Created at: ${formattedDate}`).moveDown();
  doc.fontSize(15).text(' ');

  result.forEach((message) => {
    let messageText;
    try {
      messageText = JSON.parse(message.meta?.data).message;
    } catch (e) {
      console.error('Error parsing message data', e);
      messageText = message.meta?.data;
    }

    doc.fontSize(13).text(`Message: ${messageText}`);
    doc.fontSize(10).text(`Author: ${message.meta.creatorName || 'UNKNOWN'}`);
    const formattedDate = new Date(Number(message.meta.timestamp)).toLocaleString();
    doc.fontSize(10).text(`Timestamp: ${formattedDate}`);
    doc.moveDown();
  });

  doc.end();

  return {
    contentType: 'application/pdf',
    filename: `chat-export-${documentId}.pdf`,
    stream: doc,
  };
}
