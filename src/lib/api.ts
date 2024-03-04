import axios, { AxiosInstance } from 'axios';
import useSWR from 'swr';

export enum PrinterApi {
  Mock = 'Mock',
  OctoPrint = 'OctoPrint',
  Prusa = 'Prusa',
}

export interface Printer {
  id: number;
  url: string;
  api_key: string;
  opcua_name: string;
  api: PrinterApi;
  is_active: boolean;
}
export interface PrinterTemperature {
  actual: number;
  target: number;
}

export interface PrinterJob {
  id: number;
  file_path: string;
  progress: number;
  time_used: number;
  time_left: number;
  time_approx: number | null;
}

export interface PrinterState {
  name: string;
  model: string;
  camera_url: string;
  state: string;
  temp_bed: PrinterTemperature;
  temp_nozzle: PrinterTemperature;
  job: PrinterJob;

  isReady: boolean;
  isPrinting: boolean;
  isError: boolean;
}

export type PrinterId = Pick<Printer, 'id'>;
export type CreatePrinter = Pick<
  Printer,
  'url' | 'api_key' | 'opcua_name' | 'api'
>;

const _axios: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_PRINTER_SERVER_URL,
});

async function getFetcher<T>(url: string) {
  const resp = await _axios.get<T>(url);
  return resp.data;
}

async function createPrinter(accessToken: string, printer: CreatePrinter) {
  const resp = await _axios.post<PrinterId>('/api/v1/printers', printer, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return resp.data;
}

export function usePrinterState(printerName: string) {
  const { data, error, isLoading } = useSWR(
    `/api/v1/printers/state/${printerName}`,
    getFetcher<PrinterState>,
  );

  if (data) {
    data.isPrinting = data.state === 'printing';
    data.isReady = data.state === 'ready';
    data.isError = data.state === 'error';
  }

  return {
    state: data,
    isLoading,
    error,
  };
}

export function usePrinters() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/printers',
    getFetcher,
  );

  return {
    printers: data,
    isLoading,
    error,
    createPrinter: async (token: string, printer: CreatePrinter) =>
      await mutate(createPrinter(token, printer)),
  };
}
