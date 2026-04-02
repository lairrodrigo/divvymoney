import { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertTriangle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/types/finance';

// ─── Types ───────────────────────────────────────────────────────
interface RawRow {
  [key: string]: string | number | undefined;
}

interface ParsedSheet {
  name: string;
  headers: string[];
  rows: RawRow[];
}

interface ColumnMapping {
  data: string;
  valor: string;
  descricao: string;
  categoria: string;
  tipo: string;
  subtipo: string;
}

interface ValidatedRow {
  raw: RawRow;
  valid: boolean;
  error?: string;
  hash: string;
  transaction_date: string;
  reference_month: string;
  reference_year: number;
  valor: number;
  descricao: string;
  categoria: string;
  tipo: 'receita' | 'despesa';
  subtipo: 'dinheiro' | 'cartao';
}

type Step = 'upload' | 'preview' | 'mapping' | 'review' | 'importing' | 'done';

// ─── Helpers ─────────────────────────────────────────────────────

const COLUMN_SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  data: ['data', 'date', 'dia', 'dt', 'data da transação', 'data transação', 'data_transacao'],
  valor: ['valor', 'value', 'amount', 'quantia', 'preço', 'preco', 'total'],
  descricao: ['descricao', 'descrição', 'description', 'desc', 'detalhe', 'detalhes', 'lançamento', 'lancamento', 'histórico', 'historico'],
  categoria: ['categoria', 'category', 'cat', 'tipo gasto', 'classificação'],
  tipo: ['tipo', 'type', 'natureza', 'receita/despesa', 'entrada/saida'],
  subtipo: ['subtipo', 'forma', 'pagamento', 'forma de pagamento', 'meio', 'método'],
};

function autoMapColumns(headers: string[]): Partial<ColumnMapping> {
  const map: Partial<ColumnMapping> = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    const idx = lowerHeaders.findIndex(h => synonyms.some(s => h.includes(s)));
    if (idx !== -1) {
      map[field as keyof ColumnMapping] = headers[idx];
    }
  }
  return map;
}

