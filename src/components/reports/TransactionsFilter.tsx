
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionsFilterProps {
  startDate: string;
  endDate: string;
  reportType: 'sales' | 'purchases' | 'all';
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReportTypeChange: (type: 'sales' | 'purchases' | 'all') => void;
}

const TransactionsFilter: React.FC<TransactionsFilterProps> = ({
  startDate,
  endDate,
  reportType,
  onStartDateChange,
  onEndDateChange,
  onReportTypeChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label htmlFor="start-date">Start Date</Label>
        <div className="mt-1">
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="end-date">End Date</Label>
        <div className="mt-1">
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="report-type">Report Type</Label>
        <Select value={reportType} onValueChange={(value: any) => onReportTypeChange(value)}>
          <SelectTrigger id="report-type" className="mt-1">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="sales">Sales Only</SelectItem>
            <SelectItem value="purchases">Purchases Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TransactionsFilter;
