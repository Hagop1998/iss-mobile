import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useIsFocused } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

const ExternalCameraScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraInfo, setCameraInfo] = useState(null);
  const isFocused = useIsFocused();
  const videoRef = useRef(null);

  useEffect(() => {
    if (isFocused) {
      startLivePreview();
    } else {
      stopLivePreview();
    }
  }, [isFocused]);

  const startLivePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);


      const response = await apiService.externalCamera.startLivePreview({
        channel: route?.params?.channel || 0,
        streamType: route?.params?.streamType || 0,
      });

      if (response?.data?.streamUrl) {
        setStreamUrl(response.data.streamUrl);
        setIsPlaying(true);
      } else if (response?.data?.url) {
        setStreamUrl(response.data.url);
        setIsPlaying(true);
      } else if (response?.streamUrl) {
        setStreamUrl(response.streamUrl);
        setIsPlaying(true);
      } else if (response?.url) {
        setStreamUrl(response.url);
        setIsPlaying(true);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        throw new Error('No stream URL received from API. Check camera server connection.');
      }
    } catch (err) {
      console.error('❌ Error starting live preview:', err);
      
      let errorMessage = 'Failed to start camera feed';
      
      if (err?.message?.includes('Aborted') || err?.name === 'AbortError') {
        errorMessage = 'Connection timeout. Check if camera server is reachable and IP address is correct.';
      } else if (err?.message?.includes('Network')) {
        errorMessage = 'Network error. Check your internet connection and camera server IP.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      Alert.alert(
        'Camera Connection Error',
        errorMessage + '\n\nPlease check:\n• Camera server IP address\n• Network connectivity\n• Camera server is running',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stopLivePreview = async () => {
    try {
      if (isPlaying) {
        await apiService.externalCamera.stopPlayback({
          channel: route?.params?.channel || 0,
        });
        setIsPlaying(false);
        setStreamUrl(null);
      }
    } catch (err) {
      console.error('Error stopping preview:', err);
    }
  };

  const handlePTZControl = async (direction) => {
    try {
      await apiService.externalCamera.ptzControl({
        channel: route?.params?.channel || 0,
        command: direction,
        speed: 5,
      });
    } catch (err) {
      console.error('PTZ control error:', err);
      Alert.alert('Error', 'Failed to control camera');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Connecting to camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !streamUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off" size={64} color={colors.gray[400]} />
          <Text style={styles.errorTitle}>Camera Unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={startLivePreview}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topBarWrapper}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {cameraInfo?.name || 'Surveillance Camera'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      {streamUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: streamUrl }}
          style={styles.videoContainer}
          shouldPlay={isPlaying}
          isLooping={true}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={(error) => {
            console.error('Video error:', error);
            setError('Failed to load video stream');
          }}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="videocam" size={80} color={colors.gray[400]} />
          <Text style={styles.placeholderText}>No video stream available</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}

      <View style={styles.controlsPanel}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handlePTZControl('up')}
          >
            <Ionicons name="arrow-up" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handlePTZControl('left')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handlePTZControl('center')}
          >
            <Ionicons name="stop" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handlePTZControl('right')}
          >
            <Ionicons name="arrow-forward" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handlePTZControl('down')}
          >
            <Ionicons name="arrow-down" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
  videoContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: colors.gray[400],
    fontSize: 16,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  loadingText: {
    color: colors.white,
    marginTop: 16,
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000080',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    color: colors.gray[400],
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  controlsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#00000080',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ffffff33',
  },
});

export default ExternalCameraScreen;

