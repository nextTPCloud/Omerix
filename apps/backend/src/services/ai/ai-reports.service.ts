/**
 * Servicio de IA para generación de informes
 *
 * Interpreta comandos de voz/texto natural para generar definiciones de informes
 * Ejemplo: "Muéstrame los clientes que más han comprado este año"
 */

import { AIService } from './ai.service';
import { AIMessage } from './ai.types';
import {
  ModuloInforme,
  TipoInforme,
  TipoCampo,
  TipoAgregacion,
  OperadorFiltro,
  TipoGraficoInforme,
  CATALOGO_COLECCIONES,
  IInforme,
} from '../../modules/informes/Informe';

// ============================================
// INTERFACES
// ============================================

export interface ComandoInformeParseado {
  modulo: ModuloInforme;
  coleccion: string;
  campos: Array<{
    campo: string;
    etiqueta: string;
    tipo: TipoCampo;
    agregacion: TipoAgregacion;
  }>;
  filtros: Array<{
    campo: string;
    operador: OperadorFiltro;
    valor: any;
    valor2?: any;
  }>;
  agrupaciones: Array<{
    campo: string;
    orden: 'asc' | 'desc';
  }>;
  ordenamiento: Array<{
    campo: string;
    direccion: 'asc' | 'desc';
  }>;
  tipoVisualizacion: TipoInforme;
  tipoGrafico?: TipoGraficoInforme;
  limite?: number;
  titulo: string;
  descripcion: string;
  confianza: 'alta' | 'media' | 'baja';
}

export interface ResultadoGeneracionInforme {
  exito: boolean;
  definicion?: Partial<IInforme>;
  mensaje?: string;
  sugerencias?: string[];
}

// ============================================
// PROMPTS
// ============================================

const PROMPT_SISTEMA = `Eres un asistente especializado en interpretar solicitudes de informes empresariales en español.
Tu tarea es analizar comandos en lenguaje natural y extraer la información necesaria para generar un informe.

MÓDULOS DISPONIBLES:
- ventas: Facturas, pedidos, presupuestos, albaranes de venta
- compras: Facturas, pedidos, presupuestos, albaranes de compra
- stock: Productos, inventario, movimientos de stock
- tesoreria: Movimientos de caja, vencimientos, cobros y pagos
- personal: Empleados, fichajes, partes de trabajo
- clientes: Datos de clientes, histórico
- proveedores: Datos de proveedores, histórico
- proyectos: Proyectos y tareas

COLECCIONES POR MÓDULO:
- ventas: facturas, pedidos, presupuestos, albaranes
- compras: facturas_compra, pedidos_compra, presupuestos_compra, albaranes_compra
- stock: productos, movimientos_stock
- tesoreria: movimientos_tesoreria, vencimientos
- personal: personal, fichajes, partes_trabajo
- clientes: clientes
- proveedores: proveedores
- proyectos: proyectos

CAMPOS COMUNES:
- fecha, numero, total, baseImponible, totalIva (documentos)
- clienteNombre, clienteId (ventas)
- proveedorNombre, proveedorId (compras)
- estado, activo (general)
- sku, nombre, stockActual, precioVenta, precioCoste (productos)
- empleadoNombre, horas, coste (personal/partes)

OPERADORES DE FILTRO:
- igual, diferente, contiene, comienza, termina
- mayor, mayor_igual, menor, menor_igual, entre
- en, no_en, existe, no_existe

AGREGACIONES:
- suma: Sumar valores
- promedio: Calcular media
- conteo: Contar registros
- min, max: Valores extremos
- ninguna: Sin agregación

TIPOS DE GRÁFICO:
- linea: Tendencias temporales
- barra: Comparaciones
- barra_horizontal: Rankings
- circular: Distribuciones
- area: Acumulados

FECHAS RELATIVAS (calcular desde hoy):
- "hoy" = fecha actual
- "este mes" = desde el 1 del mes actual hasta hoy
- "último mes" = mes anterior completo
- "este año" = desde 1 de enero hasta hoy
- "último año" = año anterior completo
- "este trimestre" = desde inicio del trimestre actual
- "últimos 30 días" = desde hace 30 días hasta hoy

IMPORTANTE:
- Siempre responde en formato JSON válido
- Infiere el módulo y colección correctos según el contexto
- Para rankings usa agregaciones y ordenamiento descendente
- Para tendencias temporales agrupa por fecha
- Detecta períodos de tiempo y conviértelos a filtros de fecha`;

