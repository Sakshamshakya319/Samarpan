// Type declarations for qrcode library to prevent Vercel build errors
declare module 'qrcode' {
  interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    type?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    width?: number
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<void>
  export function toString(text: string, options?: QRCodeOptions): Promise<string>
}