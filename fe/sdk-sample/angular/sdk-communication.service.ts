import {Injectable} from '@angular/core';
import {BehaviorSubject, of, ReplaySubject, Subject} from 'rxjs';
import invoke from 'react-native-webview-invoke/browser';
import {HttpClient} from '@angular/common/http';
import {AccountRes} from '../../modules/account/model/account.res';
import {LocalStorage} from '../local-storage';
import {Constants} from '../constants';
import {environment} from '../../../environments/environment';
import {SdkCommunicationDataModel, SdkEncryptedModel} from '../models/sdk-communication-data.model';
import {SdkBusinessInfo, SdkDeviceInfo, SdkInputModel} from '../models/sdk-input.model';
import {SdkContactRequest, SdkContactResponse} from '../models/sdk-contact.model';
import {Authn} from '../../shared/model/response.model';
import {tap} from 'rxjs/operators';
import {v4 as uuid} from 'uuid';
import {ModalService} from 'viettel/dialog';
import {SdkError} from '../models/sdk-error';
import {DEFAULT_ERROR_MESSAGE, DEFAULT_ERROR_TITLE} from '../constants/message.constant';
import {RequestPaymentModel} from '../models/sdk-request-payment.model';

export const SDK_SUCCESS_CODE = 'SDK000';

export enum ExitActionEnum {
    STAY_CURRENT = 'STAY_CURRENT',
    RETURN_HOME = 'RETURN_HOME',
    OPEN_QR_SCAN = 'OPEN_QR_SCAN',
}

export type SdkType = 'REACT_NATIVE' | 'FLUTTER' | 'ANDROID' | 'IOS' | 'MOCK' | 'LOCAL' | 'HOME' | 'WEB';
export enum ESdkEvent {
    API_RESPONSE = 'API_RESPONSE',
    EVENT_PAYMENT_SUCCESS = 'EVENT_PAYMENT_SUCCESS',
    EVENT_PAYMENT_FAIL = 'EVENT_PAYMENT_FAIL',
    API_REQUEST = 'API_REQUEST',
    INIT = 'INIT',
    INIT_CONTACTS = 'INIT_CONTACTS',
    OPEN_ICON_CONTACT = 'OPEN_ICON_CONTACT',
    CALLBACK_CONTACT = 'CALLBACK_CONTACT',
    INIT_CHANNEL = 'INIT_CHANNEL',
    NapasNotEnoughMoney = 'NapasNotEnoughMoney',
    IN_FOREGROUND = 'IN_FOREGROUND',
    AUTO_RENEW_STATUS = 'AUTO_RENEW_STATUS',
    AUTO_RENEW_INTERNET = 'AUTO_RENEW_INTERNET',
    INTERNET_OTHER_PAYMENT = 'INTERNET_OTHER_PAYMENT',
    PAYMENT_BACK_TO_MINIAPP = 'PAYMENT_BACK_TO_MINIAPP',
}

export enum ESdkSender {
    MINIAPP_WEBVIEW = 'MINIAPP_WEBVIEW',
}

export enum ESdkEventToken {
    // Các token cho event tracking
    // ... (giữ nguyên các token từ file gốc nếu cần)
}

@Injectable({
    providedIn: 'root',
})
export class SdkCommunicationService {
    type: string;
    sdkObject: any;
    private _messageDialogInterceptCallback = () => {};

    private _sdkMode: SdkType = 'REACT_NATIVE';

    get sdkMode(): SdkType {
        return this._sdkMode;
    }

    set sdkMode(value: SdkType) {
        if (!value) {
            this._sdkMode = 'REACT_NATIVE';
        } else {
            this._sdkMode = value;
        }
        if (this.mockSdk()) {
            if (!LocalStorage.getDeviceID()) {
                const deviceId = uuid();
                LocalStorage.setDeviceID(deviceId);
            }
        }
    }

    mockSdk(): boolean {
        return this._sdkMode === 'MOCK';
    }

