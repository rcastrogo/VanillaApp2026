import { $, buildAndInterpolate } from "../core/dom";
import ReportEngine from "../core/report-engine/engine";
import { DefaultMediator, type DefaultMediatorValue } from "../core/report-engine/mediator";
import type { DetailRenderContext, GroupFooterRenderContext, GroupHeaderRenderContext, HeaderRenderContext, ReportDefinition, ReportSection, TotalRenderContext } from "../core/report-engine/types";
import { BaseComponent, type Identifiable } from "../core/types";
import { getAllAsync, getJamonesAsync, type SecureEndPoint } from "../services/endpoint.service";

import { APP_CONFIG } from "@/app.config";
import { hydrateElement } from "@/core/hydrate";
import { pubSub } from "@/core/services/pubsub.service";
import template from '@/pages/test.page.ts.html?raw';
import { reportDefinition002, type DatoJamon } from "@/reports/sample-002.report";

export default class BaseComponentPage extends BaseComponent {
 

  init(){
    this.generateDynamicReport();    
  }

  render() {
    return buildAndInterpolate(template, this);
  }

  mounted() {
    console.log("TestPage montado y listo");
  }

  private hydrate(container: HTMLElement) {
    hydrateElement(container, {
      showNextReport: () => this.generateDynamicReport()
    });
  }

  mediator = new DefaultMediator((value: DefaultMediatorValue) => {
    if (!this.element) return;
    const container = $('#report-slot', this.element).one();
    if (container) {
      this.mediator.applyResult(
        container, 
        value,
        () => this.hydrate(container)
      );
    }    
  });

  showReport(_el: HTMLButtonElement, _ev: Event, key: string){
    switch (key) {
      case 'dynamic':
        this.generateDynamicReport();
        break;
      case 'js':
        this.generateJsReport('001');
        break;
      case 'js-2':
        this.generateJsReport('002');
        break;        
      case 'text':
        this.generateReportFromText();
        break;
      case 'code':
        this.generateReportFromCode();
        break;
      case 'registered':
        this.generateRegistedReport();
        break;
      case 'jamones':
        this.generateJamonesReport('jamones-002');
        break;
      case 'component':
        this.generateComponentBasedReport();
        break;
    }
  }

  // ===========================================================================
  // 1 Generar el informe desde un js cargado dinámicamente
  // ===========================================================================
  async generateJsReport(id: string){
    this.mediator.clear();
    const result = await getAllAsync();
    if(typeof result === 'string'){
      this.mediator.send(result);
      return;
    }

    const path = `assets/reports/secure-endpoints-${id}.report.js`
    const engine = new ReportEngine();
    const rd = await engine.loadExternalReport(path) as ReportDefinition<unknown>;
    engine.generateReport(rd, result.data, this.mediator);
    rd.mounted?.();
  };

  // ==============================================================================
  // Esto carga un informe en formato .ts
  // ==============================================================================
  async generateRegistedReport(){
    this.mediator.clear();
    const result = await getAllAsync();
    if(typeof result === 'string'){
      this.mediator.send(result);
      return;
    }
    const engine = new ReportEngine<SecureEndPoint>();
    // reports/sample-001.report
    const rd = await engine.loadRegisteredReport('sample-001');
    engine.generateReport(rd, result.data, this.mediator);
    rd.mounted?.();
  }

  // ==============================================================================
  // Esto carga un informe desde un texto plano. La respuesta de un API, DB
  // ==============================================================================
  async generateReportFromText(){
    this.mediator.clear();
    const result = await getAllAsync();
    if(typeof result === 'string'){
      this.mediator.send(result);
      return;
    }
    const code = `
      const PageHeader1 = () => {
        return \`      
          <div class="bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
            <i data-icon="info" class="inline-flex"></i>
            <p class="text-sm flex-1">
              Informe cargado desde una cadena de texto.
            </p>
            <p class="text-sm">
              
            </p>
          </div>
        \`;         
      };

      const PageDetail1 = (ctx) => {
        return \`
          <div class="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition">
            <div>
              <h2 class="text-lg font-semibold text-gray-800">
                \${ctx.data?.name}
              </h2>
              <p class="text-sm text-gray-500 break-all">
                \${ctx.data?.url}
              </p>
            </div>
          </div>
        \`;
      };

      const reportDefinition = {
        sections: [
          { id: "H1", type: 'header', valueProvider: PageHeader1 },
          { id: "D1", type: 'detail', valueProvider: PageDetail1 },
        ],
        summary: '{ }',
        orderBy: "name,env",
      };
    `;
    const engine = new ReportEngine();   
    const rd = engine.loadFromText(code);            
    engine.generateReport(rd, result.data, this.mediator);
    rd.mounted?.();
  }

