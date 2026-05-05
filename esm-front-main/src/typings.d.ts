/* Declarations for optional dependencies (install with: npm install) */
declare module 'jspdf' {
  export class jsPDF {
    constructor();
    addPage(): this;
    rect(x: number, y: number, width: number, height: number, style?: string): this;
    roundedRect(
      x: number,
      y: number,
      width: number,
      height: number,
      rx: number,
      ry: number,
      style?: string
    ): this;
    setDrawColor(ch1: number, ch2?: number, ch3?: number): this;
    setFillColor(ch1: number, ch2?: number, ch3?: number): this;
    setFontSize(size: number): this;
    setTextColor(ch1: number, ch2?: number, ch3?: number): this;
    text(text: string, x: number, y: number, options?: unknown): this;
    save(name: string): this;
  }
}

declare module 'jspdf-autotable' {
  export default function autoTable(doc: unknown, options: unknown): void;
}

declare module 'qrcode' {
  export function toDataURL(
    text: string,
    options?: { width?: number; margin?: number }
  ): Promise<string>;
}