const PROMPT_TEMPLATE = `Analiza el siguiente comando de informe y extrae la información:

COMANDO: "{comando}"

FECHA ACTUAL: {fechaActual}

Responde SOLO con un JSON válido con esta estructura:
{
  "modulo": "ventas|compras|stock|tesoreria|personal|clientes|proveedores|proyectos",
  "coleccion": "nombre de la colección principal",
  "titulo": "Título descriptivo del informe",
  "descripcion": "Breve descripción de qué muestra el informe",
  "campos": [
    {
      "campo": "nombre del campo en la BD",
      "etiqueta": "Nombre para mostrar",
      "tipo": "texto|numero|moneda|fecha|porcentaje",
      "agregacion": "ninguna|suma|promedio|conteo|min|max"
    }
  ],
  "filtros": [
    {
      "campo": "nombre del campo",
      "operador": "igual|diferente|contiene|mayor|menor|entre|...",
      "valor": "valor a filtrar",
      "valor2": "segundo valor (solo para 'entre')"
    }
  ],
  "agrupaciones": [
    {
      "campo": "campo para agrupar",
      "orden": "asc|desc"
    }
  ],
  "ordenamiento": [
    {
      "campo": "campo para ordenar",
      "direccion": "asc|desc"
    }
  ],
  "tipoVisualizacion": "tabla|grafico|mixto",
  "tipoGrafico": "linea|barra|barra_horizontal|circular|area|null",
  "limite": null o número,
  "confianza": "alta|media|baja"
}

EJEMPLOS:

Comando: "Clientes que más han comprado este año"
{
  "modulo": "ventas",
  "coleccion": "facturas",
  "titulo": "Top Clientes por Facturación",
  "descripcion": "Ranking de clientes por volumen de compras en el año actual",
  "campos": [
    {"campo": "clienteNombre", "etiqueta": "Cliente", "tipo": "texto", "agregacion": "ninguna"},
    {"campo": "total", "etiqueta": "Total Facturado", "tipo": "moneda", "agregacion": "suma"},
    {"campo": "_id", "etiqueta": "Nº Facturas", "tipo": "numero", "agregacion": "conteo"}
  ],
  "filtros": [
    {"campo": "fecha", "operador": "mayor_igual", "valor": "2024-01-01"},
    {"campo": "estado", "operador": "en", "valor": ["emitida", "cobrada"]}
  ],
  "agrupaciones": [{"campo": "clienteNombre", "orden": "desc"}],
  "ordenamiento": [{"campo": "total", "direccion": "desc"}],
  "tipoVisualizacion": "mixto",
  "tipoGrafico": "barra_horizontal",
  "limite": 20,
  "confianza": "alta"
}

Comando: "Ventas del último mes"
{
  "modulo": "ventas",
  "coleccion": "facturas",
  "titulo": "Ventas del Mes Anterior",
  "descripcion": "Resumen de ventas agrupadas por día del mes anterior",
  "campos": [
    {"campo": "fecha", "etiqueta": "Fecha", "tipo": "fecha", "agregacion": "ninguna"},
    {"campo": "total", "etiqueta": "Total", "tipo": "moneda", "agregacion": "suma"}
  ],
  "filtros": [
    {"campo": "fecha", "operador": "entre", "valor": "2024-11-01", "valor2": "2024-11-30"}
  ],
  "agrupaciones": [{"campo": "fecha", "orden": "asc"}],
  "ordenamiento": [{"campo": "fecha", "direccion": "asc"}],
  "tipoVisualizacion": "mixto",
  "tipoGrafico": "linea",
  "limite": null,
  "confianza": "alta"
}`;

// ============================================
// SERVICIO
// ============================================

export class AIReportsService {
  private aiService: AIService;

  constructor(providerName?: 'gemini' | 'claude', apiKey?: string, model?: string) {
    this.aiService = new AIService(providerName, apiKey, model);
  }

  /**
   * Parsear comando de voz/texto a definición de informe
   */
  async parsearComando(comando: string): Promise<ComandoInformeParseado> {
    const fechaActual = new Date().toISOString().split('T')[0];

    const prompt = PROMPT_TEMPLATE
      .replace('{comando}', comando)
      .replace('{fechaActual}', fechaActual);

    const messages: AIMessage[] = [
      { role: 'system', content: PROMPT_SISTEMA },
      { role: 'user', content: prompt },
    ];

    const response = await this.aiService.complete(messages, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Extraer JSON de la respuesta
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo interpretar el comando. Por favor, reformula tu solicitud.');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as ComandoInformeParseado;

      // Validar módulo
      if (!Object.values(ModuloInforme).includes(parsed.modulo as ModuloInforme)) {
        throw new Error(`Módulo no válido: ${parsed.modulo}`);
      }

      // Convertir fechas relativas a absolutas
      this.convertirFechasRelativas(parsed);

      return parsed;
    } catch (error: any) {
      throw new Error(`Error al procesar la respuesta: ${error.message}`);
    }
  }