    mockSdkHome(): boolean {
        return this._sdkMode === 'HOME';
    }

    private _mockApiMap: { [key: string]: boolean } = {};

    regexMockApiParam = new RegExp('^mock-api-(.+)$');

    loadMockApiConfig(urlSearchParams: URLSearchParams) {
        urlSearchParams.forEach((_, key) => {
            if (this.regexMockApiParam.test(key)) {
                const moduleName = this.regexMockApiParam.exec(key)[1];
                this._mockApiMap[moduleName] = true;
            }
        });
    }

    getBaseUrl(moduleName: string) {
        return this._mockApiMap[moduleName] ? Constants.API_MOCK_URL : environment.apiUrl;
    }

    getBaseUrlProxy(moduleName: string) {
        return this._mockApiMap[moduleName] ? Constants.API_MOCK_URL_PROXY : environment.proxy;
    }

    getBaseUrlWaco(moduleName: string) {
        return this._mockApiMap[moduleName] ? Constants.API_MOCK_URL_WACO : environment.wacoURL;
    }
    getBaseUrlElectricity(){
      return environment.electricityURL;
    }

    readonly sdkEvent$: ReplaySubject<SdkCommunicationDataModel> = new ReplaySubject<SdkCommunicationDataModel>(50);
    readonly sdkResponse$: ReplaySubject<SdkCommunicationDataModel> = new ReplaySubject<SdkCommunicationDataModel>(5);
    readonly sdkDeviceInfo$: BehaviorSubject<SdkDeviceInfo> = new BehaviorSubject<SdkDeviceInfo>(null);
    readonly sdkBusinessInfo$: BehaviorSubject<SdkBusinessInfo> = new BehaviorSubject<SdkBusinessInfo>(null);
    readonly sdkInputModel$: BehaviorSubject<SdkInputModel> = new BehaviorSubject<SdkInputModel>(null);
    readonly getIp: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    readonly getSdkResponse: ReplaySubject<SdkCommunicationDataModel> = new ReplaySubject<SdkCommunicationDataModel>(1);
    readonly paymentGatewayRedirect: ReplaySubject<SdkCommunicationDataModel> = new ReplaySubject<SdkCommunicationDataModel>(1);
    readonly getSdkResponse$: Subject<SdkCommunicationDataModel> = new Subject<SdkCommunicationDataModel>();
    protected temporary: any;
    private _webMessageHandler: ((event: MessageEvent) => void) | null = null;

    constructor(
        private http: HttpClient,
        private modalService: ModalService
    ) {}

    enableConsoleEvent() {
        const sdkEvent = this.sdkEvent$;
        const captureFunc = (event: string, message: any, ...args: any[]) => {
            const fmtArgs = args
                .slice(1)
                .map((arg) => String(arg))
                .join(' ');
            sdkEvent.next({
                event: event,
                timeStamp: new Date().toISOString(),
                data: message + ' ' + fmtArgs,
                sender: 'MINIAPP_WEBVIEW',
            });
        };
        const oldLog = console.log;
        console.log = function (message) {
            captureFunc('CONSOLE_LOG', message, arguments);
            oldLog.apply(console, arguments);
        };
        const oldDebug = console.debug;
        console.debug = function (message) {
            captureFunc('CONSOLE_DEBUG', message, arguments);
            oldDebug.apply(console, arguments);
        };
        const oldInfo = console.info;
        console.info = function (message) {
            captureFunc('CONSOLE_INFO', message, arguments);
            oldInfo.apply(console, arguments);
        };
        const oldError = console.error;
        console.error = function (message) {
            captureFunc('CONSOLE_ERROR', message, arguments);
            oldError.apply(console, arguments);
        };
        const oldWarn = console.warn;
        console.warn = function (message) {
            captureFunc('CONSOLE_WARN', message, arguments);
            oldWarn.apply(console, arguments);
        };
        const oldTrace = console.trace;
        console.trace = function (message) {
            captureFunc('CONSOLE_TRACE', message, arguments);
            oldTrace.apply(console, arguments);
        };
    }

