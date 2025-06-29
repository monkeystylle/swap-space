/**
 * Custom hook for handling image preview functionality
 * Manages file selection, preview URL generation, and cleanup
 */

'use client';

import { useState, useCallback, useRef } from 'react';

interface UseImagePreviewReturn {
  // State
  selectedFile: File | null;
  previewUrl: string | null;

  // Actions
  handleFileSelect: (file: File) => void;
  clearImage: () => void;

  // Refs for file input
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  triggerFileSelect: () => void;
}

export const useImagePreview = (): UseImagePreviewReturn => {
  // State for selected file and preview URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection and generate preview
  const handleFileSelect = useCallback(
    (file: File) => {
      // Cleanup previous preview URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Validate file type (only images)
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('Image must be less than 10MB');
        return;
      }

      // Create preview URL and update state
      const newPreviewUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(newPreviewUrl);
    },
    [previewUrl]
  );

  // Clear selected image and cleanup preview URL
  const clearImage = useCallback(() => {
    // Cleanup preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Reset state
    setSelectedFile(null);
    setPreviewUrl(null);

    // Clear file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  // Trigger the hidden file input click
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Cleanup preview URL when component unmounts
  // This is handled by the component using this hook with useEffect

  return {
    // State
    selectedFile,
    previewUrl,

    // Actions
    handleFileSelect,
    clearImage,

    // File input utilities
    fileInputRef,
    triggerFileSelect,
  };
};
