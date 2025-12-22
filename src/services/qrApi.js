import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../config/env';

export const visitorIdentities = [
  { id: 'friends_family', name: 'Friends & Family', icon: 'people' },
  { id: 'delivery', name: 'Delivery', icon: 'car' },
];

export const deliveryTimePeriods = [
  { id: '2_hours', name: '2 hours', value: 2, unit: 'hours' },
  { id: '4_hours', name: '4 hours', value: 4, unit: 'hours' },
  { id: '8_hours', name: '8 hours', value: 8, unit: 'hours' },
];

export const friendsFamilyTimePeriods = [
  { id: '24_hours', name: '24 hours', value: 24, unit: 'hours' },
  { id: '1_week', name: '1 week', value: 168, unit: 'hours' },
  { id: '2_weeks', name: '2 weeks', value: 336, unit: 'hours' },
  { id: '1_month', name: '1 month', value: 720, unit: 'hours' },
];

export const timePeriods = [
  { id: '2_hours', name: '2 hours', value: 2, unit: 'hours' },
  { id: '4_hours', name: '4 hours', value: 4, unit: 'hours' },
  { id: '8_hours', name: '8 hours', value: 8, unit: 'hours' },
  { id: '24_hours', name: '24 hours', value: 24, unit: 'hours' },
  { id: '1_week', name: '1 week', value: 168, unit: 'hours' },
  { id: '2_weeks', name: '2 weeks', value: 336, unit: 'hours' },
  { id: '1_month', name: '1 month', value: 720, unit: 'hours' },
];

export const getTimePeriodsByVisitorType = (visitorIdentityId) => {
  if (visitorIdentityId === 'delivery') {
    return deliveryTimePeriods;
  } else if (visitorIdentityId === 'friends_family') {
    return friendsFamilyTimePeriods;
  }
  return [];
};

export const services = [
  { id: 'smart_intercom', name: 'Smart Intercom', icon: 'call' },
  { id: 'elevator', name: 'Elevator', icon: 'business' },
  { id: 'barrier', name: 'Barrier', icon: 'car' },
];

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.user?.token;
    console.log('🔐 QR API - Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      authState: {
        hasUser: !!getState().auth.user,
        isAuthenticated: getState().auth.isAuthenticated,
      },
    });
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('✅ Authorization header set for QR API request');
    } else {
      console.error('❌ No token found in Redux state for QR API request');
    }
    
    headers.set('Content-Type', 'application/json');
    
    console.log('📤 QR API Request Headers:', {
      Authorization: headers.get('Authorization') ? 'Bearer ***' : 'Not set',
      'Content-Type': headers.get('Content-Type'),
    });
    
    return headers;
  },
});