    handleResponse(
        resolve: (next: SdkCommunicationDataModel) => void,
        reject: (err: Error) => void,
        next?: SdkCommunicationDataModel
    ): void {
        if (next?.eventStatus?.errorCode === SDK_SUCCESS_CODE) {
            resolve(next);
        } else {
            const err = new SdkError(
                `Lỗi SDK: ${next?.eventStatus?.errorCode} - ${next?.eventStatus?.errorMessageVN}`,
                next?.eventStatus?.errorCode
            );
            reject(err);
        }
    }

    prepareResponse: (response: SdkCommunicationDataModel, request?: SdkCommunicationDataModel) => boolean = (
        response: SdkCommunicationDataModel,
        request?: SdkCommunicationDataModel
    ) => {
        return response?.sender === 'MINIAPP_SDK' && (!request || request?.request_id === response?.request_id);
    };

    prepareMessage: (request: SdkCommunicationDataModel) => void = (request) => {
        request.request_id = `MINIAPP_${new Date().getTime()}`;
    };

    sendToSdkAsyncCallback: <T = any>(
        request: SdkCommunicationDataModel,
        noResponse?: boolean
    ) => Promise<SdkCommunicationDataModel<T>> = <T = any>(request: SdkCommunicationDataModel, noResponse = false) => {
        this.prepareMessage(request);
        this.sendToSdkSyncCallback<T>(request);
        if (noResponse) {
            return Promise.resolve({
                request_id: request.request_id,
                sender: 'MINIAPP_SDK',
                event: 'IGNORE',
                data: null,
            });
        }
        return new Promise((resolve, reject) => {
            const responseWrapper: { response: SdkCommunicationDataModel } = { response: null };
            const handler = (event: any) => {
                if (typeof event.data === 'string') {
                    const next: SdkCommunicationDataModel = JSON.parse(event.data);
                    if (this.prepareResponse(next, request)) {
                        console.debug('Message from SDK to webview', next);
                        responseWrapper.response = next;
                        this.handleResponse(resolve, reject, next);
                    }
                }
            };
            window.addEventListener('message', handler);
            setTimeout(() => {
                window.removeEventListener('message', handler);
                if (!responseWrapper.response) {
                    reject(new Error('Không có phản hồi từ SDK'));
                }
            }, 10000);
        });
    };

