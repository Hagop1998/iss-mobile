export const AuthCodeTypeEnum = {
  ONE_HOUR: 1,
  EIGHT_HOURS: 2,
  TWENTY_FOUR_HOURS: 3,
};

export const QrCodeTypeEnum = {
  VALID_ONCE: 0,
  VALID_PERIOD: 1,
};

export const QrValidityTimeEnum = {
  oneHour: 1,
  fourHours: 4,
  eightHours: 8,
  twelveHours: 12,
  oneDay: 24,
  threeDays: 72,
  oneWeek: 168,
  twoWeeks: 336,
  oneMonth: 720,
};

export const ElevatorCallTypeEnum = {
  VISITOR_CALL: 0,
  RESIDENT_PRE_CALL: 1,
};

export const ChipCardOperationEnum = {
  ADD: 1,
  DELETE: 2,
  CLEAR: 3,
};

export const DoorInitTypeEnum = {
  RESTORE_FACTORY: 1,
  CLEAR_FACE_DATA: 2,
};

export const SetDoorTypeEnum = {
  LIVENESS_SWITCH: 1,
  LIVENESS_THRESHOLD: 2,
  FACE_RECOGNITION_THRESHOLD: 3,
  CLOUD_INTERCOM_SWITCH: 5,
  QR_CODE_SWITCH: 6,
  AUTOMATIC_FACE_SWITCH: 7,
  CARD_SWIPE_FAILURE_VERIFICATION: 9,
  DIRECT_CALL_MOBILE: 13,
  UPLOAD_UNLOCK_RECORD_IMAGE: 16,
  ADVERTISING_SLEEP_START: 21,
  ADVERTISING_SLEEP_END: 22,
};

export const PushNoticeTypeEnum = {
  UPDATE_ADS: 1,
  UPLOAD_FACE_DB: 2,
};

export const MiddlewareNotifyTypeEnum = {
  ONLINE: 'online',
  UNLOCK_INFO: 'unlockInfo',
  VERIFICATION_QR_CODE: 'verificationQrCode',
  REG_SIP: 'regSip',
  FACE_REG: 'faceReg',
  CALLBACK: 'callback',
};

export const imageSizeEnum = {
  small :'240x320',
  medium : '640x480',
  large : '1280x720'
}

export const entityTypeEnum = {
  REG_FACE : 'regFace',
  AVATAR : 'avatar',
  Default : 'public'
}