export const qrApi = createApi({
  reducerPath: 'qrApi',
  baseQuery,
  tagTypes: ['QRCode', 'QRHistory'],
  endpoints: (builder) => ({
    generateQRCode: builder.mutation({
      query: (qrData) => ({
        url: '/middleware/qr_code',
        method: 'POST',
        body: qrData,
        responseHandler: async (response) => {
          const contentType = response.headers.get('content-type');
          console.log('📷 Response Content-Type:', contentType);
          
          if (contentType && contentType.includes('image/')) {
            console.log('✅ Detected image response, converting to base64...');
            try {
              const arrayBuffer = await response.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              
              const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
              let base64 = '';
              let i = 0;
              
              while (i < uint8Array.length) {
                const a = uint8Array[i++];
                const b = i < uint8Array.length ? uint8Array[i++] : 0;
                const c = i < uint8Array.length ? uint8Array[i++] : 0;
                
                const bitmap = (a << 16) | (b << 8) | c;
                
                base64 += base64Chars.charAt((bitmap >> 18) & 63);
                base64 += base64Chars.charAt((bitmap >> 12) & 63);
                base64 += i - 2 < uint8Array.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
                base64 += i - 1 < uint8Array.length ? base64Chars.charAt(bitmap & 63) : '=';
              }
              
              const base64DataUrl = `data:${contentType};base64,${base64}`;
              
              console.log('✅ Image converted to base64, length:', base64DataUrl?.length);
              return {
                code: response.status,
                status: response.status,
                success: true,
                imageData: base64DataUrl, 
                imageType: contentType,
              };
            } catch (error) {
              console.error('❌ Error converting image to base64:', error);
              throw error;
            }
          }
          
          console.log('📄 Handling as JSON response...');
          try {
            const text = await response.text();
            if (text) {
              return JSON.parse(text);
            }
            return { code: response.status, status: response.status };
          } catch (e) {
            console.warn('⚠️ Could not parse as JSON, returning raw response');
            return { code: response.status, status: response.status, raw: true };
          }
        },
      }),
      transformResponse: (response, meta) => {
        const httpStatus = meta?.response?.status;
        console.log('✅ QR Code API Response:', response);
        console.log('Response HTTP status:', httpStatus);
        console.log('Response type:', typeof response);
        console.log('Has imageData:', !!response?.imageData);
        
        if (response?.imageData) {
          console.log('✅ QR Code image received:', {
            imageType: response.imageType,
            dataUrlLength: response.imageData?.length,
            status: response.status || httpStatus,
          });
          return {
            code: response.status || httpStatus || 200,
            status: response.status || httpStatus || 200,
            success: true,
            imageData: response.imageData,
            imageType: response.imageType,
            message: 'QR code generated successfully',
          };
        }
        
        let responseData = response;
        
        if (response && typeof response === 'object' && 'data' in response) {
          responseData = response.data;
        }
        
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
          } catch (e) {
            console.warn('⚠️ Could not parse response as JSON:', e);
          }
        }
        
        if (httpStatus === 201 || httpStatus === 200) {
          console.log(`✅ HTTP ${httpStatus} - QR code generated successfully`);
          return {
            code: httpStatus,
            status: httpStatus,
            success: true,
            message: 'QR code generated successfully',
            ...responseData,
          };
        }
        
        const responseCode = responseData?.code || httpStatus;
        if (responseCode && responseCode !== 200 && responseCode !== 201) {
          console.error('❌ API returned error code:', responseCode, responseData?.msg || responseData?.message);
          throw {
            status: 'CUSTOM_ERROR',
            data: {
              code: responseCode,
              message: responseData?.msg || responseData?.message || 'Unknown error',
              error: responseData?.msg || responseData?.message || 'Unknown error',
            },
          };
        }
        
        return responseData || response;
      },
      transformErrorResponse: (response, meta) => {
        console.error('❌ QR Code API Error:', response);
        console.error('Error status:', meta?.response?.status);
        console.error('Error type:', typeof response);
        console.error('Error data:', response?.data);
        
        if (meta?.response?.status === 201 && response?.error?.includes('Cannot read property')) {
          console.warn('⚠️ Parsing error detected - API returned 201 but response parsing failed');
          return {
            status: 201,
            data: {
              code: 201,
              message: 'QR code generated successfully',
              success: true,
              parsingWarning: 'Response parsing had issues, but QR code was generated',
            },
          };
        }
        
        const errorData = response?.data || response;
        
        return {
          status: meta?.response?.status || 'UNKNOWN_ERROR',
          data: {
            code: errorData?.code || meta?.response?.status || 500,
            message: errorData?.msg || errorData?.message || errorData?.error || 'Failed to generate QR code',
            error: errorData?.msg || errorData?.message || errorData?.error || 'Failed to generate QR code',
          },
        };
      },
      invalidatesTags: ['QRHistory'],
    }),

    shareQRCode: builder.mutation({
      async queryFn(qrData, { dispatch }) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return { 
            data: { 
              success: true, 
              shareUrl: `https://qr.issapp.com/${qrData.id || 'qr'}`,
            } 
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
    }),

    getQRHistory: builder.query({
      async queryFn(userId, { dispatch }) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockHistory = [
            {
              id: '1',
              service: 'smart_intercom',
              visitorIdentity: 'friends_family',
              timePeriod: 2,
              address: 'Azatutyun 20',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              isActive: true,
            },
            {
              id: '2',
              service: 'elevator',
              visitorIdentity: 'delivery',
              timePeriod: 4,
              address: 'Azatutyun 20',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              isActive: false,
            },
          ];
          
          return { data: mockHistory };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['QRHistory'],
    }),

    getQRCode: builder.query({
      query: (id) => `qr/${id}`,
      providesTags: (result, error, id) => [{ type: 'QRCode', id }],
    }),

    deleteQRCode: builder.mutation({
      query: (id) => ({
        url: `qr/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QRHistory'],
    }),
  }),
});

export const {
  useGenerateQRCodeMutation,
  useShareQRCodeMutation,
  useGetQRHistoryQuery,
  useGetQRCodeQuery,
  useDeleteQRCodeMutation,
} = qrApi;
