

import type {
  DetailRenderContext,
  GroupAccumulatedData,
  GroupContext,
  GroupFooterRenderContext,
  GroupHeaderRenderContext,
  GroupKey,
  HeaderRenderContext,
  Mediator,
  ReportDefinition,
  ReportDetailSection,
  ReportGroupSection,
  ReportHeaderSection,
  ReportState,
  ReportTotalSection,
  TotalRenderContext,
} from "./types";
import { computeSummary, sortBy } from "./utils";
import { getReport } from "../report-registry";
import { pubSub } from "../services/pubsub.service";

import { APP_CONFIG } from "@/app.config";


export default class ReportEngine<T> {
  
  generateReport(rd: ReportDefinition<T>, data: T[], mediator: Mediator) {

    const BS: ReportState<T> = {
      recordCount: 0,
      dataSet: [],
      percent: 0,
      isLastRow: false,
      isLastRowInGroup: false,
      grandTotal: {}
    };
    
    // ======================================================================================
    // Transformar los datos
    // ======================================================================================
    let dataset = rd.parseData ? rd.parseData(rd, data) : data;
    // ======================================================================================
    // Generación de las secciones de cabecera de las agrupaciones
    // ======================================================================================
    const renderGroupsHeaders = () => {
      __groups.forEach((g, i: number) => {
        if (i < __breakIndex) return;
        const { id, name, current, definition } = g;
        if (definition.valueProvider) {
          const isLastGroup = i == __groups.length - 1
          const { key } = definition;
          const ctx:GroupHeaderRenderContext<T> = {
            kind: 'GroupHeaderRenderContext',
            id, name, key, current,
            dataSet: dataset, isLastGroup
          };
          mediator.send(definition.valueProvider(ctx, key));
        }
      });
    }
    // ======================================================================================
    // Generación de las secciones de resumen de las agrupaciones
    // ======================================================================================    
    const renderGoupsFooters = (index?: number) => {
      const __gg = __groups.map(g => g);
      if (index) __gg.splice(0, index);
      __gg.reverse().forEach((g, i) => {
        const isLastGroup = i == __groups.length - 1
        const { id, name, current, definition } = g;
        const { key } = definition;
        const g_key = name as GroupKey;
        const data = BS[g_key] as GroupContext<T>;
        if (definition.footerValueProvider) {
          const groupData = data.all[current];
          groupData.summary = computeSummary(groupData.records, __summary);
          const { records, recordCount, key: gKey, summary } = groupData;
          const ctx:GroupFooterRenderContext<T> = {
            kind: 'GroupFooterRenderContext',
            id, name, key, current,
            data: { records, recordCount, key: gKey, summary },
            dataSet: dataset, isLastGroup
          };
          mediator.send(definition.footerValueProvider(ctx));
        }
      });
    }
    // ======================================================================================
    // Generación de las secciones de detalle
    // ======================================================================================        
    const renderDetailsSections = () => {
      __details.forEach((d: ReportDetailSection<T>) => {
        if (d.valueProvider) {                    
          const { 
            recordCount, dataSet, isLastRow, 
            isLastRowInGroup, percent, previous, 
            data 
          } = BS;
          const last = __groups[__groups.length - 1];
          const g_key = last?.name as GroupKey;
          let groupRecordCount = 0;
          if (g_key) {
            const groupCtx = BS[g_key] as GroupContext<T>;
            const current = groupCtx.all[last.current];
            groupRecordCount = current.recordCount;
          }
          const ctx:DetailRenderContext<T> = {
            kind: 'DetailRenderContext',
            id: d.id,
            data, previous, dataSet,
            recordCount, groupRecordCount, percent,
            isLastRow, 
            isLastRowInGroup,
          };
          return mediator.send(d.valueProvider(ctx));
        }
      })
    }
    // ======================================================================================
    // Generación de las secciones de total general
    // ======================================================================================
    const renderGrandTotalSections = () => {
      __totals.forEach((t: ReportTotalSection<T>)  => {
        if (t.valueProvider) {
          const { id } = t;
          const { 
            recordCount, dataSet, isLastRow, 
            isLastRowInGroup, percent, previous, 
            data 
          } = BS;
          const groups = __groups.reduce( (acc, g) => {     
              const g_key = g.name as GroupKey;                
              acc[g.name] = (BS[g_key] as GroupContext<T>).all;
              return acc;
            }, 
            {} as Record<string, Record<string, GroupAccumulatedData<T>>>
          );
          const grandTotal = computeSummary(dataset, __summary);
          const ctx:TotalRenderContext<T> = { 
            kind: 'TotalRenderContext',
            id,
            data, previous, dataSet, grandTotal,
            recordCount, percent,
            isLastRow, 
            isLastRowInGroup,
            ...groups
          };

          return mediator.send(t.valueProvider(ctx));
        }
      })
    }
    // ======================================================================================
    // Generación de las secciones de cabecera del informe
    // ======================================================================================
    const renderReportHeaderSections = () => {
      __headers.forEach((t: ReportHeaderSection<T>) => {
        if (t.valueProvider) {
          const isGroupedReport = __groups.length > 0;
          const ctx:HeaderRenderContext<T> = {
            kind: 'HeaderRenderContext',
            id: t.id,
            dataSet: dataset,
            isGroupedReport
          };
          return mediator.send(t.valueProvider(ctx));
        }
      })
    }
    // ======================================================================================
    // Inicializar el objeto que sirve de acumulador
    // ======================================================================================
    function resolveSummaryObject() {
      let summary;
      if (!rd.summary) {
        summary = {};
      } else if (typeof rd.summary === 'string') {
        try {
          summary = JSON.parse(rd.summary);
        } catch (err) {
          console.warn('Invalid JSON in rd.summary:', err);
          summary = {};
        }
      } else if (typeof rd.summary === 'object') {
        summary = rd.summary;
      } else {
        summary = {};
      }
      if (typeof rd.onInitSummaryObject === 'function') {
        return rd.onInitSummaryObject(summary);
      }
      return summary;
    }

    let __breakIndex = -1;
    const __summary = resolveSummaryObject();
    const __headers: ReportHeaderSection<T>[] = (rd.sections || []).filter((s) => s.type == 'header');
    const __totals: ReportTotalSection<T>[] = (rd.sections || []).filter((s) => s.type == 'total');
    const __details: ReportDetailSection<T>[] = (rd.sections || []).filter((s) => s.type == 'detail');
    const __groups_temp = (rd.sections || []).filter((s): s is ReportGroupSection<T> => s.type === 'group');
    const __groups = __groups_temp.map((group, i: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getKeyValue = (row: T, key: string) => (row as any)[key];
      return {
          name: 'G' + (i + 1),
          id: group.id,
          rd: rd,
          definition: group,
          current: '',
          init: function (value: T) {
            const g_key = this.name as GroupKey;
            const groupData = (BS[g_key] as GroupContext<T>).all;
            const key = getKeyValue(value, this.definition.key);               
            groupData[key] = {
              rows :  groupData[key]?.rows ?? [],
              records: [],
              recordCount: 0,
              key: key,
              summary: {}
            };
            groupData[key].records.push(value);
            groupData[key].rows?.push(value);
            groupData[key].recordCount = 1;
          },
          sum: function (value: T) {
            const g_key = this.name as GroupKey;
            const groupData = (BS[g_key] as GroupContext<T>).all;
            const key = getKeyValue(value, this.definition.key);                
            groupData[key] = groupData[key] || {
              rows : [],
              records: [],
              recordCount: 0,
              key: key
            };
            groupData[key].records.push(value);
            groupData[key].rows?.push(value);
            groupData[key].recordCount += 1;
          },
          test: function (value: T) {
            return getKeyValue(value, this.definition.key) == this.current;
          }
      }
    }) || [];        
    // =================================================================================
    // Ordenar los datos
    // =================================================================================
    if (rd.iteratefn) dataset.forEach(rd.iteratefn);
    if (rd.orderBy) dataset = sortBy(dataset, rd.orderBy);
    // =================================================================================
    // Inicializar
    // =================================================================================
    BS.dataSet = dataset;
    BS.reportDefinition = rd;
    __groups.forEach(g => {
        const target = dataset[0] as Record<string,string>;
        g.current = (dataset && dataset[0]) ? target[g.definition.key!] : '';
        const g_key = g.name as GroupKey;
        BS[g_key] = { all: {} } as GroupContext<T>;
    });
    if (rd.onStartfn) rd.onStartfn(BS);
    // =================================================================================
    // Cabeceras del informe
    // =================================================================================
    renderReportHeaderSections();
    // =================================================================================
    // Cabeceras iniciales
    // =================================================================================
    if (dataset.length > 0) renderGroupsHeaders();
    // =================================================================================
    // Iterar sobre los elementos
    // =================================================================================
    dataset.forEach((r: T) => {
        // ============================================================================
        // Procesar el elemento
        // ============================================================================         
        BS.recordCount++;
        BS.isLastRow = dataset.length === BS.recordCount;
        BS.isLastRowInGroup = BS.isLastRow;
        BS.percent = (BS.recordCount / dataset.length) * 100;
        BS.previous = BS.data || r;
        BS.data = r;
        if (rd.onRowfn) rd.onRowfn(BS);
        // ============================================================================
        // Determinar si hay cambio en alguna de las claves de agrupación
        // ============================================================================
        if (__groups.every(g => g.test(r))) {
          __groups.forEach(g => { g.sum(r); });
        } else {
          __groups.some((g, i) => {
            if (!g.test(r)) {
              __breakIndex = i;
              // ============================================
              // Pies de grupo de los que han cambiado
              // ============================================
              renderGoupsFooters(__breakIndex);
              // ============================================
              // Actualizar los grupos
              // ============================================
              __groups.forEach((grupo, ii) => {
                if (ii >= __breakIndex) {
                  // ========================================
                  // Inicializar los que han cambiado
                  // ========================================
                  grupo.init(r)
                  __breakIndex = i;
                } else {
                  // ========================================
                  // Acumular valores de los que siguen igual
                  // ========================================
                  grupo.sum(r);
                }
              });
              return true;
            }
            return false;
          })
          // ==========================================================
          // Notificar del evento onGroupChange
          // ==========================================================
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          __groups.forEach(g => g.current = (r as any)[g.definition.key!]);
          if (rd.onGroupChangefn) rd.onGroupChangefn(BS);
          // ==========================================================
          // Cabeceras
          // ==========================================================
          renderGroupsHeaders();
        }
        // ============================================================
        // Determinar si este es el último elemento de la agrupación 
        // ============================================================
        if (__groups.length && !BS.isLastRow) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const __next = dataset[BS.recordCount] as any;
          BS.isLastRowInGroup = !__groups.every(g => {
            const key = g.definition.key!;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return __next[key] === (BS.data as any)[key];
          });
        }
        // ============================================================
        // Secciones de detalle
        // ============================================================
        renderDetailsSections()
    });
    // =================================================================================
    // Pies de grupo
    // =================================================================================
    if (dataset.length > 0) {
        BS.previous = BS.data;
        renderGoupsFooters();
    }
    // =================================================================================
    // Total general
    // =================================================================================
    renderGrandTotalSections();
    // =================================================================================
    // Notificar finalización
    // =================================================================================      
    if (mediator.flush) mediator.flush();
    rd.state = BS;
  }

  loadFromText(code: string){
    const module = new Function(code + '; return reportDefinition;')();
    return module;
  }

  async loadExternalReport(path: string) {
    pubSub.publish(APP_CONFIG.messages.httpClient.loading);
    const response = await fetch(path);
    const code = await response.text();
    pubSub.publish(APP_CONFIG.messages.httpClient.loaded);
    return this.loadFromText(code);
  }

  async loadRegisteredReport(name: string) {
    const loader = getReport(name);
    if (!loader) throw new Error(`Report not found: ${name}`);
    const module = await loader();
    return module.reportDefinition as ReportDefinition<T>;
  }

}