import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Client } from '../types';
import './Filters.css';

interface FiltersProps {
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    clientId: string;
    taxYear: number;
  };
  clients: Client[];
  onFilterChange: (filters: any) => void;
}

function Filters({ filters, clients, onFilterChange }: FiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="filters">
      <button
        className="filters-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▼' : '►'} Filters
      </button>

      {expanded && (
        <div className="filters-content">
          <div className="filter-group">
            <label>Start Date:</label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => onFilterChange({ startDate: date })}
              selectsStart
              startDate={filters.startDate}
              endDate={filters.endDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select start date"
              isClearable
            />
          </div>

          <div className="filter-group">
            <label>End Date:</label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => onFilterChange({ endDate: date })}
              selectsEnd
              startDate={filters.startDate}
              endDate={filters.endDate}
              minDate={filters.startDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select end date"
              isClearable
            />
          </div>

          <div className="filter-group">
            <label>Client:</label>
            <select
              value={filters.clientId}
              onChange={(e) => onFilterChange({ clientId: e.target.value })}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tax Year:</label>
            <select
              value={filters.taxYear}
              onChange={(e) => onFilterChange({ taxYear: parseInt(e.target.value) })}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            className="clear-filters"
            onClick={() =>
              onFilterChange({
                startDate: null,
                endDate: null,
                clientId: '',
                taxYear: currentYear,
              })
            }
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default Filters;