function parseDate(raw: string | number | undefined): string | null {
  if (!raw) return null;

  // Excel serial number
  if (typeof raw === 'number') {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    return null;
  }

  const s = String(raw).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // YYYY-MM-DD (ISO)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // Try native
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function parseValor(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') return Math.abs(raw);
  const s = String(raw).trim().replace(/[R$\s]/g, '');
  // Handle Brazilian format: 1.234,56 → 1234.56
  const brFormat = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(brFormat);
  return isNaN(n) ? null : Math.abs(n);
}

function detectTipo(raw: string | number | undefined, valor?: number): 'receita' | 'despesa' {
  if (raw !== undefined && raw !== null) {
    const s = String(raw).toLowerCase().trim();
    if (['receita', 'entrada', 'crédito', 'credito', 'credit', 'income'].some(k => s.includes(k))) return 'receita';
    if (['despesa', 'saída', 'saida', 'débito', 'debito', 'debit', 'expense', 'gasto'].some(k => s.includes(k))) return 'despesa';
  }
  // If original value was negative, it's an expense
  if (typeof valor === 'number' && valor < 0) return 'despesa';
  return 'despesa';
}

function detectSubtipo(raw: string | number | undefined): 'dinheiro' | 'cartao' {
  if (!raw) return 'dinheiro';
  const s = String(raw).toLowerCase().trim();
  if (['cartão', 'cartao', 'card', 'crédito', 'credito', 'nubank', 'c6', 'inter', 'itaú', 'itau', 'bradesco', 'santander', 'visa', 'mastercard'].some(k => s.includes(k)))
    return 'cartao';
  return 'dinheiro';
}

function detectCategoria(raw: string | number | undefined): string {
  if (!raw) return 'Outros';
  const s = String(raw).trim();
  const cat = CATEGORIES.find(c => c.toLowerCase() === s.toLowerCase());
  return cat || 'Outros';
}

function monthFromSheetName(name: string, fallbackYear?: number): string | null {
  const monthNames: Record<string, number> = {
    jan: 1, janeiro: 1, fev: 2, fevereiro: 2, mar: 3, março: 3, marco: 3,
    abr: 4, abril: 4, mai: 5, maio: 5, jun: 6, junho: 6,
    jul: 7, julho: 7, ago: 8, agosto: 8, set: 9, setembro: 9,
    out: 10, outubro: 10, nov: 11, novembro: 11, dez: 12, dezembro: 12,
  };

  const lower = name.toLowerCase().trim();

  // "Jan 2025" or "Janeiro/2025"
  const withYear = lower.match(/^(\w+)\s*[/\-.]?\s*(\d{4})$/);
  if (withYear) {
    const m = monthNames[withYear[1]];
    if (m) return `${withYear[2]}-${String(m).padStart(2, '0')}`;
  }

  // Just month name
  const m = monthNames[lower];
  if (m && fallbackYear) return `${fallbackYear}-${String(m).padStart(2, '0')}`;

  return null;
}

function hashRow(date: string, valor: number, descricao: string): string {
  const raw = `${date}|${valor.toFixed(2)}|${descricao.toLowerCase().trim()}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ─── Component ───────────────────────────────────────────────────

export default function ImportWizard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>({
    data: '', valor: '', descricao: '', categoria: '', tipo: '', subtipo: '',
  });
  const [validated, setValidated] = useState<ValidatedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');

  // ─── File parsing ──────────────────
  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });

        const parsed: ParsedSheet[] = wb.SheetNames.map(name => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });
          const headers = json.length > 0 ? Object.keys(json[0]) : [];
          return { name, headers, rows: json };
        }).filter(s => s.rows.length > 0);

        if (parsed.length === 0) {
          toast({ title: 'Arquivo vazio ou formato inválido', variant: 'destructive' });
          return;
        }

        setSheets(parsed);
        const autoMap = autoMapColumns(parsed[0].headers);
        setMapping(prev => ({ ...prev, ...autoMap }));
        setStep('preview');
      } catch {
        toast({ title: 'Erro ao ler arquivo', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ─── Validation ────────────────────
  const runValidation = useCallback(() => {
    const allRows: ValidatedRow[] = [];

    for (const sheet of sheets) {
      const sheetMonth = monthFromSheetName(sheet.name, new Date().getFullYear());

      for (const raw of sheet.rows) {
        const dateStr = parseDate(raw[mapping.data]);
        const rawValor = raw[mapping.valor];
        const valor = parseValor(rawValor);
        const descricao = raw[mapping.descricao] ? String(raw[mapping.descricao]).trim() : '';

        if (!dateStr) {
          allRows.push({ raw, valid: false, error: 'Data inválida', hash: '', transaction_date: '', reference_month: '', reference_year: 0, valor: 0, descricao, categoria: '', tipo: 'despesa', subtipo: 'dinheiro' });
          continue;
        }
        if (valor === null || valor === 0) {
          allRows.push({ raw, valid: false, error: 'Valor inválido', hash: '', transaction_date: dateStr, reference_month: '', reference_year: 0, valor: 0, descricao, categoria: '', tipo: 'despesa', subtipo: 'dinheiro' });
          continue;
        }
        if (!descricao || descricao.length < 2) {
          allRows.push({ raw, valid: false, error: 'Descrição muito curta', hash: '', transaction_date: dateStr, reference_month: '', reference_year: 0, valor, descricao, categoria: '', tipo: 'despesa', subtipo: 'dinheiro' });
          continue;
        }

        const [y, m] = dateStr.split('-');
        const refMonth = sheetMonth || `${y}-${m}`;
        const originalVal = typeof rawValor === 'number' ? rawValor : parseFloat(String(rawValor).replace(/[R$\s.]/g, '').replace(',', '.'));

        allRows.push({
          raw,
          valid: true,
          hash: hashRow(dateStr, valor, descricao),
          transaction_date: dateStr,
          reference_month: refMonth,
          reference_year: parseInt(refMonth.split('-')[0]),
          valor,
          descricao,
          categoria: detectCategoria(mapping.categoria ? raw[mapping.categoria] : undefined),
          tipo: detectTipo(mapping.tipo ? raw[mapping.tipo] : undefined, originalVal),
          subtipo: detectSubtipo(mapping.subtipo ? raw[mapping.subtipo] : undefined),
        });
      }
    }

    setValidated(allRows);
    setStep('review');
  }, [sheets, mapping]);

  // ─── Import ────────────────────────
  const runImport = useCallback(async () => {
    setStep('importing');
    const validRows = validated.filter(r => r.valid);

    // Fetch existing hashes for dedup
    const { data: existing = [] } = await supabase
      .from('transactions')
      .select('descricao, transaction_date, valor')
      .eq('user_id', user!.id);

    const existingHashes = new Set(
      existing.map(t => hashRow(t.transaction_date, Number(t.valor), t.descricao))
    );

    let imported = 0;
    let skipped = 0;
    const batch: Array<Record<string, unknown>> = [];

    for (const row of validRows) {
      if (existingHashes.has(row.hash)) {
        skipped++;
        continue;
      }
      batch.push({
        user_id: user!.id,
        created_by: user!.id,
        tipo: row.tipo,
        subtipo: row.subtipo,
        valor: row.valor,
        descricao: row.descricao,
        categoria: row.categoria,
        transaction_date: row.transaction_date,
        reference_month: row.reference_month,
        reference_year: row.reference_year,
        origem: 'importado',
        parcelado: false,
        parcela_atual: 1,
        total_parcelas: 1,
      });
    }

    // Insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);
      const { error } = await supabase.from('transactions').insert(chunk);
      if (error) {
        console.error('Import chunk error:', error);
      } else {
        imported += chunk.length;
      }
      setProgress(Math.round(((i + chunkSize) / batch.length) * 100));
    }

    setResult({
      imported,
      skipped,
      errors: validated.filter(r => !r.valid).length,
    });
    setProgress(100);
    setStep('done');
    qc.invalidateQueries({ queryKey: ['transactions'] });
  }, [validated, user, qc]);

  // ─── Derived ───────────────────────
  const currentSheet = sheets[activeSheet];
  const validCount = validated.filter(r => r.valid).length;
  const invalidCount = validated.filter(r => !r.valid).length;

  const mappingComplete = !!(mapping.data && mapping.valor && mapping.descricao);

  // ─── Render ────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-card rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-gold">
              <FileSpreadsheet className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Importar planilha</h2>
              <p className="text-[10px] text-muted-foreground">
                {step === 'upload' && 'Selecione um arquivo'}
                {step === 'preview' && `${fileName}`}
                {step === 'mapping' && 'Configure as colunas'}
                {step === 'review' && `${validCount} válidas, ${invalidCount} inválidas`}
                {step === 'importing' && `Importando... ${progress}%`}
                {step === 'done' && 'Importação concluída'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-5 py-3 flex gap-1">
          {(['upload', 'preview', 'mapping', 'review', 'importing', 'done'] as Step[]).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              i <= ['upload', 'preview', 'mapping', 'review', 'importing', 'done'].indexOf(step)
                ? 'gradient-gold'
                : 'bg-secondary'
            }`} />
          ))}
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* ─── UPLOAD ─── */}
          {step === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40'
              }`}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">Arraste ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">CSV ou Excel (.xlsx)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* ─── PREVIEW ─── */}
          {step === 'preview' && currentSheet && (
            <>
              {sheets.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {sheets.map((s, i) => (
                    <button key={i} onClick={() => setActiveSheet(i)}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        i === activeSheet ? 'gradient-gold text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}>
                      {s.name} ({s.rows.length})
                    </button>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      {currentSheet.headers.slice(0, 6).map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground truncate max-w-[120px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheet.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {currentSheet.headers.slice(0, 6).map(h => (
                          <td key={h} className="px-3 py-2 text-foreground truncate max-w-[120px]">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Mostrando 5 de {currentSheet.rows.length} linhas • {sheets.length} aba(s)
              </p>

              <button onClick={() => setStep('mapping')}
                className="w-full flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground">
                Configurar colunas <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* ─── MAPPING ─── */}
          {step === 'mapping' && currentSheet && (
            <>
              <p className="text-xs text-muted-foreground">Associe as colunas da sua planilha aos campos do sistema. Campos com ★ são obrigatórios.</p>

              {([
                { key: 'data', label: '★ Data', required: true },
                { key: 'valor', label: '★ Valor', required: true },
                { key: 'descricao', label: '★ Descrição', required: true },
                { key: 'categoria', label: 'Categoria', required: false },
                { key: 'tipo', label: 'Tipo (receita/despesa)', required: false },
                { key: 'subtipo', label: 'Forma de pagamento', required: false },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                  <select
                    value={mapping[key]}
                    onChange={e => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="">— Não mapear —</option>
                    {currentSheet.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="flex gap-2">
                <button onClick={() => setStep('preview')}
                  className="flex-1 rounded-xl bg-secondary py-3 text-sm font-medium text-foreground">
                  <ChevronLeft className="inline h-4 w-4 mr-1" />Voltar
                </button>
                <button onClick={runValidation} disabled={!mappingComplete}
                  className="flex-1 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
                  Revisar <ChevronRight className="inline h-4 w-4 ml-1" />
                </button>
              </div>
            </>
          )}

          {/* ─── REVIEW ─── */}
          {step === 'review' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-success/10 p-3 text-center">
                  <p className="text-lg font-bold text-success">{validCount}</p>
                  <p className="text-[10px] text-muted-foreground">Válidas</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3 text-center">
                  <p className="text-lg font-bold text-destructive">{invalidCount}</p>
                  <p className="text-[10px] text-muted-foreground">Inválidas</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-center">
                  <p className="text-lg font-bold text-primary">{validated.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-1.5 rounded-xl border border-border p-2">
                {validated.slice(0, 30).map((row, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    row.valid ? 'bg-secondary/50' : 'bg-destructive/5'
                  }`}>
                    {row.valid ? (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <span className="truncate flex-1 text-foreground">
                      {row.descricao || '(sem descrição)'}
                    </span>
                    {row.valid ? (
                      <span className={`shrink-0 font-medium ${row.tipo === 'receita' ? 'text-success' : 'text-foreground'}`}>
                        R$ {row.valor.toFixed(2)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-destructive">{row.error}</span>
                    )}
                  </div>
                ))}
                {validated.length > 30 && (
                  <p className="text-center text-xs text-muted-foreground py-1">
                    +{validated.length - 30} linhas...
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('mapping')}
                  className="flex-1 rounded-xl bg-secondary py-3 text-sm font-medium text-foreground">
                  <ChevronLeft className="inline h-4 w-4 mr-1" />Voltar
                </button>
                <button onClick={runImport} disabled={validCount === 0}
                  className="flex-1 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
                  Importar {validCount} linhas
                </button>
              </div>
            </>
          )}

          {/* ─── IMPORTING ─── */}
          {step === 'importing' && (
            <div className="py-8 space-y-4 text-center">
              <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Importando transações...</p>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full gradient-gold transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}%</p>
            </div>
          )}

          {/* ─── DONE ─── */}
          {step === 'done' && (
            <div className="py-6 space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                <Check className="h-7 w-7 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Importação concluída!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.imported} importadas • {result.skipped} duplicadas ignoradas
                  {result.errors > 0 && ` • ${result.errors} com erro`}
                </p>
              </div>
              <button onClick={onClose}
                className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
