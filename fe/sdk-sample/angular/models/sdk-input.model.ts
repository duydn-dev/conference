import { AccountRes } from '../../modules/account/model/account.res';
import { Authn } from '../../shared/model/response.model';

export interface SdkDeviceInfo {
  imei: string;
  platform: {
    os: string;
    osVersion: string;
  };
}

export interface SdkBusinessInfo<T = (SdkBusinessServiceInfo | SdkBusinessServiceInfo[])> {
  generalInfo: {
    billCode?: string,  // mã bill có thể mahocsinh, madichvu...
    partnerMerchantCode?: string;
    masterMerchantCode?: string, // masterMerchantCode của partner
    merchantCode?: string,  // merchantCode của dịch vụ ví dụ 0000014H57
    msisdn: string, // số điện thoại của khách hàng
    totalAmount: number// tổng số tiền của bill
    orderId: string // doi tac truyền sang
    sign?: string,
    extraData?:string // thong tin doi tac truyen sang kieu json
  },
  serviceInfo: T
}

export interface SdkBusinessServiceInfo {
  [key: string]: any;
}

export interface SdkInputModel {
  internal: {
    session: {
      auth: Authn,
      accInfo: AccountRes
    },
    deviceInfo: SdkDeviceInfo
  };
  external: SdkBusinessInfo;
}
