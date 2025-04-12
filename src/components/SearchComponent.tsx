
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, User, FileText, Package, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type SearchResult = {
  id: string;
  type: 'party' | 'invoice' | 'product';
  title: string;
  subtitle: string;
  path: string;
};

const SearchComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { parties, invoices, products } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter results based on the search query
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search parties
    parties.forEach((party) => {
      if (
        party.name.toLowerCase().includes(lowerQuery) ||
        (party.gst && party.gst.toLowerCase().includes(lowerQuery)) ||
        party.mobile.includes(lowerQuery)
      ) {
        searchResults.push({
          id: party.id,
          type: 'party',
          title: party.name,
          subtitle: `${party.type.charAt(0).toUpperCase() + party.type.slice(1)} • ${party.mobile}`,
          path: `/parties?highlight=${party.id}`,
        });
      }
    });

    // Search invoices
    invoices.forEach((invoice) => {
      const party = parties.find((p) => p.id === invoice.partyId);
      if (
        invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
        (party && party.name.toLowerCase().includes(lowerQuery)) ||
        invoice.date.includes(lowerQuery) ||
        invoice.status.includes(lowerQuery)
      ) {
        const partyName = party ? party.name : 'Unknown Party';
        const invoiceType = party?.type === 'supplier' ? 'Purchase' : 'Sales';
        searchResults.push({
          id: invoice.id,
          type: 'invoice',
          title: `${invoiceType} Invoice: ${invoice.invoiceNumber}`,
          subtitle: `${partyName} • ₹${invoice.total.toLocaleString('en-IN')} • ${invoice.status}`,
          path: `/invoices/${invoice.id}`,
        });
      }
    });

    // Search products
    products.forEach((product) => {
      if (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: product.id,
          type: 'product',
          title: product.name,
          subtitle: `₹${product.price.toLocaleString('en-IN')} ${product.unit ? `per ${product.unit}` : ''}`,
          path: `/products?highlight=${product.id}`,
        });
      }
    });

    setResults(searchResults);
  }, [query, parties, invoices, products]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.path);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'party':
        return <User className="h-4 w-4 mr-2" />;
      case 'invoice':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'product':
        return <Package className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <>
      <div className="relative w-full max-w-md" onClick={handleInputClick}>
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          ref={inputRef}
          type="search"
          placeholder="Search... (Press / or Ctrl+K)"
          className="pl-10 bg-gray-50 border-gray-200"
          onClick={handleInputClick}
          readOnly
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
          ⌘K
        </div>
      </div>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Search parties, invoices, products..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <>
              {results.some(result => result.type === 'party') && (
                <CommandGroup heading="Parties">
                  {results
                    .filter(result => result.type === 'party')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                        </div>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
              
              {results.some(result => result.type === 'invoice') && (
                <CommandGroup heading="Invoices">
                  {results
                    .filter(result => result.type === 'invoice')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                      >
                        {result.title.includes('Purchase') ? 
                          <Receipt className="h-4 w-4 mr-2" /> : 
                          <FileText className="h-4 w-4 mr-2" />
                        }
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                        </div>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
              
              {results.some(result => result.type === 'product') && (
                <CommandGroup heading="Products">
                  {results
                    .filter(result => result.type === 'product')
                    .map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                        </div>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchComponent;
