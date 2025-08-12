/**
 * Webcam Capture Component with MediaPipe Face Detection
 * Captures profile pictures using webcam with face validation
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, Check } from 'lucide-react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// MediaPipe imports
import { FaceDetection } from '@mediapipe/face_detection';

interface WebcamCaptureProps {
  onCapture: (imageFile: File) => void;
  onClose: () => void;
  isUploading?: boolean;
}

// MediaPipe Face Detection result types
// Using unknown to avoid type conflicts with MediaPipe's own types

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  onClose,
  isUploading = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectionRef = useRef<FaceDetection | null>(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Video constraints for better face detection
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  // Initialize MediaPipe Face Detection
  useEffect(() => {
    const initializeFaceDetection = async () => {
      try {
        const faceDetection = new FaceDetection({
          locateFile: file => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
          },
        });

        await faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5,
        });

        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5,
        });

        faceDetection.onResults((results: unknown) => {
          const canvas = canvasRef.current;
          const res = results as {
            detections?: Array<{
              score: number;
              locationData: {
                relativeBoundingBox: {
                  xMin: number;
                  yMin: number;
                  width: number;
                  height: number;
                };
              };
            }>;
          };

          if (canvas && res.detections) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Clear canvas
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              // Check if face is detected with good confidence
              const validFace = res.detections.some(
                detection => detection.score > 0.7
              );

              setFaceDetected(validFace);

              // Draw face detection boxes (optional - for debugging)
              if (validFace) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 3;

                res.detections.forEach(detection => {
                  if (detection.score > 0.7) {
                    const bbox = detection.locationData.relativeBoundingBox;
                    ctx.strokeRect(
                      bbox.xMin * canvas.width,
                      bbox.yMin * canvas.height,
                      bbox.width * canvas.width,
                      bbox.height * canvas.height
                    );
                  }
                });
              }
            }
          } else {
            setFaceDetected(false);
          }
        });

        faceDetectionRef.current = faceDetection;
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize face detection:', err);
        setError(
          'Failed to initialize face detection. You can still capture without face validation.'
        );
        setIsInitialized(true); // Allow capture even if face detection fails
      }
    };

    initializeFaceDetection();

    return () => {
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close();
      }
      // Note: cameraRef cleanup removed to fix React hooks warning
    };
  }, []);

  // Process webcam frames for face detection
  useEffect(() => {
    if (!isInitialized || !faceDetectionRef.current) return;

    const processFrame = () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === 4) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Send frame to MediaPipe
        if (faceDetectionRef.current) {
          faceDetectionRef.current.send({ image: video });
        }
      }
    };

    // Process frames at regular intervals
    const intervalId = setInterval(processFrame, 100); // 10 FPS

    return () => clearInterval(intervalId);
  }, [isInitialized]);

  // Capture photo from webcam
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

          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Position your face within the camera frame
            </p>
            {error && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {error}
              </p>
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
                style={{ mixBlendMode: 'multiply' }}
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
              disabled={!faceDetected && !error}
              size="lg"
              className="px-8"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
          </div>

          {!faceDetected && !error && (
            <p className="text-center text-sm text-muted-foreground">
              Please position your face in the camera to enable capture
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