  // ==============================================================================
  // Esto carga un informe con un reportDefinition en el método
  // ==============================================================================
  async generateReportFromCode(){
    const PageHeader1 = (ctx: HeaderRenderContext<SecureEndPoint>) => {
      return `
        <div class="mb-6 border-b pb-4">

          <div class="bg-blue-950 text-white px-4 py-2 rounded-md mt-6 mb-3 flex gap-1">
            <i data-icon="info" class="inline-flex"></i>
            <p class="text-sm flex-1">
              Informe generado desde código.
            </p>
            <p class="text-sm">
              
            </p>
          </div>

          <h1 class="text-4xl font-bold text-gray-600">
            Listado de Endpoints Seguros (${ctx.id} ${ctx.dataSet.length} elementos)
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Reporte general de endpoints configurados
          </p>
        </div>
      `;
    };

    const PageTotal1 = (ctx: TotalRenderContext<SecureEndPoint>) => {
      return `
        <div class="bg-gray-100 rounded-lg p-4 mb-6 shadow-sm border">
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold text-gray-700">
              Total de registros
            </span>
            <span class="text-2xl font-bold text-indigo-600">
              ${ctx.recordCount} ${ctx.id} 
            </span>
          </div>
        </div>
      `;
    };

    const PageDetail1 = (ctx: DetailRenderContext<SecureEndPoint>) => {
      return `
        <div key=${ctx.id} 
            class="bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition">  
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-lg font-semibold text-gray-800">
                ${ctx.data?.name}
              </h2>
              <p class="text-sm text-gray-500 break-all">
                ${ctx.data?.url}
              </p>
            </div>
            <div class="text-right">
              <span class="text-xs px-2 py-1 rounded-full 
                          ${ctx.data?.favorite
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-gray-200 text-gray-600'}">
                ${ctx.data?.favorite ? '★ Favorito' : 'Normal'}
              </span>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div><span class="font-medium">ID:</span> ${ctx.data?.id}</div>
            <div><span class="font-medium">Entorno:</span> ${ctx.data?.env}</div>
            <div><span class="font-medium">Login:</span> ${ctx.data?.login}</div>
            <div><span class="font-medium">Password:</span> ••••••••</div>
          </div>
        </div>
      `;
    };

    const PageG1 = (ctx: GroupHeaderRenderContext<SecureEndPoint>) => {
      return `
        <div key=${ctx.id} 
            class="bg-indigo-600 text-white px-4 py-2 rounded-md mt-6 mb-3 shadow">
          <h3 class="text-lg font-semibold">
            ${ctx.key}: ${ctx.current}
          </h3>
        </div>
      `;
    };

    const PageFooterG1 = (ctx: GroupFooterRenderContext<SecureEndPoint>) => {
      return `
        <div key=${ctx.id} 
            class="bg-indigo-50 border border-indigo-200 text-indigo-700 
                    px-4 py-2 rounded-md mb-6">
          <span class="font-medium">
            Total en ${ctx.key}:
          </span>
          ${ctx.data.recordCount} registros
        </div>
      `;
    };

    const rd: ReportDefinition<SecureEndPoint> = {
      sections: [
        { id: "H1", type: "header", valueProvider: PageHeader1 },
        { id: "G1", type: 'group', key: "env", valueProvider: PageG1, footerValueProvider: PageFooterG1 },
        { id: "D1", type: 'detail', valueProvider: PageDetail1 },
        { id: "T1", type: "total", valueProvider: PageTotal1 },
      ],
      summary: { },
      orderBy: "env,name desc"
    };
    this.mediator.clear();
    const result = await getAllAsync();
    if(typeof result === 'string'){
      this.mediator.send(result);
      return;
    }
    const engine = new ReportEngine<SecureEndPoint>();            
    engine.generateReport(rd, result.data, this.mediator);
    rd.mounted?.();
  }

  async generateJamonesReport(name: string) {
    this.mediator.clear();
    pubSub.publish(APP_CONFIG.messages.httpClient.loading);
    const result = await getJamonesAsync();
    pubSub.publish(APP_CONFIG.messages.httpClient.loaded);
    if (typeof result === 'string') {
      this.mediator.send(result);
      return
    }
    const engine = new ReportEngine();   
    const rd = await engine.loadExternalReport(`assets/reports/${name}.report.js`);            
    engine.generateReport(rd, result.data, this.mediator);
    rd.mounted?.();
  }


