import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

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
      if (isMountedRef.current) {
        setOptions(staticOptions);
        setIsInitialized(true);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
      }
      
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
        default:
          console.warn(`Unknown API endpoint: ${apiEndpoint}`);
          return;
      }

      if (!isMountedRef.current) return;

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

      if (isMountedRef.current) {
        setOptions(allOptions);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error(`Error loading ${apiEndpoint}:`, error);
      // Keep existing options on error instead of clearing them
      if (isMountedRef.current) {
        setIsInitialized(true);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiEndpoint, transformer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Load initial options when component mounts or when popover opens for the first time
  useEffect(() => {
    if (!isInitialized && (open || apiEndpoint === 'static')) {
      loadOptions();
    }
  }, [isInitialized, apiEndpoint, open, loadOptions]);

  // Debounced search - only when popover is open and search query changes
  useEffect(() => {
    if (!open || !isInitialized || !isMountedRef.current) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't make the same search query twice
    if (searchQuery === lastSearchQuery) return;

    // If search query is empty, load options immediately
    if (!searchQuery.trim()) {
      setLastSearchQuery('');
      loadOptions('');
      return;
    }

    // Otherwise, debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      if (open && isMountedRef.current) { // Double check the popover is still open and component is mounted
        setLastSearchQuery(searchQuery);
        loadOptions(searchQuery);
      }
    }, 300); // Reduced debounce time for better responsiveness

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, open, isInitialized, lastSearchQuery, loadOptions]);

  // Clear search only when popover closes and user is not actively searching
  useEffect(() => {
    if (!open && searchQuery && !loading && isMountedRef.current) {
      // Add a small delay to prevent clearing during active search
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          setSearchQuery('');
          setLastSearchQuery('');
        }
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [open, searchQuery, loading]);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [options, value]);

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      if (isMountedRef.current) {
        setOpen(newOpen);
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={(value) => {
              if (isMountedRef.current) {
                setSearchQuery(value);
              }
            }}
            disabled={loading}
            autoFocus={open}
            onKeyDown={(e) => {
              // Prevent the popover from closing on certain keys
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
              }
            }}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
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
                    if (isMountedRef.current) {
                      onValueChange?.(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }
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