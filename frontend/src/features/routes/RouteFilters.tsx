import { type RouteFilters as IRouteFilters } from '@/types';
import { FUEL_TYPES } from '@/lib/constants';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface RouteFiltersProps {
  filters: IRouteFilters;
  onChange: (filters: IRouteFilters) => void;
}

export function RouteFilters({ filters, onChange }: RouteFiltersProps) {
  const hasActiveFilters = !!(filters.fuelType || filters.year || filters.vesselType);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <Select
        label="Fuel Type"
        selectSize="sm"
        value={filters.fuelType ?? ''}
        onChange={(e) => onChange({ ...filters, fuelType: e.target.value || undefined })}
        placeholder="All Fuel Types"
        options={FUEL_TYPES.map((f) => ({ value: f, label: f }))}
        className="min-w-[150px]"
      />
      <Select
        label="Year"
        selectSize="sm"
        value={filters.year ?? ''}
        onChange={(e) => onChange({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
        placeholder="All Years"
        options={[2025, 2024, 2023].map((y) => ({ value: y, label: String(y) }))}
        className="min-w-[120px]"
      />
      <Select
        label="Vessel Type"
        selectSize="sm"
        value={filters.vesselType ?? ''}
        onChange={(e) => onChange({ ...filters, vesselType: e.target.value || undefined })}
        placeholder="All Vessel Types"
        options={['Cargo', 'Tanker', 'Bulk Carrier', 'Container'].map((v) => ({ value: v, label: v }))}
        className="min-w-[150px]"
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="self-end"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
