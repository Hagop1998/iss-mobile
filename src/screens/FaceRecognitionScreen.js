import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { apiService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { imageSizeEnum, entityTypeEnum } from '../constants/enums';

const FaceRecognitionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { service } = route?.params || {};
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [recognitionStatus, setRecognitionStatus] = useState('idle'); // idle, scanning, analyzing, success, failed
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [mountError, setMountError] = useState(null);
  const isFocused = useIsFocused();
  
  // Get logged-in user from Redux
  const { user } = useAppSelector(state => state.auth);
  
  // Static values
  const LOCAL_ID = '2136131714170315';
  
  // Animation values
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Request camera permissions
  useEffect(() => {
    (async () => {
      try {
        if (!cameraPermission?.granted) {
          await requestCameraPermission();
        }
      } catch (e) {
        console.error('Error requesting camera permission:', e);
      }
    })();
  }, [cameraPermission, requestCameraPermission]);

  // Camera ready timeout
  useEffect(() => {
    if (isFocused && cameraPermission?.granted) {
      const timeout = setTimeout(() => {
        if (!isCameraReady) {
          console.log('Camera ready timeout - forcing ready state');
          setIsCameraReady(true);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isFocused, cameraPermission, isCameraReady]);

  // Scanning animation
  useEffect(() => {
    if (isScanning) {
      // Scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnimation.setValue(0);
      pulseAnimation.setValue(1);
    }
  }, [isScanning]);

  // Generate random cardSN
  const generateRandomCardSN = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStartScan = () => {
    console.log('👤 Starting face recognition scan...');
    
    // Check if user is logged in
    if (!user?.id) {
      Alert.alert('Error', 'Please login to register your face.');
      navigation.goBack();
      return;
    }

    // Check camera permissions
    if (!cameraPermission?.granted) {
      Alert.alert('Camera Permission Required', 'Please grant camera permission to capture your face.');
      return;
    }

    // Start scanning mode - show camera preview, user can position face
    setIsScanning(true);
    setRecognitionStatus('scanning');
    setScanProgress(0);
  };

  const handleCapturePhoto = async () => {
    try {
      console.log('📸 Capturing photo for face registration...');
      
      // Check if user is logged in
      if (!user?.id) {
        Alert.alert('Error', 'Please login to register your face.');
        navigation.goBack();
        return;
      }

      // Check camera permissions
      if (!cameraPermission?.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera permission to capture your face.');
        return;
      }

      setScanProgress(10);
      setRecognitionStatus('analyzing');

      // Step 1: Capture photo from front camera
      console.log('📸 Capturing photo...');
      console.log('Camera ref:', !!cameraRef.current);
      console.log('Camera ready:', isCameraReady);
      console.log('Camera permission:', cameraPermission?.granted);
      console.log('Is focused:', isFocused);
      
      // Wait a bit to ensure camera is fully ready (only if using CameraView)
      if (cameraRef.current && isCameraReady) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let photo;
      
      // Try to capture from CameraView first
      try {
        if (cameraRef.current && isCameraReady) {
          console.log('📸 Attempting to capture from CameraView...');
          photo = await cameraRef.current.takePictureAsync({
            quality: 0.8,
            skipProcessing: true,
          });
          console.log('📸 Photo captured successfully from CameraView:', photo);
        } else {
          throw new Error('CameraView not ready');
        }
      } catch (captureError) {
        console.warn('📸 CameraView capture failed, trying ImagePicker fallback...', captureError?.message);
        
        // Fallback to ImagePicker (works better in Expo Go on iOS)
        try {
          // Request camera permissions for ImagePicker
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          
          if (status !== 'granted') {
            throw new Error('Camera permission denied');
          }

          console.log('📸 Using ImagePicker to capture photo...');
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            cameraType: ImagePicker.CameraType.front, // Use front camera
          });

          if (result.canceled) {
            throw new Error('Photo capture was cancelled');
          }

          if (!result.assets || result.assets.length === 0) {
            throw new Error('No photo was captured');
          }

          // Convert ImagePicker result to match CameraView format
          photo = {
            uri: result.assets[0].uri,
            width: result.assets[0].width,
            height: result.assets[0].height,
          };
          
          console.log('📸 Photo captured successfully from ImagePicker:', photo);
        } catch (imagePickerError) {
          console.error('📸 ImagePicker capture error:', imagePickerError);
          throw new Error(`Failed to capture photo: ${imagePickerError?.message || 'Please try again'}`);
        }
      }

      if (!photo?.uri) {
        console.error('📸 Photo object received but no URI:', photo);
        throw new Error('Photo captured but no URI returned');
      }

      console.log('✅ Photo captured:', photo.uri);
      console.log('📐 Original photo dimensions:', photo.width, 'x', photo.height);
      setScanProgress(20);
      setRecognitionStatus('analyzing');

      // Step 2: Crop and resize image to focus on face area
      // Crop from center-upper portion to focus on face (not full body)
      const originalWidth = photo.width;
      const originalHeight = photo.height;
      
      // Calculate crop area: focus on upper-center portion (where face is)
      // Crop 60% from top, 20% from each side, 40% from bottom
      const cropX = originalWidth * 0.2; // Start 20% from left
      const cropY = originalHeight * 0.1; // Start 10% from top (focus on upper body/face)
      const cropWidth = originalWidth * 0.6; // Take 60% width (center portion)
      const cropHeight = originalHeight * 0.5; // Take 50% height (upper portion)
      
      console.log('✂️ Cropping image to focus on face area...');
      console.log(`   Crop area: x=${cropX}, y=${cropY}, width=${cropWidth}, height=${cropHeight}`);
      
      let resizedPhoto;
      try {
        // First crop to face area, then resize to 640x480 (backend recommended size)
        resizedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: cropX,
                originY: cropY,
                width: cropWidth,
                height: cropHeight,
              },
            },
            { resize: { width: 800, height: 800 } }, // Backend recommended size
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG, // Ensure JPG format
          }
        );
        
        console.log('✅ Image cropped and resized successfully');
        console.log('📐 Final dimensions:', resizedPhoto.width, 'x', resizedPhoto.height);
        console.log('📁 Final file URI:', resizedPhoto.uri);
      } catch (resizeError) {
        console.error('❌ Error cropping/resizing image on frontend:', resizeError);
        console.error('❌ Resize error details:', JSON.stringify(resizeError, null, 2));
        // Don't fallback - throw error so user knows resize failed
        throw new Error(`Failed to process image: ${resizeError?.message || 'Unknown error'}`);
      }

      setScanProgress(30);
      
      // Step 3: Upload photo to /medias/upload
      console.log('📤 Uploading photo to server...');
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Get file name from URI
      const filename = resizedPhoto.uri.split('/').pop() || 'face.jpg';
      const fileExtension = 'jpg'; // Always JPG format
      
      // Add file to FormData
      formData.append('file', {
        uri: resizedPhoto.uri,
        type: `image/jpeg`,
        name: `face.${fileExtension}`,
      });
      
      // Add source using entityTypeEnum (REG_FACE for face recognition)
      formData.append('source', entityTypeEnum.REG_FACE);

      // Upload file
      const uploadResponse = await apiService.media.upload(formData);
      console.log('📥 Upload response:', uploadResponse);
      
      setScanProgress(60);

      // Extract the response string (could be in different formats)
      let face1String = '';
      if (typeof uploadResponse === 'string') {
        face1String = uploadResponse;
      } else if (uploadResponse?.data) {
        // Handle nested data object
        if (typeof uploadResponse.data === 'string') {
          face1String = uploadResponse.data;
        } else {
          face1String = uploadResponse.data?.imageUrl || 
                       uploadResponse.data?.url || 
                       uploadResponse.data?.file || 
                       uploadResponse.data?.id || 
                       '';
        }
      } else if (uploadResponse?.imageUrl || uploadResponse?.url || uploadResponse?.file || uploadResponse?.id) {
        // Check imageUrl first (most common response format)
        face1String = uploadResponse.imageUrl || 
                      uploadResponse.url || 
                      uploadResponse.file || 
                      uploadResponse.id;
      }

      if (!face1String) {
        console.error('📥 Upload response structure:', JSON.stringify(uploadResponse, null, 2));
        throw new Error('Failed to get file URL from upload response. Response: ' + JSON.stringify(uploadResponse));
      }

      console.log('✅ File uploaded, face1 string:', face1String);
      setScanProgress(70);

      // Step 4: Register face with /middleware/reg_face
      console.log('📝 Registering face...');
      
      // Generate random cardSN
      const cardSN = generateRandomCardSN();
      console.log('🎴 Generated cardSN:', cardSN);

      const regFaceData = {
        localId: LOCAL_ID,
        userId: user.id.toString(),
        cardSN: cardSN,
        face1: face1String,
      };

      console.log('📤 Registering face with data:', {
        ...regFaceData,
        face1: face1String.substring(0, 50) + '...',
      });

      const regFaceResponse = await apiService.middleware.regFace(regFaceData);
      console.log('✅ Face registered successfully:', regFaceResponse);
      
      setScanProgress(100);
        setRecognitionStatus('success');
        setIsScanning(false);
        
        Alert.alert(
        '✅ Face Registered',
        `Your face has been successfully registered!\n\nCard SN: ${cardSN}\nService: ${service || 'Access Control'}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
              console.log('Face registration successful, navigating back...');
                navigation.goBack();
              }
            }
          ]
        );
    } catch (error) {
      console.error('❌ Face registration error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
        setRecognitionStatus('failed');
        setIsScanning(false);
        
      // Extract error message from various possible formats
      let errorMessage = 'Failed to register face. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        // Handle nested message object (e.g., {"size": "size must be one of..."})
        if (typeof error.data.message === 'object') {
          const messages = Object.values(error.data.message).join(', ');
          errorMessage = messages || errorMessage;
        } else {
          errorMessage = error.data.message;
        }
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
        
        Alert.alert(
        '❌ Registration Failed',
        errorMessage,
          [
            { 
              text: 'Try Again', 
              onPress: () => {
                setRecognitionStatus('idle');
                setScanProgress(0);
              }
            },
            { text: 'Cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
  };

  // Permission denied screen
  if (cameraPermission && !cameraPermission.granted) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Recognition</Text>
        <View style={styles.headerSpacer} />
      </View>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <Ionicons name="camera" size={36} color={colors.primary} />
            <Text style={styles.permissionTitle}>Camera permission required</Text>
            <Text style={styles.permissionSubtitle}>
              We need access to your front camera for face recognition.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
              <Text style={styles.permissionButtonText}>Grant permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitleWhite}>Face Recognition</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {Platform.OS === 'ios' && !isCameraReady ? (
          <View style={[StyleSheet.absoluteFill, styles.mockCamera]}>
            <Ionicons name="camera" size={80} color={colors.gray[400]} />
            <Text style={styles.mockCameraText}>Camera Preview</Text>
            <Text style={styles.mockCameraSubtext}>
              {mountError || 'Camera not available in Expo Go on iOS.\nUse Android or build with "npx expo run:ios"'}
            </Text>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing="front"
              onCameraReady={() => {
                console.log('Front camera is ready');
                setIsCameraReady(true);
                setMountError(null);
              }}
              onMountError={(e) => {
                const message = e?.nativeEvent?.message || e?.message || 'Camera failed to mount';
                setMountError(message);
                console.error('Camera mount error:', message, e);
              }}
            />
          </View>
        )}

        {/* Dark Overlay Mask - Only frame area is visible */}
        <View style={styles.overlayMask}>
          {/* Top dark area */}
          <View style={styles.maskTop} />
          {/* Middle section with frame cutout */}
          <View style={styles.maskMiddleRow}>
            <View style={styles.maskLeft} />
            <View style={styles.frameCutout} />
            <View style={styles.maskRight} />
          </View>
          {/* Bottom dark area */}
          <View style={styles.maskBottom} />
      </View>

        {/* Overlay Content */}
        <View style={styles.overlay}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color={colors.white} />
            <Text style={styles.infoBannerTextWhite}>
            {service ? `Access for: ${service}` : 'Face Recognition Access'}
          </Text>
        </View>

          {/* Scan Area with Animation - Centered */}
        <View style={styles.scanArea}>
          <Animated.View 
            style={[
              styles.faceFrame, 
              isScanning && styles.faceFrameActive,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
              {recognitionStatus === 'success' && (
                <Ionicons name="checkmark-circle" size={70} color={colors.green[500]} />
              )}
              {recognitionStatus === 'failed' && (
                <Ionicons name="close-circle" size={70} color={colors.red[500]} />
              )}
          </Animated.View>
          
          {/* Animated Scan Line */}
          {isScanning && (
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanAnimation.interpolate({
                      inputRange: [0, 1],
                        outputRange: [-130, 130],
                    }),
                  }],
                },
              ]} 
            />
          )}
        </View>

          {/* Status Section */}
          <View style={styles.statusSection}>
        {/* Progress Bar */}
        {isScanning && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
            </View>
                <Text style={styles.progressTextWhite}>{scanProgress}%</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
              <Text style={styles.titleWhite}>
            {recognitionStatus === 'scanning' && 'Scanning Face...'}
            {recognitionStatus === 'analyzing' && 'Analyzing...'}
            {recognitionStatus === 'success' && 'Face Recognized!'}
            {recognitionStatus === 'failed' && 'Recognition Failed'}
            {recognitionStatus === 'idle' && 'Position Your Face'}
          </Text>
              <Text style={styles.subtitleWhite}>
            {recognitionStatus === 'scanning' && 'Capturing facial features...'}
            {recognitionStatus === 'analyzing' && 'Matching with database...'}
            {recognitionStatus === 'success' && 'Access granted successfully'}
            {recognitionStatus === 'failed' && 'Please try again'}
                {recognitionStatus === 'idle' && 'Center your face within the frame'}
          </Text>
          </View>
        </View>

        {/* Action Button */}
          {!isScanning || recognitionStatus === 'idle' ? (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleStartScan}
            >
              <Ionicons 
                name="scan" 
                size={20} 
                color={colors.white} 
                style={styles.buttonIcon}
              />
              <Text style={styles.scanButtonText}>Start Face Scan</Text>
            </TouchableOpacity>
          ) : recognitionStatus === 'scanning' ? (
            <TouchableOpacity
              style={[styles.scanButton, styles.captureButton]}
              onPress={handleCapturePhoto}
              disabled={recognitionStatus === 'analyzing'}
            >
              <Ionicons 
                name="camera" 
                size={20} 
                color={colors.white} 
                style={styles.buttonIcon}
              />
              <Text style={styles.scanButtonText}>Capture Photo</Text>
            </TouchableOpacity>
          ) : (
        <TouchableOpacity
          style={[
            styles.scanButton, 
            recognitionStatus === 'success' && styles.scanButtonSuccess,
                recognitionStatus === 'failed' && styles.scanButtonFailed,
                (recognitionStatus === 'analyzing') && styles.scanButtonActive
          ]}
              disabled={true}
        >
          <Ionicons 
            name={
              recognitionStatus === 'success' ? 'checkmark' :
              recognitionStatus === 'failed' ? 'close' :
                  'hourglass'
            } 
            size={20} 
            color={colors.white} 
            style={styles.buttonIcon}
          />
          <Text style={styles.scanButtonText}>
                {recognitionStatus === 'success' ? 'Registered!' :
                 recognitionStatus === 'failed' ? 'Failed' :
                 'Processing...'}
          </Text>
        </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerTitleWhite: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  headerSpacer: {
    width: 24,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
    transform: [{ scale: 1.3 }], // Moderate zoom to focus on face area
  },
  // Dark overlay mask to show only frame area
  overlayMask: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  maskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  maskMiddleRow: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: 300,
    flexDirection: 'row',
  },
  maskLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  frameCutout: {
    width: 280,
    height: 300,
    backgroundColor: 'transparent',
  },
  maskRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  maskBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  mockCamera: {
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCameraText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  mockCameraSubtext: {
    color: colors.gray[400],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 0, 86, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoBannerTextWhite: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
    marginLeft: 8,
  },
  scanArea: {
    width: 280,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  faceFrame: {
    width: 220,
    height: 280,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: colors.white,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  faceFrameActive: {
    borderColor: colors.primary,
    borderWidth: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  scanLine: {
    position: 'absolute',
    left: 30,
    right: 30,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  statusSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
  },
  progressTextWhite: {
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  titleWhite: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  subtitleWhite: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonActive: {
    backgroundColor: colors.gray[400],
    shadowOpacity: 0.1,
  },
  scanButtonSuccess: {
    backgroundColor: colors.green[500],
  },
  scanButtonFailed: {
    backgroundColor: colors.red[500],
  },
  captureButton: {
    backgroundColor: colors.green[500],
  },
  buttonIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});

export default FaceRecognitionScreen;

