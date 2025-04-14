
import React from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Party } from '@/lib/storage';

interface PartyLedgerFilterProps {
  parties: Party[];
  selectedPartyId: string;
  onPartyChange: (partyId: string) => void;
}

const PartyLedgerFilter: React.FC<PartyLedgerFilterProps> = ({
  parties,
  selectedPartyId,
  onPartyChange
}) => {
  return (
    <div className="flex items-center">
      <div className="relative flex-1 max-w-md">
        <Label htmlFor="party-select">Select Party</Label>
        <Select value={selectedPartyId} onValueChange={onPartyChange}>
          <SelectTrigger id="party-select" className="mt-1">
            <SelectValue placeholder="Select a party" />
          </SelectTrigger>
          <SelectContent>
            {parties.length === 0 ? (
              <SelectItem value="no-parties" disabled>
                No parties available
              </SelectItem>
            ) : (
              parties.map(party => (
                <SelectItem key={party.id} value={party.id}>
                  {party.name} ({party.type})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PartyLedgerFilter;
