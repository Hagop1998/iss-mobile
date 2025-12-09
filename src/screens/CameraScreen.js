import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { CAMERA_CONFIG, DEFAULT_VALUES } from '../config/env';

const ControlButton = ({ icon, label, active = false, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.controlButton, active && styles.controlButtonActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? colors.white : colors.gray[200]}
        style={styles.controlIcon}
      />
      <Text style={[styles.controlLabel, active && styles.controlLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const CameraScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [mountError, setMountError] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);
  const recordingIntervalRef = useRef(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      try {
        if (!cameraPermission?.granted) {
          await requestCameraPermission();
        }
        if (!micPermission?.granted) {
          await requestMicPermission();
        }
      } catch (e) {
      }
    })();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);
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

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleRecordPress = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      if (!isCameraReady) {
        Alert.alert('Please wait', 'Camera is still starting...');
        return;
      }

      if (isRecording) {
        console.log('Stopping photo capture...');
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setIsRecording(false);
        Alert.alert(
          'Recording Stopped',
          `Captured ${photoCount} photos to your gallery!`,
          [{ text: 'OK' }]
        );
        setPhotoCount(0);
        return;
      }

      setIsRecording(true);
      setPhotoCount(0);
      let count = 0;

      recordingIntervalRef.current = setInterval(async () => {
        try {
          if (!cameraRef.current) return;
          
          const photo = await cameraRef.current.takePictureAsync({
            quality: CAMERA_CONFIG.QUALITY,
            skipProcessing: true,
          });
          
          if (photo?.uri) {
            count++;
            setPhotoCount(count);
            try {
              await MediaLibrary.createAssetAsync(photo.uri);
              console.log(`Photo ${count} saved`);
            } catch (saveError) {
              console.warn('Could not save photo:', saveError);
            }
          }
        } catch (captureError) {
          console.warn('Capture error:', captureError);
        }
      }, CAMERA_CONFIG.PHOTO_INTERVAL_MS);

    } catch (error) {
      console.error('Camera error:', error);
      setIsRecording(false);
      Alert.alert('Error', String(error?.message || 'An error occurred'));
    }
  };

  if (cameraPermission && !cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera" size={36} color={colors.primary} />
          <Text style={styles.permissionTitle}>Camera permission required</Text>
          <Text style={styles.permissionSubtitle}>
            We need access to your camera to show the live video.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
            <Text style={styles.permissionButtonText}>Grant permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {Platform.OS === 'ios' && !isCameraReady ? (
        <View style={[StyleSheet.absoluteFill, styles.mockCamera]}>
          <Ionicons name="videocam" size={80} color={colors.gray[400]} />
          <Text style={styles.mockCameraText}>Camera Preview</Text>
          <Text style={styles.mockCameraSubtext}>
            {mountError || 'Camera not available in Expo Go on iOS.\nUse Android or build with "npx expo run:ios"'}
          </Text>
        </View>
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => {
            console.log('Camera is ready');
            setIsCameraReady(true);
            setMountError(null);
          }}
          onMountError={(e) => {
            const message = e?.nativeEvent?.message || e?.message || 'Camera failed to mount';
            setMountError(message);
            console.error('Camera mount error:', message, e);
          }}
        />
      )}

      <SafeAreaView style={styles.topBarWrapper}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{DEFAULT_VALUES.LOCATION}</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <View style={styles.controlsPanel}>
        {!isCameraReady && !mountError && (
          <Text style={styles.loadingText}>Starting camera…</Text>
        )}
        {mountError && (
          <Text style={styles.errorText}>{String(mountError)}</Text>
        )}
        <View style={styles.controlsGrid}>
          <ControlButton
            icon={isDoorOpen ? 'lock-open' : 'lock-closed'}
            label={isDoorOpen ? 'Opened' : 'Open'}
            active={isDoorOpen}
            onPress={() => setIsDoorOpen((v) => !v)}
          />
          <ControlButton
            icon={isMuted ? 'mic-off' : 'mic'}
            label={isMuted ? 'Muted' : 'Mute'}
            active={isMuted}
            onPress={() => setIsMuted((v) => !v)}
          />
          <ControlButton
            icon={isSoundOn ? 'volume-high' : 'volume-mute'}
            label={isSoundOn ? 'Sound' : 'Unmute'}
            active={isSoundOn}
            onPress={() => setIsSoundOn((v) => !v)}
          />
          <ControlButton
            icon={isRecording ? 'stop' : 'radio-button-on'}
            label={isRecording ? 'Stop' : 'Record'}
            active={isRecording}
            onPress={handleRecordPress}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  mockCamera: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    lineHeight: 20,
  },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  controlsPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#00000080',
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  controlButton: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  controlIcon: {
    marginBottom: 8,
  },
  controlLabel: {
    color: colors.gray[200],
    fontSize: 14,
    fontWeight: '600',
  },
  controlLabelActive: {
    color: colors.white,
  },
  loadingText: {
    color: colors.gray[200],
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  errorText: {
    color: '#ffb4b4',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: 24,
    alignItems: 'center',
  },
  permissionTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  permissionSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default CameraScreen;



