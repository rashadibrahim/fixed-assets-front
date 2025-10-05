import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import apiClient from '../../utils/api';

interface DynamicSearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  apiEndpoint: 'branches' | 'warehouses' | 'categories';
  className?: string;
}

// Custom debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function DynamicSearchableSelect({
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  apiEndpoint,
  className,
}: DynamicSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Debounce search query with 300ms delay (same as Reports.jsx)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // API call function - exact pattern from working CategoryManagement.jsx
  const loadOptions = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const params: any = { per_page: 100 };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      let response;
      switch (apiEndpoint) {
        case 'branches':
          response = await apiClient.getBranches(params);
          break;
        case 'warehouses':
          response = await apiClient.getWarehouses(params);
          break;
        case 'categories':
          response = await apiClient.getCategories(params);
          break;
        default:
          throw new Error(`Unsupported endpoint: ${apiEndpoint}`);
      }

      // Handle response exactly like CategoryManagement does
      const data = response;
      const items = data?.items || data || [];

      if (!Array.isArray(items)) {
        setOptions([]);
        return;
      }

      const transformedOptions = items.map((item: any) => {
        switch (apiEndpoint) {
          case 'branches':
            return {
              value: item.id.toString(),
              label: item.name_en || item.name_ar || `Branch ${item.id}`
            };
          case 'warehouses':
            return {
              value: item.id.toString(),
              label: item.name_en || item.name_ar || `Warehouse ${item.id}`
            };
          case 'categories':
            return {
              value: item.id.toString(),
              label: item.subcategory || item.category || `Category ${item.id}`
            };
          default:
            return {
              value: item.id.toString(),
              label: item.name || `Item ${item.id}`
            };
        }
      });

      // Add "All" option only when not searching
      if (!searchTerm.trim()) {
        const allOption = {
          value: '',
          label: apiEndpoint === 'branches' ? "All Branches" : 
                 apiEndpoint === 'warehouses' ? "All Warehouses" : 
                 "All Categories"
        };
        setOptions([allOption, ...transformedOptions]);
      } else {
        setOptions(transformedOptions);
      }
    } catch (error) {
      console.error(`Error loading ${apiEndpoint}:`, error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Load initial data when component mounts
  useEffect(() => {
    if (!initialized) {
      loadOptions('');
      setInitialized(true);
    }
  }, [loadOptions, initialized]);

  // Load data when debounced search changes
  useEffect(() => {
    if (initialized) {
      loadOptions(debouncedSearch);
    }
  }, [debouncedSearch, loadOptions, initialized]);

  // Get display label for selected value
  const selectedLabel = useMemo(() => {
    if (!value) return placeholder;
    const selectedOption = options.find(option => option.value === value);
    return selectedOption?.label || placeholder;
  }, [value, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={loading && !initialized}
        >
          <span className="truncate">
            {selectedLabel}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}