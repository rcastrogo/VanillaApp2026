/* eslint-disable @typescript-eslint/no-explicit-any */

import type { BaseComponent, Identifiable, SortProperties } from "../types";


export interface ComponentInstruction<T> {
  kind: 'component';
  component: BaseComponent;
  context: T;
}

export type MediatorSendValue = string | string[] | ComponentInstruction<any>;
export interface Mediator {
  send: (content: MediatorSendValue) => void;
  flush?: () => void;
  clear?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ReportSectionBase<_T = Identifiable> {
  id: string;
  valueProvider?: (ctx: any, key: string) => MediatorSendValue;
}

export interface ReportHeaderSection<T> extends ReportSectionBase<T> {
  type: 'header';
  valueProvider?: (ctx: HeaderRenderContext<T>) => MediatorSendValue;
}
export interface ReportTotalSection<T> extends ReportSectionBase<T> {
  type: 'total';
  valueProvider?: (ctx: TotalRenderContext<T>) => MediatorSendValue;
}
export interface ReportDetailSection<T> extends ReportSectionBase<T> {
  type: 'detail';
  valueProvider?: (ctx: DetailRenderContext<T>) => MediatorSendValue;
}
export interface ReportGroupSection<T> extends ReportSectionBase<T> {
  type: 'group';
  key: string;
  footerValueProvider?: (ctx: GroupFooterRenderContext<T>) => MediatorSendValue;
}

export type ReportSection<T> =
  | ReportHeaderSection<T>
  | ReportTotalSection<T>
  | ReportDetailSection<T>
  | ReportGroupSection<T>;

export interface ReportDefinition<T> {
  parseData?: (rd: ReportDefinition<T>, data: T[]) => T[];
  summary?: SummaryDefinition<T>;
  onInitSummaryObject?: (summary: any) => any;
  sections?: ReportSection<T>[];
  iteratefn?: (row: T) => void;
  orderBy?: SortProperties;
  onStartfn?: (BS: ReportState<T>) => void;
  onRowfn?: (BS: ReportState<T>) => void;
  onGroupChangefn?: (BS: any) => void;
  state?: ReportState<T>;
  mounted?: (refs?: any) => void;
  [key: string]: any;
}

export interface GroupAccumulatedData<T> {
  records: T[];
  rows?: T[];
  recordCount: number;
  key: string;
  summary: Record<string, number | any>;
}

export type AggregateFunction =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'median'
  | 'values' 
  | 'distinct';

export type SummaryDefinition<T> = {
  [K in keyof T]?: AggregateFunction[];
};

export interface GroupContext<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  all: { [key: string]: GroupAccumulatedData<T>; };
  recordCount: number;
}

export interface BaseRenderContext<T> {
  kind: string;
  id: string;
  dataSet: T[];
  isGroupedReport?: boolean;
}

export interface RowRenderContext<T> extends BaseRenderContext<T> {
  data?: T;
  previous?: T;
  recordCount: number;
  percent: number;
  isLastRow: boolean;
  isLastRowInGroup: boolean;
}

export interface BaseGroupRenderContext<T> extends BaseRenderContext<T> {
  name: string;
  key: string;
  current: string;
  isLastGroup: boolean;
}

export interface HeaderRenderContext<T> extends BaseRenderContext<T> {
  kind: "HeaderRenderContext";
 }

export interface DetailRenderContext<T> extends RowRenderContext<T> {
  kind: "DetailRenderContext";
  groupRecordCount: number;
  grandTotal?: unknown;
  summary?: Record<string, unknown>;
}

export interface TotalRenderContext<T> extends RowRenderContext<T> {
  kind: "TotalRenderContext";
  grandTotal?: unknown;
  [key: string]: unknown;
}

export interface GroupHeaderRenderContext<T> extends BaseGroupRenderContext<T> {
  kind: "GroupHeaderRenderContext";
 }

export interface GroupFooterRenderContext<T> extends BaseGroupRenderContext<T> {
  kind: "GroupFooterRenderContext";
  data: GroupAccumulatedData<T>;
}

export type GroupKey = `G${number}`;

interface ReportBaseState<T> {
  recordCount: number;
  grandTotal: Record<string, GroupContext<T>>;
  dataSet: T[];
  reportDefinition?: ReportDefinition<T>;
  previous?: T;
  data?: T;
  percent: number;
  isLastRow: boolean;
  isLastRowInGroup: boolean;
  [groupName: `G${number}`]: GroupContext<T>;
}

export type ReportState<T> =
  ReportBaseState<T> &
  Record<GroupKey, GroupContext<T>>;

export interface ReportModule { reportDefinition: ReportDefinition<any> };
export type ReportModuleLoader = () => Promise<ReportModule>;
export type ReportRegistry = Record<string, ReportModuleLoader>;