  /**
   * Convertir fechas relativas a fechas absolutas
   */
  private convertirFechasRelativas(parsed: ComandoInformeParseado): void {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    for (const filtro of parsed.filtros) {
      if (filtro.campo.toLowerCase().includes('fecha')) {
        // Convertir valores de fecha string a Date si es necesario
        if (typeof filtro.valor === 'string' && !filtro.valor.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Es una fecha relativa
          const valorLower = filtro.valor.toLowerCase();

          if (valorLower === 'hoy') {
            filtro.valor = hoy.toISOString().split('T')[0];
          } else if (valorLower.includes('este año') || valorLower.includes('año actual')) {
            filtro.valor = `${anioActual}-01-01`;
            filtro.valor2 = hoy.toISOString().split('T')[0];
            filtro.operador = OperadorFiltro.ENTRE;
          } else if (valorLower.includes('último año') || valorLower.includes('año pasado')) {
            filtro.valor = `${anioActual - 1}-01-01`;
            filtro.valor2 = `${anioActual - 1}-12-31`;
            filtro.operador = OperadorFiltro.ENTRE;
          } else if (valorLower.includes('este mes') || valorLower.includes('mes actual')) {
            const primerDiaMes = new Date(anioActual, mesActual, 1);
            filtro.valor = primerDiaMes.toISOString().split('T')[0];
            filtro.valor2 = hoy.toISOString().split('T')[0];
            filtro.operador = OperadorFiltro.ENTRE;
          } else if (valorLower.includes('último mes') || valorLower.includes('mes pasado')) {
            const primerDiaMesAnterior = new Date(anioActual, mesActual - 1, 1);
            const ultimoDiaMesAnterior = new Date(anioActual, mesActual, 0);
            filtro.valor = primerDiaMesAnterior.toISOString().split('T')[0];
            filtro.valor2 = ultimoDiaMesAnterior.toISOString().split('T')[0];
            filtro.operador = OperadorFiltro.ENTRE;
          }
        }
      }
    }
  }

  /**
   * Generar definición completa de informe desde comando
   */
  async generarDefinicionInforme(comando: string): Promise<ResultadoGeneracionInforme> {
    try {
      const parsed = await this.parsearComando(comando);

      // Convertir a definición de IInforme
      const definicion: Partial<IInforme> = {
        nombre: parsed.titulo,
        descripcion: parsed.descripcion,
        modulo: parsed.modulo as ModuloInforme,
        tipo: parsed.tipoVisualizacion as TipoInforme,
        fuente: {
          coleccion: parsed.coleccion,
        },
        campos: parsed.campos.map((c, i) => ({
          campo: c.campo,
          etiqueta: c.etiqueta,
          tipo: c.tipo as TipoCampo,
          visible: true,
          agregacion: c.agregacion as TipoAgregacion,
          orden: i,
        })),
        filtros: parsed.filtros.map(f => ({
          campo: f.campo,
          operador: f.operador as OperadorFiltro,
          valor: f.valor,
          valor2: f.valor2,
        })),
        parametros: this.generarParametrosDinamicos(parsed),
        agrupaciones: parsed.agrupaciones.map(a => ({
          campo: a.campo,
          orden: a.orden,
        })),
        ordenamiento: parsed.ordenamiento.map(o => ({
          campo: o.campo,
          direccion: o.direccion,
        })),
        config: {
          limite: parsed.limite,
          paginacion: true,
          mostrarTotales: true,
          exportable: true,
          formatos: ['pdf', 'excel', 'csv'],
        },
        esPlantilla: false,
        compartido: false,
        favorito: false,
      };

      // Añadir configuración de gráfico si aplica
      if (parsed.tipoVisualizacion !== 'tabla' && parsed.tipoGrafico) {
        const ejeX = parsed.agrupaciones[0]?.campo || parsed.campos[0]?.campo;
        const ejeY = parsed.campos
          .filter(c => c.agregacion !== 'ninguna' && c.tipo !== 'texto' && c.tipo !== 'fecha')
          .map(c => c.campo);

        if (ejeX && ejeY.length > 0) {
          definicion.grafico = {
            tipo: parsed.tipoGrafico as TipoGraficoInforme,
            ejeX,
            ejeY,
            mostrarLeyenda: true,
            mostrarEtiquetas: parsed.tipoGrafico === 'circular',
          };
        }
      }

      return {
        exito: true,
        definicion,
        mensaje: `Informe generado con confianza ${parsed.confianza}`,
      };
    } catch (error: any) {
      return {
        exito: false,
        mensaje: error.message,
        sugerencias: [
          'Intenta ser más específico con el período de tiempo',
          'Indica claramente qué datos quieres ver (ventas, compras, stock...)',
          'Especifica cómo quieres agrupar los datos (por cliente, por fecha...)',
        ],
      };
    }
  }

