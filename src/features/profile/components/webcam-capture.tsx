/**
 * Webcam Capture Component with MediaPipe Face Detection
 * Captures profile pictures using webcam with face validation
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// MediaPipe Tasks Vision API
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

// MediaPipe Detection types are provided by the library
// No need for custom interface - using Detection directly

interface WebcamCaptureProps {
  onCapture: (imageFile: File) => void;
  onClose: () => void;
  isUploading?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  onClose,
  isUploading = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationFailed, setInitializationFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetaking, setIsRetaking] = useState(false);

  // Video constraints for better face detection
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  // Retry face detection initialization
  const retryInitialization = useCallback(() => {
    setError('');
    setInitializationFailed(false);
    setIsInitialized(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
  }, []);

  // Initialize MediaPipe Face Detection
  useEffect(() => {
    const initializeFaceDetection = async () => {
      setIsLoading(true);

      try {
        // Initialize MediaPipe Vision Tasks
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );

        // Create FaceDetector instance
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        });

        faceDetectorRef.current = faceDetector;
        setIsInitialized(true);
        setInitializationFailed(false);
        setIsLoading(false);
        setError('');
      } catch (err) {
        console.error('Failed to initialize face detection:', err);
        const errorMessage =
          retryCount < 2
            ? 'Face detection failed to load. This may be due to network issues.'
            : 'Face detection initialization failed after multiple attempts. Please check your internet connection.';

        setError(errorMessage);
        setInitializationFailed(true);
        setIsInitialized(false);
        setIsLoading(false);
      }
    };

    initializeFaceDetection();

    return () => {
      // Clean up animation frame and face detector
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (faceDetectorRef.current) {
        faceDetectorRef.current.close();
      }
    };
  }, [retryCount]);

  // Process webcam frames for face detection
  useEffect(() => {
    if (!isInitialized || !faceDetectorRef.current) return;

    const processFrame = () => {
      const video = webcamRef.current?.video;

      if (video && video.readyState === 4 && faceDetectorRef.current) {
        try {
          // Use detectForVideo with timestamp
          const startTimeMs = performance.now();
          const detectionResult = faceDetectorRef.current.detectForVideo(
            video,
            startTimeMs
          );

          // Check if face is detected with good confidence
          if (
            detectionResult.detections &&
            detectionResult.detections.length > 0
          ) {
            const validFace = detectionResult.detections.some(
              detection => detection.categories[0].score > 0.8
            );

            setFaceDetected(validFace);

            // Face detection visual overlay removed for cleaner UX
            // Face detection still works - feedback provided by indicator only
          } else {
            setFaceDetected(false);
          }
        } catch (error) {
          console.error('Face detection error:', error);
          // Don't set face as detected on error
          setFaceDetected(false);
        }
      }

      // Schedule next frame
      animationIdRef.current = requestAnimationFrame(processFrame);
    };

    // Start processing frames
    animationIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitialized]);

  // Capture photo from webcam function
  //Uses react-webcam's built-in screenshot feature
  const capturePhoto = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;

    const imageSrc = webcam.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, []);

  // Confirm captured image and convert to file
  const confirmCapture = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create file from blob
      const file = new File([blob], `profile-picture-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      onCapture(file);
    } catch (err) {
      console.error('Failed to convert captured image:', err);
      setError('Failed to process captured image. Please try again.');
    }
  }, [capturedImage, onCapture]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setFaceDetected(false);
    setIsRetaking(true);

    // Reset retaking state after a short delay to allow camera to settle
    setTimeout(() => {
      setIsRetaking(false);
    }, 1000);
  }, []);

  if (capturedImage) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header - Same height as webcam UI header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Instructions area - Same height as webcam UI status area */}
              <div className="text-center">
                <div className="h-16 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Is this photo okay for your profile?
                  </p>
                </div>
              </div>

              {/* Image - Same aspect ratio as webcam */}
              <div className="relative">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedImage}
                    alt="Captured profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Button area - Same structure as webcam UI */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={isUploading}
                  className="flex-1"
                  size="lg"
                >
                  Retake
                </Button>
                <Button
                  type="button"
                  onClick={confirmCapture}
                  disabled={isUploading}
                  className="flex-1"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Use This Photo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header - Same as preview UI */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Take Profile Picture</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Status and Instructions - Fixed height to prevent layout shift */}
            <div className="text-center">
              <div className="h-16 flex items-center justify-center">
                {/* Loading State (initialization or retaking) */}
                {(isLoading || isRetaking) && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {isRetaking
                        ? 'Preparing camera...'
                        : 'Loading face detection...'}
                    </p>
                  </div>
                )}

                {/* Initialization Failed */}
                {initializationFailed && !isLoading && !isRetaking && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <div className="text-sm text-red-600 dark:text-red-400">
                        <p className="font-medium">Face Detection Failed</p>
                        <p>{error}</p>
                      </div>
                    </div>
                    {retryCount < 2 && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryInitialization}
                          className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions when camera is ready and no face detected */}
                {isInitialized &&
                  !initializationFailed &&
                  !isLoading &&
                  !isRetaking &&
                  !faceDetected && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Please position your face in the camera view
                    </p>
                  )}
              </div>
            </div>

            {/* Webcam Area - Same structure as preview image */}
            <div className="relative">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />

                {/* Face detection indicator */}
                <div className="absolute top-2 right-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      faceDetected
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {faceDetected ? 'Face Detected' : 'No Face Detected'}
                  </div>
                </div>
              </div>
            </div>

            {/* Capture Button - Same structure as preview buttons to prevent layout shift */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={
                  !faceDetected ||
                  initializationFailed ||
                  isLoading ||
                  isRetaking
                }
                size="lg"
                className="w-full cursor-pointer"
              >
                <Camera className="mr-2 h-5 w-5" />
                {isLoading || isRetaking
                  ? 'Loading...'
                  : initializationFailed
                    ? 'Face Detection Failed'
                    : faceDetected
                      ? 'Take Photo'
                      : 'Take Photo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
