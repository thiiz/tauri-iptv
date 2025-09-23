'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category } from '@/types/iptv';
import { Grid3X3, List, Play, Search } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface EmptyState {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface ContentViewProps<T> {
  title: string;
  searchPlaceholder: string;
  emptyState: EmptyState;
  categories: Category[];
  items: T[];
  loadCategories: () => Promise<void>;
  loadItems: (category?: string | null) => Promise<void>;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  renderItem: (item: T, viewMode: 'grid' | 'list') => React.ReactNode;
  handleAction: (item: T) => void;
  actionLabel: string;
  contentDownloaded: boolean;
  isChannelView?: boolean;
}

function ContentViewComponent<T extends { id: number | string; name: string }>({
  title,
  searchPlaceholder,
  emptyState,
  categories,
  items,
  loadCategories,
  loadItems,
  selectedCategory,
  setSelectedCategory,
  renderItem,
  handleAction,
  actionLabel,
  contentDownloaded,
  isChannelView = false
}: ContentViewProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [items, searchQuery]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadCategories();
      await loadItems(selectedCategory);
    } catch (error) {
      toast.error(`Failed to load ${title.toLowerCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, loadCategories, loadItems, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      setSelectedCategory(value === 'all' ? null : value);
    },
    [setSelectedCategory]
  );

  const EmptyStateIcon = emptyState.icon;

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
            <p className='text-muted-foreground'>
              {filteredItems.length} {title.toLowerCase()} available
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className='h-4 w-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <List className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className='mt-4 flex gap-4'>
          <div className='relative max-w-sm flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8'
            />
          </div>

          <Select
            value={selectedCategory || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Categoria' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className='flex-1'>
        <div className='p-6'>
          {isLoading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'space-y-2'
              }
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <Card
                  key={i}
                  className={`group cursor-pointer transition-all hover:shadow-md ${
                    isChannelView && viewMode === 'list' ? 'flex-row' : ''
                  }`}
                >
                  <CardContent
                    className={`p-4 ${isChannelView && viewMode === 'list' ? 'flex w-full items-center gap-4' : ''}`}
                  >
                    <div
                      className={`${isChannelView && viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}
                    >
                      <Skeleton
                        className={`rounded object-cover ${
                          isChannelView && viewMode === 'list'
                            ? 'h-12 w-12'
                            : 'mx-auto h-16 w-16'
                        }`}
                      />
                    </div>
                    <div
                      className={`${isChannelView && viewMode === 'list' ? 'min-w-0 flex-1' : 'text-center'}`}
                    >
                      <Skeleton
                        className={`font-semibold ${isChannelView && viewMode === 'list' ? 'h-4 w-32' : 'mx-auto mb-1 h-4 w-3/4'}`}
                      />
                      <div className='mt-1 flex items-center gap-2'>
                        <Skeleton className='h-3 w-16' />
                        <Skeleton className='h-3 w-12' />
                      </div>
                    </div>
                    <div
                      className={`flex gap-2 ${
                        isChannelView && viewMode === 'list'
                          ? 'flex-shrink-0'
                          : 'mt-3 justify-center'
                      }`}
                    >
                      <Skeleton className='h-8 flex-1' />
                      <Skeleton className='h-8 w-8' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='py-12 text-center'>
              <EmptyStateIcon className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>
                {searchQuery
                  ? `No ${title.toLowerCase()} found`
                  : `No ${title.toLowerCase()} available`}
              </h3>
              <p className='text-muted-foreground'>
                {searchQuery
                  ? 'Try adjusting your search'
                  : `Download content from the home page to view ${title.toLowerCase()}`}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'space-y-2'
              }
            >
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={`group cursor-pointer transition-all hover:shadow-md ${
                    isChannelView && viewMode === 'list' ? 'flex-row' : ''
                  }`}
                >
                  <CardContent
                    className={`p-4 ${isChannelView && viewMode === 'list' ? 'flex w-full items-center gap-4' : ''}`}
                  >
                    {renderItem(item, viewMode)}
                    {/* Actions */}
                    <div
                      className={`flex gap-2 ${
                        isChannelView && viewMode === 'list'
                          ? 'flex-shrink-0'
                          : 'mt-3 justify-center'
                      }`}
                    >
                      <Button
                        size='sm'
                        onClick={() => handleAction(item)}
                        className='flex-1'
                      >
                        <Play className='mr-1 h-4 w-4' />
                        {isChannelView && viewMode === 'grid'
                          ? ''
                          : actionLabel}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export const ContentView = React.memo(ContentViewComponent) as <
  T extends { id: number | string; name: string }
>(
  props: ContentViewProps<T>
) => React.ReactElement;
