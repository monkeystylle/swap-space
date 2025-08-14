/**
 * Webcam Capture Component with MediaPipe Face Detection
 * Captures profile pictures using webcam with face validation
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationFailed, setInitializationFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
      const canvas = canvasRef.current;

      if (
        video &&
        canvas &&
        video.readyState === 4 &&
        faceDetectorRef.current
      ) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        try {
          // Use detectForVideo with timestamp
          const startTimeMs = performance.now();
          const detectionResult = faceDetectorRef.current.detectForVideo(
            video,
            startTimeMs
          );

          // Clear canvas first
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          // Check if face is detected with good confidence
          if (
            detectionResult.detections &&
            detectionResult.detections.length > 0
          ) {
            const validFace = detectionResult.detections.some(
              detection => detection.categories[0].score > 0.7
            );

            setFaceDetected(validFace);

            // Draw face detection boxes
            if (validFace && ctx) {
              // Set up drawing style for face detection boxes
              ctx.strokeStyle = '#00ff00'; // Green color
              ctx.lineWidth = 3;
              ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Semi-transparent green fill

              detectionResult.detections.forEach(detection => {
                if (
                  detection.categories[0].score > 0.7 &&
                  detection.boundingBox
                ) {
                  const bbox = detection.boundingBox;
                  const x = bbox.originX * canvas.width;
                  const y = bbox.originY * canvas.height;
                  const width = bbox.width * canvas.width;
                  const height = bbox.height * canvas.height;

                  // Draw filled rectangle for better visibility
                  ctx.fillRect(x, y, width, height);
                  ctx.strokeRect(x, y, width, height);

                  // Add confidence score text
                  ctx.fillStyle = '#00ff00';
                  ctx.font = '14px Arial';
                  ctx.fillText(
                    `Face: ${Math.round(detection.categories[0].score * 100)}%`,
                    x,
                    y - 5
                  );
                  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Reset fill style
                }
              });
            }
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
  }, []);

  if (capturedImage) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Preview</h3>
              <p className="text-sm text-muted-foreground">
                Is this photo okay for your profile?
              </p>
            </div>

            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured profile"
                className="w-full h-64 object-cover rounded-lg border"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={retakePhoto}
                disabled={isUploading}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                type="button"
                onClick={confirmCapture}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
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

          {/* Status and Instructions */}
          <div className="text-center space-y-2">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Loading face detection...
                </p>
              </div>
            )}

            {/* Initialization Failed */}
            {initializationFailed && !isLoading && (
              <div className="space-y-3">
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

            {/* Normal Instructions (only show when face detection is working) */}
            {isInitialized && !initializationFailed && !isLoading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Position your face within the camera frame
                </p>
                {!faceDetected && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Please center your face in the camera view
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Webcam Area */}
          <div className="relative">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
              />

              {/* Overlay canvas for face detection visualization */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ mixBlendMode: 'normal' }}
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

          {/* Capture Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={!faceDetected || initializationFailed || isLoading}
              size="lg"
              className="px-8"
            >
              <Camera className="mr-2 h-5 w-5" />
              {isLoading
                ? 'Loading...'
                : initializationFailed
                  ? 'Face Detection Failed'
                  : faceDetected
                    ? 'Take Photo'
                    : 'Position Face to Take Photo'}
            </Button>
          </div>

          {/* Additional context messages */}
          {faceDetected && isInitialized && !initializationFailed && (
            <p className="text-center text-sm text-green-600 dark:text-green-400">
              ✓ Face detected! You can now take your photo
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
