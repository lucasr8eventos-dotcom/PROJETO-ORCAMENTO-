import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Orcamento, Cliente } from './types';
import { ConfigEmpresa } from './components/Configuracoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmtVal = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtData = (s: string) =>
  format(new Date(s + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR });

const defaultConfig: ConfigEmpresa = {
  nome: 'Empresa', razaoSocial: '', cnpj: '', ie: '',
  email: '', telefone: '', endereco: '', logo: '',
};

export function gerarPDF(orc: Orcamento, config: ConfigEmpresa = defaultConfig, cliente?: Cliente): string | undefined {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 13;
  const pageH = 297;

  const C = {
    dark:  [30,  30,  30]  as [number,number,number],
    mid:   [80,  80,  80]  as [number,number,number],
    gray:  [130, 130, 130] as [number,number,number],
    line:  [200, 200, 200] as [number,number,number],
  };

  const hLine = (y: number) => {
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
  };

  let y = 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.text(fmtData(orc.criadoEm), M, y);

  const numStr = orc.numero.replace('ORÇ-', '');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...C.dark);
  const numW = doc.getTextWidth(numStr);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C.mid);
  const labelW = doc.getTextWidth('Orçamento ');
  doc.text('Orçamento ', W - M - numW - labelW, y + 0.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...C.dark);
  doc.text(numStr, W - M, y, { align: 'right' });

  y += 4;
  hLine(y);
  y += 5;

  const headerTop = y;
  let companyX = M;
  const logoSize = 22;

  if (config.logo) {
    try {
      const fmt = config.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(config.logo, fmt, M, y, logoSize, logoSize);
      companyX = M + logoSize + 4;
    } catch (_) { /* logo inválida — ignora */ }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...C.dark);
  doc.text(config.nome || 'Empresa', companyX, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.mid);
  let infoY = y + 11;
  const maxCompanyW = (W - M) * 0.58;

  if (config.endereco) {
    const addrLines = doc.splitTextToSize(config.endereco, maxCompanyW) as string[];
    addrLines.slice(0, 2).forEach((l, i) => doc.text(l, companyX, infoY + i * 4.5));
    infoY += Math.min(addrLines.length, 2) * 4.5;
  }

  if (config.razaoSocial) {
    doc.text(config.razaoSocial, companyX, infoY);
    infoY += 4.5;
  }

  const cnpjLine = [
    config.cnpj ? `CNPJ: ${config.cnpj}` : '',
    config.ie   ? `IE: ${config.ie}`      : '',
  ].filter(Boolean).join('   ');
  if (cnpjLine) {
    doc.text(cnpjLine, companyX, infoY);
    infoY += 4.5;
  }

  if (config.telefone) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...C.dark);
    doc.text(config.telefone, W - M, y + 7, { align: 'right' });
  }
  if (config.email) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.mid);
    doc.text(config.email, W - M, y + 15, { align: 'right' });
  }

  const headerH = Math.max(logoSize + 4, infoY - headerTop + 3);
  y = headerTop + headerH;
  hLine(y);
  y += 5;

  const clientTop = y;
  const validColW = 46;
  const sepX = W - M - validColW;

  const clientName = orc.clienteNome?.trim() || 'CONSUMIDOR';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.dark);
  doc.text(clientName, M, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.mid);

  const clientLines: string[] = [];
  if (orc.contato && orc.contato !== clientName) clientLines.push(orc.contato);
  if (cliente?.empresa)  clientLines.push(cliente.empresa);
  if (cliente?.cnpj)     clientLines.push(cliente.cnpj);
  if (cliente?.email)    clientLines.push(cliente.email);
  if (cliente?.telefone) clientLines.push(cliente.telefone);
  if (cliente?.endereco) clientLines.push(cliente.endereco);

  clientLines.forEach((l, i) => doc.text(l, M, y + 13 + i * 5));

  const clientH = Math.max(24, 18 + clientLines.length * 5);

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.line(sepX, clientTop, sepX, clientTop + clientH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.dark);
  doc.text('Validade da proposta', sepX + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.mid);
  doc.text(fmtData(orc.validade), sepX + 4, y + 13);

  y += clientH;
  hLine(y);
  y += 6;

  if (orc.observacoes?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.mid);
    const lines = doc.splitTextToSize(orc.observacoes.trim(), W - M * 2) as string[];
    lines.slice(0, 6).forEach((l, i) => doc.text(l, M, y + i * 4.8));
    y += Math.min(lines.length, 6) * 4.8 + 4;
  } else {
    y += 2;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Qt.', 'Produto/Serviço', 'Detalhe do item', 'Valor unitário', 'Subtotal']],
    body: orc.itens.map(it => [
      String(it.quantidade),
      it.descricao,
      it.periodo || '',
      fmtVal(it.valorUnitario),
      fmtVal(it.quantidade * it.valorUnitario),
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: [40, 40, 40],
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 13, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42 },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  });

  y = (doc as any).lastAutoTable?.finalY ?? y;

  const totX = W - M - 62;

  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(totX, y, W - M, y);
  y += 6;

  if (orc.desconto > 0 || orc.impostos > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.gray);
    doc.text('Subtotal', totX + 4, y);
    doc.setTextColor(...C.mid);
    doc.text(fmtVal(orc.subtotal), W - M, y, { align: 'right' });
    y += 5.5;

    if (orc.desconto > 0) {
      doc.setTextColor(...C.gray);
      doc.text(`Desconto (${orc.desconto}%)`, totX + 4, y);
      doc.setTextColor(...C.mid);
      doc.text(`- ${fmtVal(orc.subtotal * orc.desconto / 100)}`, W - M, y, { align: 'right' });
      y += 5.5;
    }
    if (orc.impostos > 0) {
      doc.setTextColor(...C.gray);
      doc.text(`Impostos (${orc.impostos}%)`, totX + 4, y);
      doc.setTextColor(...C.mid);
      const base = orc.subtotal * (1 - orc.desconto / 100);
      doc.text(`+ ${fmtVal(base * orc.impostos / 100)}`, W - M, y, { align: 'right' });
      y += 5.5;
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.text('Total', totX + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.dark);
  doc.text(fmtVal(orc.total), W - M, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.dark);
  doc.text('Valor líquido', totX + 4, y);
  doc.text(fmtVal(orc.total), W - M, y, { align: 'right' });
  y += 5;

  hLine(y);

  hLine(pageH - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text('Página 1 de 1', W - M, pageH - 7, { align: 'right' });

  doc.save(`${orc.numero}.pdf`);
  return doc.output('datauristring').split(',')[1];
}
