export interface SdkCommunicationStatusModel {
  errorCode: string;
  errorMessageVN: string;
  errorMessageEN: string;
}

export interface SdkCommunicationDataModel<T = any> {
  request_id?: string; // correlation id
  response_id?: string; // response id
  sender: 'MINIAPP_SDK' | 'MINIAPP_WEBVIEW'; // message sender
  event: string; // event name
  data?: T; // event data
  token?: string;
  timeStamp?: string;
  eventStatus?: SdkCommunicationStatusModel;
}

export interface SdkEncryptedModel {
  encrypted_value?: string;
  encrypted: string;
  signature: string;
  token: string;
}
