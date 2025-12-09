import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

// Mock user data for face recognition
const MOCK_USERS = [
  { id: 1, name: 'Admin Adminyan', email: 'admin@example.com', faceId: 'face_001' },
  { id: 2, name: 'Alice Vardanyan', email: 'alice@example.com', faceId: 'face_002' },
  { id: 3, name: 'John Doe', email: 'john@example.com', faceId: 'face_003' },
];

const FaceRecognitionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { service } = route?.params || {};
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [recognitionStatus, setRecognitionStatus] = useState('idle'); // idle, scanning, analyzing, success, failed
  
  // Animation values
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

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

  const handleStartScan = () => {
    console.log('👤 Starting face recognition scan...');
    setIsScanning(true);
    setRecognitionStatus('scanning');
    setScanProgress(0);
    
    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Stage 1: Scanning (2 seconds)
    setTimeout(() => {
      setRecognitionStatus('analyzing');
      console.log('🔍 Analyzing face data...');
    }, 2000);

    // Stage 2: Mock recognition (3 seconds total)
    setTimeout(() => {
      clearInterval(progressInterval);
      
      // Simulate random success/failure (80% success rate for demo)
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        // Mock: Select random user as recognized
        const recognizedUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
        
        setRecognitionStatus('success');
        setIsScanning(false);
        
        console.log('✅ Face recognized:', recognizedUser.name);
        
        Alert.alert(
          '✅ Access Granted',
          `Welcome back, ${recognizedUser.name}!\n\nService: ${service || 'Access Control'}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                console.log('Face recognition successful, navigating back...');
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        setRecognitionStatus('failed');
        setIsScanning(false);
        
        console.log('❌ Face not recognized');
        
        Alert.alert(
          '❌ Access Denied',
          'Face not recognized. Please try again or use another access method.',
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
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Recognition</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            {service ? `Access for: ${service}` : 'Face Recognition Access'}
          </Text>
        </View>

        {/* Scan Area with Animation */}
        <View style={styles.scanArea}>
          <Animated.View 
            style={[
              styles.faceFrame, 
              isScanning && styles.faceFrameActive,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <Ionicons 
              name={recognitionStatus === 'success' ? 'checkmark-circle' : recognitionStatus === 'failed' ? 'close-circle' : 'person'} 
              size={120} 
              color={
                recognitionStatus === 'success' ? colors.green[500] :
                recognitionStatus === 'failed' ? colors.red[500] :
                isScanning ? colors.primary : colors.gray[300]
              } 
            />
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
                      outputRange: [-140, 140],
                    }),
                  }],
                },
              ]} 
            />
          )}

          {/* Corner Brackets */}
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        {/* Progress Bar */}
        {isScanning && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{scanProgress}%</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.title}>
            {recognitionStatus === 'scanning' && 'Scanning Face...'}
            {recognitionStatus === 'analyzing' && 'Analyzing...'}
            {recognitionStatus === 'success' && 'Face Recognized!'}
            {recognitionStatus === 'failed' && 'Recognition Failed'}
            {recognitionStatus === 'idle' && 'Position Your Face'}
          </Text>
          <Text style={styles.subtitle}>
            {recognitionStatus === 'scanning' && 'Capturing facial features...'}
            {recognitionStatus === 'analyzing' && 'Matching with database...'}
            {recognitionStatus === 'success' && 'Access granted successfully'}
            {recognitionStatus === 'failed' && 'Please try again'}
            {recognitionStatus === 'idle' && 'Center your face within the frame and tap start'}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={colors.green[500]} />
            <Text style={styles.featureText}>Secure</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={20} color={colors.orange[500]} />
            <Text style={styles.featureText}>Fast</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color={colors.blue[500]} />
            <Text style={styles.featureText}>Encrypted</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.scanButton, 
            isScanning && styles.scanButtonActive,
            recognitionStatus === 'success' && styles.scanButtonSuccess,
            recognitionStatus === 'failed' && styles.scanButtonFailed
          ]}
          onPress={handleStartScan}
          disabled={isScanning}
        >
          <Ionicons 
            name={
              recognitionStatus === 'success' ? 'checkmark' :
              recognitionStatus === 'failed' ? 'close' :
              isScanning ? 'hourglass' : 'scan'
            } 
            size={20} 
            color={colors.white} 
            style={styles.buttonIcon}
          />
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Start Face Scan'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  infoBannerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  scanArea: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  faceFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  faceFrameActive: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    backgroundColor: colors.primary + '05',
  },
  scanLine: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 3,
    backgroundColor: colors.primary,
    opacity: 0.8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  // Corner brackets
  cornerTopLeft: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.primary,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.primary,
    borderBottomRightRadius: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
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

