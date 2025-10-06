import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Check, ChevronDown, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import apiClient from '../../utils/api';

interface DynamicSearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  apiEndpoint: 'branches' | 'warehouses' | 'categories' | 'static';
  staticOptions?: Array<{
    value: string;
    label: string;
  }>;
  transformData?: (data: any) => { value: string; label: string };
}

export function DynamicSearchableSelect({
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  apiEndpoint,
  staticOptions = [],
  transformData,
}: DynamicSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState(staticOptions);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Default transformers for different endpoints
  const defaultTransformers = {
    branches: (item: any) => ({
      value: item.id.toString(),
      label: item.name_en || item.name_ar || `Branch ${item.id}`
    }),
    warehouses: (item: any) => ({
      value: item.id.toString(),
      label: item.name_en || item.name_ar || `Warehouse ${item.id}`
    }),
    categories: (item: any) => ({
      value: item.id.toString(),
      label: item.category || item.subcategory || `Category ${item.id}`
    })
  };

  const transformer = transformData || defaultTransformers[apiEndpoint];

  const loadOptions = useCallback(async (search: string = '') => {
    if (apiEndpoint === 'static') {
      setOptions(staticOptions);
      setIsInitialized(true);
      return;
    }

    try {
      setLoading(true);
      let response;
      const params: any = { per_page: 100 };
      
      if (search.trim()) {
        params.search = search.trim();
      }

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
      }

      const items = response?.items || response || [];
      const transformedOptions: Array<{value: string; label: string}> = Array.isArray(items) 
        ? items.map(transformer).filter((item): item is {value: string; label: string} => 
            item && typeof item === 'object' && 'value' in item && 'label' in item)
        : [];

      // Always include "All" option at the beginning if no search query
      const allOptions: Array<{value: string; label: string}> = !search.trim() && apiEndpoint !== 'categories' 
        ? [{ 
            value: "", 
            label: apiEndpoint === 'branches' ? "All Branches" : "All Warehouses" 
          }, ...transformedOptions]
        : transformedOptions;

      setOptions(allOptions);
      setIsInitialized(true);
    } catch (error) {
      console.error(`Error loading ${apiEndpoint}:`, error);
      // Keep existing options on error instead of clearing them
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, transformer]);

  // Load initial options when component mounts
  useEffect(() => {
    if (!isInitialized) {
      loadOptions();
    }
  }, []);

  // Debounced search - only when popover is open and search query changes
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      loadOptions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open]);

  // Clear search when popover closes
  useEffect(() => {
    if (!open && searchQuery) {
      setSearchQuery('');
    }
  }, [open]);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              emptyText
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {loading && options.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              options.map((option) => (
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
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}