  /**
   * Generar parámetros dinámicos basados en filtros de fecha
   */
  private generarParametrosDinamicos(parsed: ComandoInformeParseado): any[] {
    const parametros: any[] = [];
    let tieneFiltroFecha = false;

    for (const filtro of parsed.filtros) {
      if (filtro.campo.toLowerCase().includes('fecha')) {
        tieneFiltroFecha = true;
        break;
      }
    }

    // Siempre añadir parámetros de fecha para que el usuario pueda modificarlos
    if (tieneFiltroFecha || parsed.modulo !== ModuloInforme.STOCK) {
      parametros.push(
        {
          nombre: 'fechaDesde',
          etiqueta: 'Fecha Desde',
          tipo: 'fecha',
          requerido: false,
        },
        {
          nombre: 'fechaHasta',
          etiqueta: 'Fecha Hasta',
          tipo: 'fecha',
          requerido: false,
        }
      );
    }

    return parametros;
  }

  /**
   * Obtener sugerencias de comandos según el módulo
   */
  getSugerenciasComandos(modulo?: ModuloInforme): string[] {
    const sugerenciasBase = [
      'Clientes que más han comprado este año',
      'Ventas por mes del último año',
      'Productos más vendidos',
      'Stock valorado por almacén',
      'Facturas pendientes de cobro',
      'Horas trabajadas por empleado este mes',
      'Comparativa de ventas mensual',
      'Proveedores con más compras',
    ];

    const sugerenciasPorModulo: Record<ModuloInforme, string[]> = {
      [ModuloInforme.VENTAS]: [
        'Ventas del último mes',
        'Top 10 clientes por facturación',
        'Ventas por familia de productos',
        'Presupuestos pendientes de aceptar',
        'Albaranes sin facturar',
        'Comparativa ventas este año vs anterior',
      ],
      [ModuloInforme.COMPRAS]: [
        'Compras del último trimestre',
        'Top proveedores por volumen',
        'Pedidos pendientes de recibir',
        'Histórico de precios por producto',
      ],
      [ModuloInforme.STOCK]: [
        'Productos con stock bajo mínimo',
        'Stock valorado por categoría',
        'Rotación de inventario',
        'Movimientos de stock del mes',
      ],
      [ModuloInforme.TESORERIA]: [
        'Flujo de caja mensual',
        'Cobros pendientes por antigüedad',
        'Pagos pendientes esta semana',
        'Clientes morosos',
      ],
      [ModuloInforme.PERSONAL]: [
        'Horas trabajadas por proyecto',
        'Fichajes del mes actual',
        'Coste de personal por departamento',
        'Partes de trabajo pendientes',
      ],
      [ModuloInforme.CLIENTES]: [
        'Clientes nuevos este año',
        'Clientes inactivos (sin compras en 6 meses)',
        'Análisis ABC de clientes',
        'Histórico por cliente',
      ],
      [ModuloInforme.PROVEEDORES]: [
        'Evaluación de proveedores',
        'Dependencia por proveedor',
        'Histórico de compras por proveedor',
      ],
      [ModuloInforme.PROYECTOS]: [
        'Proyectos en curso',
        'Rentabilidad por proyecto',
        'Horas estimadas vs reales',
      ],
      [ModuloInforme.GENERAL]: [
        'Actividad del sistema',
        'Usuarios más activos',
      ],
    };

    if (modulo && sugerenciasPorModulo[modulo]) {
      return sugerenciasPorModulo[modulo];
    }

    return sugerenciasBase;
  }
}

export const aiReportsService = new AIReportsService();
export default aiReportsService;