    async init(): Promise<SdkInputModel> {
        console.log(`[${new Date().toISOString()}] ===> `, 'start init event sdk');
        switch (this.sdkMode) {
            case 'LOCAL':
                // Implementation cho LOCAL mode...
                break;
            case 'MOCK':
                // Implementation cho MOCK mode...
                break;
            case 'REACT_NATIVE':
                // Implementation cho REACT_NATIVE mode...
                this.sdkObject = invoke;
                this.sendToSdkAsyncCallback = async <T = any>(
                    request: SdkCommunicationDataModel,
                    noResponse = false
                ): Promise<SdkCommunicationDataModel<T>> => {
                    console.debug('Data send from Webview to SDK', request);
                    this.prepareMessage(request);
                    let reqPromise: Promise<SdkCommunicationDataModel<T>>;
                    const sendToSdkFunc = this.sdkObject.bind('miniappWebviewToSdk');
                    if (sendToSdkFunc) {
                        console.debug(sendToSdkFunc, this.sdkObject);
                        reqPromise = new Promise((resolve, reject) => {
                            sendToSdkFunc(request);
                            if (noResponse) {
                                resolve({
                                    request_id: request.request_id,
                                    sender: 'MINIAPP_SDK',
                                    event: 'IGNORE',
                                    data: null,
                                });
                                return;
                            }
                            const responseWrapper: { response: SdkCommunicationDataModel } = { response: null };
                            const sub = this.sdkResponse$.subscribe((next) => {
                                if (this.prepareResponse(next, request)) {
                                    responseWrapper.response = next;
                                    this.handleResponse(resolve, reject, next);
                                }
                            });
                            setTimeout(() => {
                                if (!responseWrapper.response) {
                                    reject(new Error('Không có phản hồi từ SDK'));
                                }
                                sub.unsubscribe();
                            }, 100000);
                        });
                    } else {
                        reqPromise = Promise.reject(new Error('Lỗi binding với SDK'));
                    }
                    this.sdkEvent$.next(request);
                    return await reqPromise;
                };
                this.sdkObject.define('miniappSdkToWebview', (response: SdkCommunicationDataModel) => {
                    this.sdkEvent$.next(response);
                    this.sdkResponse$.next(response);
                });
                break;
            case 'FLUTTER':
                // Implementation cho FLUTTER mode...
                break;
            case 'IOS':
                // Implementation cho IOS mode...
                break;
            case 'ANDROID':
                // Implementation cho ANDROID mode...
                break;
            case 'WEB':
                // Implementation cho WEB mode...
                break;
            default:
                // Default implementation...
                break;
        }

        return await new Promise((resolve, reject) => {
            let waitSdkInit: any;
            const callbackInit = (next: SdkCommunicationDataModel) => {
                const data: SdkInputModel = next?.data;
                console.log(`[${new Date().toISOString()}] ===> `, 'callbackInit ==>', data);
                if (data) {
                    this.sdkInputModel$.next(data);
                    this.sdkDeviceInfo$.next(data?.internal?.deviceInfo);
                    this.sdkBusinessInfo$.next(data?.external);
                    clearTimeout(waitSdkInit);
                    sub.unsubscribe();
                    resolve(data);
                }
            };
            const sub = this.sdkEvent$.subscribe((next) => {
                console.log(`[${new Date().toISOString()}] ===> `, 'sub sdk with event : ', next?.event);
                if (next?.event === 'INIT') {
                    callbackInit(next);
                }
            });

            if (this.mockSdk() && this.sdkMode === 'MOCK') {
                console.log('Sending INIT request for MOCK mode');
                const request: SdkCommunicationDataModel = {
                    sender: 'MINIAPP_WEBVIEW',
                    event: 'INIT',
                    data: null,
                };
                this.sendToSdkAsyncCallback(request).then((next) => {
                    this.sdkEvent$.next(next);
                    this.sdkResponse$.next(next);
                });
            }

            console.log(`[${new Date().toISOString()}] ===> `, 'waitSdkInit');
            waitSdkInit = setTimeout(() => {
                clearTimeout(waitSdkInit);
                sub.unsubscribe();
                console.log(`[${new Date().toISOString()}] ===> `, 'not response event sdk');
                reject(new Error('Không nhận được event init từ SDK!'));
            }, 30000);
        });
    }

