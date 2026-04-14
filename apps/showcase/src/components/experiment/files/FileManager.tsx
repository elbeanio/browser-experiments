import React, { useState } from 'react';
import ToolButton from '../tools/ToolButton';
import ToolSection from '../tools/ToolSection';

export interface FileSaveOptions {
  /** Base filename without extension */
  filename: string;
  /** File extension (default: 'png') */
  extension?: string;
  /** Whether to include timestamp in filename */
  includeTimestamp?: boolean;
  /** Additional metadata to include in file */
  metadata?: Record<string, string>;
}

export interface FileLoadOptions {
  /** Accepted file types (default: 'image/png') */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Whether to validate file before loading */
  validate?: (file: File) => Promise<boolean> | boolean;
}

export interface FileManagerProps {
  /** Callback when file is saved */
  onSave?: (blob: Blob, filename: string) => void;
  /** Callback when file is loaded */
  onLoad?: (data: ArrayBuffer, file: File) => void;
  /** Callback when save/load error occurs */
  onError?: (error: Error) => void;
  /** Save options configuration */
  saveOptions?: FileSaveOptions;
  /** Load options configuration */
  loadOptions?: FileLoadOptions;
  /** Whether save functionality is enabled */
  canSave?: boolean;
  /** Whether load functionality is enabled */
  canLoad?: boolean;
  /** Additional save actions */
  additionalSaveActions?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  /** Whether to show section header */
  showHeader?: boolean;
  /** Section header label */
  headerLabel?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  onSave,
  onLoad,
  onError,
  loadOptions = {
    accept: 'image/png',
  },
  canSave = true,
  canLoad = true,
  additionalSaveActions = [],
  showHeader = true,
  headerLabel = 'File Operations',
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!canSave || !onSave) return;
    
    setIsSaving(true);
    try {
      // This should be implemented by the parent component
      // The parent should provide the data to save
      console.warn('FileManager: handleSave should be implemented by parent with actual data');
    } catch (error) {
      console.error('Failed to save file:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Save failed'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = () => {
    if (!canLoad || !onLoad) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = loadOptions.accept || 'image/png';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        // Validate file size if specified
        if (loadOptions.maxSize && file.size > loadOptions.maxSize) {
          throw new Error(`File too large: ${file.size} bytes (max: ${loadOptions.maxSize} bytes)`);
        }

        // Validate file if validation function provided
        if (loadOptions.validate) {
          const isValid = await loadOptions.validate(file);
          if (!isValid) {
            throw new Error('File validation failed');
          }
        }

        // Read file as ArrayBuffer
        const reader = new FileReader();
        const data = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });

        // Pass data to parent
        onLoad(data, file);
      } catch (error) {
        console.error('Failed to load file:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Load failed'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    input.click();
  };

  const content = (
    <>
      {canSave && (
        <>
          <ToolButton
            icon="💾"
            title="Save current state"
            onClick={handleSave}
            disabled={isSaving}
          />
          {additionalSaveActions.map((action, index) => (
            <ToolButton
              key={index}
              icon={action.icon || '💾'}
              title={action.label}
              onClick={action.onClick}
              disabled={action.disabled || isSaving}
            />
          ))}
        </>
      )}
      
      {canLoad && (
        <ToolButton
          icon="📂"
          title="Load from file"
          onClick={handleLoad}
          disabled={isLoading}
        />
      )}
    </>
  );

  if (!showHeader) {
    return <>{content}</>;
  }

  return (
    <ToolSection label={headerLabel}>
      {content}
    </ToolSection>
  );
};

export default FileManager;