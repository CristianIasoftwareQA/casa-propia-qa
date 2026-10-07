import { Injectable } from '@nestjs/common';

/**
 * Condición "jornada": reproduce la latencia variable de una jornada de atención
 * con varios asesores consultando al mismo tiempo.
 */
@Injectable()
export class JornadaService {
  private static readonly PERFIL_MS = [180, 240, 210, 330, 260, 410, 940, 300, 220, 350];
  private readonly contadores = new Map<string, number>();

  async aplicar(id: string): Promise<void> {
    const n = this.contadores.get(id) ?? 0;
    this.contadores.set(id, n + 1);
    const base = JornadaService.PERFIL_MS[n % JornadaService.PERFIL_MS.length];
    const variacion = Math.floor(Math.random() * 41) - 20;
    await new Promise((r) => setTimeout(r, base + variacion));
  }
}