    async exchangeKey(): Promise<string> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'EXCHANGE_KEY',
            data: '',
        };
        try {
            await this.sendToSdkAsyncCallback(request);
        } catch (e) {
            console.log(e);
            if (e instanceof SdkError) {
                return (e as SdkError).code;
            }
        }
        return null;
    }

    async exit(action: ExitActionEnum = ExitActionEnum.STAY_CURRENT, data?: any): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'EXIT',
            data: {
                response: data,
                navigationAction: action,
            },
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async openVtm(): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'APP_OPEN_STORE',
            data: {
                package: 'com.bplus.vtpay',
                appId: 'id1344204781',
                fallbackUrlAndroid: 'https://km.vtmoney.vn/314y/home',
                fallbackUrliOS: 'https://km.vtmoney.vn/314y/home',
            },
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async openBrowser(url: string): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'APP_OPEN_STORE',
            data: {
                package: 'null',
                appId: 'null',
                fallbackUrlAndroid: url,
                fallbackUrliOS: url,
            },
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async openWebview(url: string, functionName: string): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'APP_OPEN_WEBVIEW',
            data: {
                url: url,
                serviceName: functionName
            }
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async openWebviewNew(url: string, functionName: string, isPaymentConfirm: boolean): Promise<void> {
      const request: SdkCommunicationDataModel = {
        sender: 'MINIAPP_WEBVIEW',
        event: 'APP_OPEN_WEBVIEW',
        data: {
          url: url,
          serviceName: functionName,
          isPaymentConfirm: isPaymentConfirm
        }
      };
      await this.sendToSdkAsyncCallback(request, true);
    }

    async cacheSession(authn: Authn, accInfo: AccountRes) {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'LOGIN_SUCCESS',
            data: {
                auth: authn,
                accInfo: accInfo,
            },
        };
        await this.sendToSdkAsyncCallback(request);
        localStorage.removeItem('ANONYMOUS_IMEI');
    }

    async encryptData(body: any): Promise<SdkEncryptedModel> {
        try {
            const request: SdkCommunicationDataModel = {
                sender: 'MINIAPP_WEBVIEW',
                event: 'ENCRYPT_DATA',
                data: body,
            };
            const response = await this.sendToSdkAsyncCallback<SdkEncryptedModel>(request);
            return response.data;
        } catch (e) {
            this.modalService.showMsg(DEFAULT_ERROR_TITLE, DEFAULT_ERROR_MESSAGE, 'Đóng', null, false);
            throw e;
        }
    }

    async decryptData(body: string): Promise<any> {
        try {
            const request: SdkCommunicationDataModel = {
                sender: 'MINIAPP_WEBVIEW',
                event: 'DECRYPT_DATA',
                data: {
                    encrypted: body,
                },
            };
            const response = await this.sendToSdkAsyncCallback(request);
            return response.data;
        } catch (e) {
            this.modalService.showMsg(DEFAULT_ERROR_TITLE, DEFAULT_ERROR_MESSAGE, 'Đóng', null, false);
            throw e;
        }
    }

  async openPhoneCall(phoneNo: string, allowStr = false): Promise<void> {
    const fmtPhoneNo = phoneNo.replace(/\D/g, '');
    const request: SdkCommunicationDataModel = {
      sender: 'MINIAPP_WEBVIEW',
      event: 'OPEN_PHONE_CALL',
      data: allowStr ? phoneNo :fmtPhoneNo,
    };
    await this.sendToSdkAsyncCallback(request, true);
  }

    async clearSession(): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'CLEAR_SESSION',
            data: null,
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async searchContact(contactRequest: SdkContactRequest): Promise<SdkContactResponse> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'CONTACTS',
            data: contactRequest,
        };
        const res = await this.sendToSdkAsyncCallback<SdkContactResponse>(request);
        return res.data;
    }

    async writeToClipboard(str: string): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'APP_WRITE_CLIPBOARD',
            data: str,
        };
        await this.sendToSdkAsyncCallback<SdkContactResponse>(request, true);
    }

    async shareBill(base64: string): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'SHARE_BILL',
            data: base64,
        };
        await this.sendToSdkAsyncCallback<SdkContactResponse>(request, true);
    }

    private sendToSdkSyncCallback = <T = any>(request: SdkCommunicationDataModel) => {
        console.debug('Data send from Webview to SDK', request);
        this.sdkObject?.postMessage(JSON.stringify(request));
        this.sdkEvent$.next(request);
    };

    async sessionExpired(): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'EXPIRED_SESSION',
            data: null,
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async deviceConfig(): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'DEVICE_CONFIG',
            data: null,
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async requestPayment(requestPayment: RequestPaymentModel): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'PAYMENT_REQUEST',
            data: requestPayment,
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    async openNapas(data: any): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'OPEN_NAPAS',
            data: data,
        };
        const res = await this.sendToSdkAsyncCallback(request, true);
        return res.data;
    }

    get messageDialogInterceptCallback(): () => void {
        return this._messageDialogInterceptCallback;
    }

    set messageDialogInterceptCallback(value: () => void) {
        this._messageDialogInterceptCallback = value;
    }

    public resetMessageDialogInterceptCallback() {
        this._messageDialogInterceptCallback = () => {};
    }

    async openContact(): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: ESdkSender.MINIAPP_WEBVIEW,
            event: ESdkEvent.OPEN_ICON_CONTACT,
        };
        await this.sendToSdkAsyncCallback(request, true);
    }

    async autoRenew(autoRenew, event): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: event,
            data: autoRenew,
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    async navigateTab(data): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'NAVIGATE_TAB',
            data: data,
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    async ekycStart(data): Promise<void> {
        if (data?.flowKey) {
            data.shouldShowFlowOverview = data.flowKey === 'LP_Tapchip';
        }
        const urlEkyc = environment?.baseUrlEkyc || 'https://api23.vtmoney.vn/';
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'EKYC_START',
            data: {...data, baseUrl: urlEkyc, evtData: ESdkEventToken},
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    async bannerTopup(data): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'BANNER_TOPUP',
            data: data,
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    async openKeyboard(data): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'OPEN_KEYBOARD',
            data: data,
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    async eventTracking(eventToken: string): Promise<void> {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'EVENT_TRACKING',
            data: {
                url: 'https://s2s.adjust.com/event?s2s=1',
                appToken: '99y1vxm9cu0w',
                authToken: 'f5a312bbcd73baaf2db939acfb826977',
                idfv: 'D1BA0B5F-E76A-4589-ABB5-F656589F53AC',
                eventToken: eventToken,
            },
        };
        await this.sendToSdkAsyncCallback(request, false);
    }

    private setupWebEventListener(): void {
        const messageHandler = (event: MessageEvent) => {
            if (typeof event.data === 'string') {
                try {
                    const response: SdkCommunicationDataModel = JSON.parse(event.data);
                    console.log(`[${new Date().toISOString()}] ===> `, 'WEB Event Listener - Nhận message từ SDK:', response);

                    if (response?.sender === 'MINIAPP_SDK') {
                        this.sdkEvent$.next(response);
                        this.sdkResponse$.next(response);
                        this.getSdkResponse$.next(response);
                    }
                } catch (error) {
                    console.error('Lỗi khi xử lý message từ SDK trong WEB Event Listener:', error);
                }
            }
        };

        window.addEventListener('message', messageHandler);
        this._webMessageHandler = messageHandler;
    }

    private handleWebSdkEvent(response: SdkCommunicationDataModel): void {
        switch (response.event) {
            case 'INIT':
                console.log('WEB SDK - Nhận event INIT:', response.data);
                break;
            case 'PAYMENT_SUCCESS':
                console.log('WEB SDK - Nhận event PAYMENT_SUCCESS:', response.data);
                break;
            case 'PAYMENT_FAIL':
                console.log('WEB SDK - Nhận event PAYMENT_FAIL:', response.data);
                break;
            case 'SESSION_EXPIRED':
                console.log('WEB SDK - Nhận event SESSION_EXPIRED');
                break;
            case 'DEVICE_CONFIG':
                console.log('WEB SDK - Nhận event DEVICE_CONFIG:', response.data);
                break;
            default:
                console.log('WEB SDK - Nhận event không xác định:', response.event, response.data);
                break;
        }
    }

    public removeWebEventListener(): void {
        if (this._webMessageHandler) {
            window.removeEventListener('message', this._webMessageHandler);
            this._webMessageHandler = null;
        }
    }

    async anonymousSession(partnerLink: string) {
        const request: SdkCommunicationDataModel = {
            sender: 'MINIAPP_WEBVIEW',
            event: 'LOGIN_ANONYMOUS',
            data: {
                partnerLink: partnerLink
            },
        };
        return await this.sendToSdkAsyncCallback(request).then((response) => {
            if(response.eventStatus?.errorCode === 'SDK000') {
                localStorage.setItem('ANONYMOUS_IMEI', response.data?.auth?.imei);
                return response.data;
            }
        })
        .catch((error) => {
            console.error('SDK request failed:', error);
        });

    }
}
