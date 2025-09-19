// components/captions/CaptionModeToggle.tsx
'use client';

import { useState } from 'react';
import { Sparkles, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CaptionModeToggleProps {
  currentMode: 'standard' | 'ai';
  onModeChange: (mode: 'standard' | 'ai') => void;
  disabled?: boolean;
}

export default function CaptionModeToggle({
  currentMode,
  onModeChange,
  disabled = false,
}: CaptionModeToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled}
          className={cn(
            "rounded-2xl px-4 py-2 flex items-center gap-2",
            currentMode === 'ai' 
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
              : "bg-[#19232d] hover:bg-[#4c535b]"
          )}
          title="Select Caption Mode"
        >
          {currentMode === 'ai' ? (
            <>
              <Sparkles size={16} className="text-white" />
              <span className="text-xs font-medium">AI</span>
            </>
          ) : (
            <>
              <Mic size={16} className="text-white" />
              <span className="text-xs font-medium">CC</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white min-w-[200px]">
        <DropdownMenuItem
          onClick={() => onModeChange('standard')}
          className={cn(
            "cursor-pointer flex items-center gap-3 p-3",
            currentMode === 'standard' && "bg-[#4c535b]"
          )}
        >
          <Mic size={16} />
          <div className="flex flex-col">
            <span className="font-medium">Standard Captions</span>
            <span className="text-xs text-gray-400">
              Basic speech recognition
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onModeChange('ai')}
          className={cn(
            "cursor-pointer flex items-center gap-3 p-3",
            currentMode === 'ai' && "bg-[#4c535b]"
          )}
        >
          <Sparkles size={16} className="text-yellow-400" />
          <div className="flex flex-col">
            <span className="font-medium">NVIDIA AI Captions</span>
            <span className="text-xs text-gray-400">
              Enhanced with AI processing
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}