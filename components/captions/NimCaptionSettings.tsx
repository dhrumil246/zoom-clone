// components/captions/NimCaptionSettings.tsx
'use client';

import React from 'react';
import { NimCaptionSettings } from '@/lib/captions/nvidia-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';

interface NimCaptionSettingsProps {
  settings: NimCaptionSettings;
  onSettingsChange: (settings: Partial<NimCaptionSettings>) => void;
  onGenerateSummary: () => Promise<void>;
  onExtractActionItems: () => Promise<void>;
  isProcessing: boolean;
  hasTranscript: boolean;
}

export function NimCaptionSettingsPanel({
  settings,
  onSettingsChange,
  onGenerateSummary,
  onExtractActionItems,
  isProcessing,
  hasTranscript,
}: NimCaptionSettingsProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-green-500">⚡</span>
          NVIDIA AI Settings
        </CardTitle>
        <CardDescription>
          Enhance your captions with NVIDIA NIM AI services
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AI Enhancement Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Caption Enhancement</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-nim" className="text-sm">
              Enable AI Enhancement
            </Label>
            <Switch
              id="enable-nim"
              checked={settings.enableNvidiaEnhancement}
              onCheckedChange={(checked: boolean) =>
                onSettingsChange({ enableNvidiaEnhancement: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enhance-final" className="text-sm">
              Enhance Only Final Captions
            </Label>
            <Switch
              id="enhance-final"
              checked={settings.enhanceOnlyFinalCaptions}
              onCheckedChange={(checked: boolean) =>
                onSettingsChange({ enhanceOnlyFinalCaptions: checked })
              }
              disabled={!settings.enableNvidiaEnhancement}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="context-aware" className="text-sm">
              Context-Aware Enhancement
            </Label>
            <Switch
              id="context-aware"
              checked={settings.useContextAwareness}
              onCheckedChange={(checked: boolean) =>
                onSettingsChange({ useContextAwareness: checked })
              }
              disabled={!settings.enableNvidiaEnhancement}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence-threshold" className="text-sm">
              Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%
            </Label>
            <Slider
              id="confidence-threshold"
              min={0.1}
              max={1.0}
              step={0.1}
              value={[settings.confidenceThreshold]}
              onValueChange={([value]: number[]) =>
                onSettingsChange({ confidenceThreshold: value })
              }
              disabled={!settings.enableNvidiaEnhancement}
              className="w-full"
            />
          </div>
        </div>

        <Separator />

        {/* Auto-Processing Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Auto-Processing</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-summary" className="text-sm">
              Auto-Generate Summary
            </Label>
            <Switch
              id="auto-summary"
              checked={settings.autoGenerateSummary}
              onCheckedChange={(checked: boolean) =>
                onSettingsChange({ autoGenerateSummary: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-actions" className="text-sm">
              Auto-Extract Action Items
            </Label>
            <Switch
              id="auto-actions"
              checked={settings.extractActionItems}
              onCheckedChange={(checked: boolean) =>
                onSettingsChange({ extractActionItems: checked })
              }
            />
          </div>
        </div>

        <Separator />

        {/* Manual Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Manual Actions</h4>
          
          <Button
            onClick={onGenerateSummary}
            disabled={!hasTranscript || isProcessing}
            className="w-full"
            variant="outline"
          >
            {isProcessing ? 'Generating...' : 'Generate Meeting Summary'}
          </Button>

          <Button
            onClick={onExtractActionItems}
            disabled={!hasTranscript || isProcessing}
            className="w-full"
            variant="outline"
          >
            {isProcessing ? 'Extracting...' : 'Extract Action Items'}
          </Button>
        </div>

        {/* Status */}
        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Processing with NVIDIA AI...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}