  private mode = 8;
  private descriptions =  [
    'Con 3 grupos (Proveedor, Tipo, Temporada)',
    'Sin grupos',
    'Rotación simple (Tipo, Temporada, Proveedor)',
    'Orden manual (Temporada, Proveedor, Tipo)',
    'Solo 2 grupos (Proveedor, Tipo)',
    'Solo 2 grupos (Tipo, Temporada)',
    'Solo 2 grupos (Proveedor, Temporada)',
    'Solo 1 grupo (Proveedor)',
    'Solo 1 grupo (Tipo)',
    'Solo 1 grupo (Temporada)',
  ];

  async generateDynamicReport(){
    // =============================================================
    // Cargar datos
    // =============================================================
    this.mediator.clear();
    pubSub.publish(APP_CONFIG.messages.httpClient.loading);
    const result = await getJamonesAsync();
    pubSub.publish(APP_CONFIG.messages.httpClient.loaded);
    if (typeof result === 'string') {   
      this.mediator.send(result);
      return
    }
    // =============================================================
    // Cargar report definiton
    // =============================================================
    const engine = new ReportEngine();
    const path = 'assets/reports/jamones-001.report.js'
    const rd = await engine.loadExternalReport(path); 
    // =============================================================
    // Rotación dinámica de configuración
    // =============================================================
    const sections = rd.sections as ReportSection<Identifiable>[];
    const header = sections.find((s) => s.type === "header");
    const detail = sections.find((s) => s.type === "detail");
    const total  = sections.find((s) => s.type === "total");
    const groups = sections.filter((s) => s.type === "group");
    let newGroups = [...groups];

    switch (this.mode % 10) {   
      case 0: // 0 → 3 grupos original
        break;      
      case 1: // 1 → sin grupos
        newGroups = [];
        break;      
      case 2: // 2 → rotación simple (G2,G3,G1)
        newGroups.push(newGroups.shift()!);
        break;      
      case 3: // 3 → orden manual (G3,G1,G2)
        newGroups = [
          groups.find((g) => g.key === "temporada"),
          groups.find((g) => g.key === "proveedor"),
          groups.find((g) => g.key === "tipo")
        ].filter(Boolean) as typeof groups;
        break;   
      case 4: // 4 → solo 2 grupos (proveedor,tipo)
        newGroups = groups.filter((g) => ["proveedor", "tipo"].includes(g.key));
        break;
      case 5: // 5 → solo 2 grupos (tipo,temporada)
        newGroups = groups.filter((g) => ["tipo", "temporada"].includes(g.key));
        break;      
      case 6: // 6 → solo 2 grupos (proveedor,temporada)
        newGroups = groups.filter((g) => ["proveedor", "temporada"].includes(g.key));
        break;      
      case 7: // 7 → solo 1 grupo (proveedor)
        newGroups = groups.filter((g) => g.key === "proveedor");
        break;    
      case 8: // 8 → solo 1 grupo (tipo)
        newGroups = groups.filter((g) => g.key === "tipo");
        break;
      case 9: // 9 → solo 1 grupo (temporada)
        newGroups = groups.filter((g) => g.key === "temporada");
        break;
    }
    const index = this.mode % 10;
    const message = (index + 1) + ' ' + this.descriptions[index];
    this.mode++;
    // ============================================================
    // Reconstruir sections
    // ============================================================
    rd.sections = [
      header,
      detail,
      ...newGroups,
      total
    ].filter(Boolean);
    // ============================================================
    // Reconstruir orderBy coherente
    // ============================================================
    const baseOrder = ["proveedor", "tipo", "temporada"];
    const groupedKeys = newGroups.map(g => g.key);
    const nonGroupedKeys = baseOrder.filter(
      key => !groupedKeys.includes(key)
    );
    const orderFields = [
      ...groupedKeys,
      ...nonGroupedKeys,
      "unidades",
      "denominacion"
    ];
    rd.orderBy = orderFields.join(",");
    // ============================================================
    // Generar el informe
    // ============================================================
    engine.generateReport(rd, result.data, this.mediator);
    // console.log(rd.state);
    setTimeout(() => {
      const refs = { 
        // dialog : this.dialog,
        // notifications : this.notifications,
        message : message  + ' ' + rd.orderBy,
      }          
      rd.mounted?.(refs);
    });    
  }

   async generateComponentBasedReport(){
    // =============================================================
    // Cargar datos
    // =============================================================
    this.mediator.clear();
    pubSub.publish(APP_CONFIG.messages.httpClient.loading);
    const result = await getJamonesAsync();
    pubSub.publish(APP_CONFIG.messages.httpClient.loaded);
    if (typeof result === 'string') {   
      this.mediator.send(result);
      return
    }
    // ===================================================================
    // 2 Generar el informe desde un ts con componentes Angular
    // ===================================================================
    const engine = new ReportEngine<DatoJamon>();
    const rd = reportDefinition002;
    engine.generateReport(rd, result.data as DatoJamon[], this.mediator);
    rd.mounted?.();
  }   

};


