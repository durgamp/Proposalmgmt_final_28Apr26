import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Plus, Trash2, Save, TrendingUp } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import toast from 'react-hot-toast';
import { CostCategory } from '@biopropose/shared-types';
import type { CostItem } from '@biopropose/shared-types';

interface Props {
  proposalId: string;
}

const CATEGORIES = ['Service', 'Material', 'Outsourcing'] as const;

type EditableCostItem = Omit<CostItem, 'createdAt' | 'updatedAt' | 'proposalId'> & {
  id: string;
  _new?: boolean;
};

export default function CostBreakdown({ proposalId }: Props) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: serverItems } = useQuery({
    queryKey: ['costs', proposalId],
    queryFn: () => costsApi.getCosts(proposalId),
  });

  const { data: summary } = useQuery({
    queryKey: ['costs-summary', proposalId],
    queryFn: () => costsApi.getSummary(proposalId),
  });

  const [items, setItems] = useState<EditableCostItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (serverItems && !initialized) {
    setItems(serverItems.map((i) => ({ ...i })));
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      costsApi.saveCosts(proposalId, {
        items: items
          .filter((item) => item.description.trim().length > 0 && item.quantity > 0)
          .map((item, idx) => ({ ...item, sortOrder: idx })),
        updatedBy: user!.email,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costs', proposalId] });
      qc.invalidateQueries({ queryKey: ['costs-summary', proposalId] });
      toast.success('Cost breakdown saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const addRow = () => {
    const newItem: EditableCostItem = {
      id: uuid(),
      category: CostCategory.SERVICE,
      description: '',
      quantity: 1,
      serviceRate: 0,
      materialRate: 0,
      outsourcingRate: 0,
      totalCost: 0,
      stage: '',
      isBinding: true,
      isFixedRate: false,
      sortOrder: items.length,
      createdBy: user!.email,
      updatedBy: user!.email,
      _new: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, field: keyof EditableCostItem, value: unknown) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.totalCost = updated.quantity * (
        (updated.serviceRate ?? 0) + (updated.materialRate ?? 0) + (updated.outsourcingRate ?? 0)
      );
      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Derived totals from local state (used in footer)
  const localServiceTotal = items
    .filter((i) => i.category === CostCategory.SERVICE)
    .reduce((s, i) => s + (i.totalCost ?? 0), 0);
  const localMaterialTotal = items
    .filter((i) => i.category === CostCategory.MATERIAL)
    .reduce((s, i) => s + (i.totalCost ?? 0), 0);
  const localOutsourcingTotal = items
    .filter((i) => i.category === CostCategory.OUTSOURCING)
    .reduce((s, i) => s + (i.totalCost ?? 0), 0);
  const grandTotal = localServiceTotal + localMaterialTotal + localOutsourcingTotal;

  // Use server summary when available, fall back to local
  const serviceTotal = summary?.serviceTotal ?? localServiceTotal;
  const materialTotal = summary?.materialTotal ?? localMaterialTotal;
  const outsourcingTotal = summary?.outsourcingTotal ?? localOutsourcingTotal;
  const displayGrandTotal = summary?.grandTotal ?? grandTotal;

  const categoryLabel: Record<string, { label: string; color: string; bg: string }> = {
    Service: { label: 'Service Total', color: 'text-brand-800', bg: 'bg-brand-50' },
    Material: { label: 'Material Total', color: 'text-green-700', bg: 'bg-green-50' },
    Outsourcing: { label: 'Outsourcing Total', color: 'text-purple-700', bg: 'bg-purple-50' },
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['Service', 'Material', 'Outsourcing'] as const).map((cat) => {
          const total = cat === 'Service' ? serviceTotal : cat === 'Material' ? materialTotal : outsourcingTotal;
          const { label, color, bg } = categoryLabel[cat];
          return (
            <div key={cat} className={`card text-center ${bg} border-0`}>
              <p className={`text-xl font-bold ${color}`}>${total.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          );
        })}
        <div className="card text-center bg-gray-900 border-0">
          <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
            <TrendingUp size={16} />
            ${displayGrandTotal.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Grand Total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Cost Items</h3>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs py-1.5" onClick={addRow}>
              <Plus size={14} />
              Add Row
            </button>
            <button
              className="btn-primary text-xs py-1.5"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-28">Category</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Description</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 w-24">Stage</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-16">Qty</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-28">Service Rate</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-28">Material Rate</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-28">Outsourcing Rate</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-28">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30">
                  <td className="px-3 py-1.5">
                    <select
                      className="input text-xs py-1"
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      className="input text-xs py-1"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description..."
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      className="input text-xs py-1"
                      value={item.stage ?? ''}
                      onChange={(e) => updateItem(item.id, 'stage', e.target.value)}
                      placeholder="Stage 1"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      className="input text-xs py-1 text-right"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      className="input text-xs py-1 text-right"
                      value={item.serviceRate}
                      min={0}
                      onChange={(e) => updateItem(item.id, 'serviceRate', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      className="input text-xs py-1 text-right"
                      value={item.materialRate}
                      min={0}
                      onChange={(e) => updateItem(item.id, 'materialRate', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      className="input text-xs py-1 text-right"
                      value={item.outsourcingRate}
                      min={0}
                      onChange={(e) => updateItem(item.id, 'outsourcingRate', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-brand-800">
                    ${(item.totalCost ?? 0).toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      className="text-gray-300 hover:text-red-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No cost items yet. Click "Add Row" to get started.
                  </td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={7} className="px-3 py-2 text-xs text-gray-500">
                    Service: <span className="font-semibold text-gray-800">${localServiceTotal.toLocaleString()}</span>
                    <span className="mx-2">·</span>
                    Material: <span className="font-semibold text-gray-800">${localMaterialTotal.toLocaleString()}</span>
                    <span className="mx-2">·</span>
                    Outsourcing: <span className="font-semibold text-gray-800">${localOutsourcingTotal.toLocaleString()}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-brand-800">
                    ${grandTotal.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
