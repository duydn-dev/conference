// Lightweight SDK login adapter for web / miniapp environments
// - Detects presence of a native miniapp bridge and routes login events
// - Provides: isMiniApp, sendSdkRequest, notifyLoginSuccess, requestAnonymousSession, loginAdapter

type SdkRequest = {
  sender: string;
  event: string;
  data?: any;
  request_id?: string;
};

function genRequestId() {
  // simple RFC4122 v4-ish id
  return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  // heuristics: known bridges or webviews
  return !!(
    w.__SDK_BRIDGE__ ||
    w.sdkObject ||
    w.AndroidWebView ||
    w.webkit?.messageHandlers?.native ||
    w.ReactNativeWebView ||
    /MiniApp|miniapp|MicroMessenger|wv/.test(navigator.userAgent)
  );
}

function postToSdk(target: any, message: SdkRequest) {
  try {
    if (target && typeof target.postMessage === 'function') {
      target.postMessage(message, '*');
    } else if ((window as any).webkit?.messageHandlers?.native) {
      (window as any).webkit.messageHandlers.native.postMessage(message);
    } else if ((window as any).AndroidWebView && (window as any).AndroidWebView.postMessage) {
      (window as any).AndroidWebView.postMessage(JSON.stringify(message));
    } else if ((window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    } else if ((window as any).sdkObject && typeof (window as any).sdkObject.postMessage === 'function') {
      (window as any).sdkObject.postMessage(message);
    } else {
      // fallback to window.parent
      window.parent.postMessage(message, '*');
    }
  } catch (e) {
    console.error('postToSdk error', e);
  }
}

export function sendSdkRequest(event: string, data?: any, noResponse = false, timeout = 10000): Promise<any> {
  const request: SdkRequest = {
    sender: 'MINIAPP_WEBVIEW',
    event,
    data: data ?? null,
    request_id: genRequestId(),
  };

  if (noResponse) {
    postToSdk((window as any).sdkObject || window.parent, request);
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const listener = (ev: MessageEvent) => {
      try {
        const resp = ev.data;
        if (!resp || resp.request_id !== request.request_id) return;
        window.removeEventListener('message', listener as any);
        resolve(resp);
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('message', listener as any);
    postToSdk((window as any).sdkObject || window.parent, request);

    const to = setTimeout(() => {
      window.removeEventListener('message', listener as any);
      reject(new Error('SDK request timeout'));
    }, timeout);

    // clear timeout on resolve/reject
    const wrapResolve = (val: any) => {
      clearTimeout(to);
      resolve(val);
    };
    const wrapReject = (err: any) => {
      clearTimeout(to);
      reject(err);
    };
  });
}

export async function notifyLoginSuccess(authn: any, accInfo: any): Promise<void> {
  if (!isMiniApp()) return Promise.resolve();
  const payload = {
    auth: authn,
    accInfo: accInfo,
  };
  try {
    await sendSdkRequest('LOGIN_SUCCESS', payload);
  } catch (e) {
    console.warn('notifyLoginSuccess failed', e);
  }
}

export async function requestAnonymousSession(partnerLink?: string): Promise<any> {
  if (!isMiniApp()) return Promise.resolve(null);
  try {
    const data = partnerLink ? { partnerLink } : {};
    const resp = await sendSdkRequest('LOGIN_ANONYMOUS', data);
    return resp?.data ?? resp;
  } catch (e) {
    console.warn('requestAnonymousSession failed', e);
    return null;
  }
}

export type WebLoginFn = () => Promise<{ authn: any; accInfo?: any }>;

export async function loginAdapter(webLoginFn: WebLoginFn, opts?: { partnerLink?: string }) {
  if (!isMiniApp()) {
    // Normal web flow: run provided web login, then notify SDK if present
    const result = await webLoginFn();
    try {
      await notifyLoginSuccess(result.authn, result.accInfo ?? null);
    } catch (e) {
      // ignore
    }
    return result;
  }

  // Miniapp: prefer native anonymous session if partnerLink provided
  if (opts?.partnerLink) {
    const anon = await requestAnonymousSession(opts.partnerLink);
    return { authn: anon?.auth ?? null, accInfo: anon?.accInfo ?? null };
  }

  // Fallback: attempt web login but prefer notifying native
  const result = await webLoginFn();
  await notifyLoginSuccess(result.authn, result.accInfo ?? null);
  return result;
}

export default {
  isMiniApp,
  sendSdkRequest,
  notifyLoginSuccess,
  requestAnonymousSession,
  loginAdapter,
};
