
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedParty = parties.find(party => party.id === selectedPartyId);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1 max-w-md space-y-1">
        <Label htmlFor="party-select">Select Party</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={open} 
              className="w-full justify-between"
            >
              {selectedParty ? selectedParty.name : "Select a party..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search party..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No party found.</CommandEmpty>
                <CommandGroup>
                  {parties
                    .filter(party => 
                      party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      party.mobile.includes(searchQuery) ||
                      (party.gst && party.gst.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map(party => (
                      <CommandItem
                        key={party.id}
                        value={party.id}
                        onSelect={(value) => {
                          onPartyChange(value);
                          setOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <span>{party.name}</span>
                        <span className="ml-2 text-muted-foreground">({party.type})</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default PartyLedgerFilter;
