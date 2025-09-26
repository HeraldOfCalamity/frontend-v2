export type WSMessage = any;

type Listener = (msg: WSMessage) => void;

export class CitasWS {
  private ws?: WebSocket;
  private url: string;
  private listener: Listener;
  private reconnectMs = 3000;
  private closedByClient = false;
  private heartbeat?: number; // setInterval id

  constructor(url: string, onMessage: Listener) {
    this.url = url;
    this.listener = onMessage;
  }

  connect() {
    this.closedByClient = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      // heartbeat cada 30s: evita timeouts intermedios en algunos entornos
      this.heartbeat = window.setInterval(() => this.ping(), 30_000);
      // console.log("[WS] open");
    };

    this.ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        this.listener(data);
      } catch {
        // si el backend envía texto plano, podrías manejarlo aquí
      }
    };

    // NO cerramos nosotros en onerror; solo log y dejamos que onclose gestione
    this.ws.onerror = (e) => {
      console.warn("[WS] error", e);
    };

    this.ws.onclose = (evt) => {
      console.warn("[WS] closed", { code: evt.code, reason: evt.reason });
      if (this.heartbeat) {
        clearInterval(this.heartbeat);
        this.heartbeat = undefined;
      }
      if (!this.closedByClient) {
        setTimeout(() => this.connect(), this.reconnectMs);
      }
    };
  }

  ping() {
    try { this.ws?.send("ping"); } catch {}
  }

  close() {
    this.closedByClient = true;
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
    try { this.ws?.close(); } catch {}
  }
}
