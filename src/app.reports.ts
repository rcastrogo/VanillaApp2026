import type { ReportModuleLoader } from './core/report-engine/types';

const reports = {
  'sample-001': () => import('./reports/sample-001.report'),
  'poc1-demo': () => import('./features/poc-1/reports/poc1-demo.report'),
} as Record<string, ReportModuleLoader>;

function registerReport(name: string, report: ReportModuleLoader){
  if (!reports[name]) {
    reports[name] = report;
    console.log(`[Registry] Report '${name}' registrado con éxito.`);
  }
}

export const reportRegistry = {
  reports,
  registerReport,
};