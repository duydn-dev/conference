# Tài Liệu Kỹ Thuật Tích Hợp Miniapp
## Hướng Dẫn Giao Tiếp giữa MiniApp với Super App qua SDK

**Phiên bản:** 1.0

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc](#2-kiến-trúc)
3. [Giao Thức Truyền Tin](#3-giao-thức-truyền-tin)
4. [Tích Hợp Theo Nền Tảng](#4-tích-hợp-theo-nền-tảng)
5. [Quy Trình Khởi Tạo](#5-quy-trình-khởi-tạo)
6. [Tài Liệu Tham Khảo Phương Thức SDK](#6-tài-liệu-tham-khảo-phương-thức-sdk)
7. [Xử Lý Lỗi](#7-xử-lý-lỗi)

---

## 1. Tổng Quan

### 1.1 Mục Đích
Tài liệu này hướng dẫn đối tác phát triển miniapp tích hợp với nền tảng Super App trên di động. Miniapp chạy trong WebView và giao tiếp với ứng dụng mobile native thông qua lớp SDK communication chuẩn hóa.

### 1.2 Nền Tảng Hỗ Trợ
- **iOS** (Native & React Native)
- **Android** (Native & React Native)
- **React Native** (thông qua react-native-webview)
- **Flutter** (thông qua flutter_inappwebview)
- **Web** (thông qua window.postMessage để test)

### 1.3 Tính Năng Chính
- Giao tiếp hai chiều giữa WebView và ứng dụng native
- Quản lý phiên làm việc và xác thực
- Truy cập thông tin thiết bị
- Tích hợp thanh toán
- Mã hóa/giải mã dữ liệu
- Truy cập danh bạ
- Điều khiển điều hướng
- Tích hợp eKYC

#### Source Code Tham Khảo

- Source code class `SdkCommunicationService` (Angular implementation)
- Các model TypeScript

---
---

## 2. Kiến Trúc

### 2.1 Luồng Giao Tiếp

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Miniapp       │         │   SDK Bridge     │         │   Ứng Dụng      │
│   (WebView)     │◄────────│   (JavaScript)   │────────►│   Native        │
└─────────────────┘         └──────────────────┘         └─────────────────┘
      │                              │                              │
      │  1. Gửi Request              │                              │
      │─────────────────────────────►│                              │
      │                              │  2. Chuyển tiếp tới Native   │
      │                              │─────────────────────────────►│
      │                              │                              │
      │                              │  3. Xử lý & Phản hồi         │
      │                              │◄─────────────────────────────│
      │  4. Nhận Response            │                              │
      │◄─────────────────────────────│                              │
```

### 2.2 Trách Nhiệm Các Thành Phần

| Thành Phần | Trách Nhiệm |
|-----------|-------------|
| **Miniapp** | Giao diện người dùng, logic nghiệp vụ, kích hoạt sự kiện |
| **SDK Bridge** | Tuần tự hóa message, ghép cặp request/response, xử lý timeout |
| **Native SDK** | API thiết bị, lưu trữ bảo mật, tính năng native |

---

## 3. Giao Thức Truyền Tin

### 3.1 Cấu Trúc Message

Tất cả message giữa WebView và ứng dụng native tuân theo cấu trúc JSON sau:

```typescript
interface SdkCommunicationDataModel<T = any> {
  request_id?: string;          // ID duy nhất cho request (định dạng: MINIAPP_${timestamp})
  response_id?: string;         // Khớp với request_id trong response
  sender: 'MINIAPP_SDK' | 'MINIAPP_WEBVIEW';
  event: string;                // Định danh sự kiện (ví dụ: 'INIT', 'PAYMENT_REQUEST')
  data?: T;                     // Dữ liệu sự kiện (kiểu dữ liệu thay đổi theo event)
  token?: string;               // Token xác thực (tùy chọn)
  timeStamp?: string;           // Timestamp ISO 8601
  eventStatus?: {
    errorCode: string;          // 'SDK000' = thành công
    errorMessageVN: string;     // Thông báo lỗi tiếng Việt
    errorMessageEN: string;     // Thông báo lỗi tiếng Anh
  };
}
```

### 3.2 Luồng Message

#### Request (WebView → Native)
```json
{
  "request_id": "MINIAPP_1706000000000",
  "sender": "MINIAPP_WEBVIEW",
  "event": "ENCRYPT_DATA",
  "data": {
    "plaintext": "dữ liệu nhạy cảm"
  }
}
```

#### Response (Native → WebView)
```json
{
  "response_id": "MINIAPP_1706000000000",
  "sender": "MINIAPP_SDK",
  "event": "ENCRYPT_DATA",
  "data": {
    "encrypted": "...",
    "signature": "...",
    "token": "..."
  },
  "eventStatus": {
    "errorCode": "SDK000",
    "errorMessageVN": null,
    "errorMessageEN": null
  }
}
```

### 3.3 Mã Thành Công
- `SDK000` - Thành công
- Các mã khác báo lỗi (xem Mục 7)

---

## 4. Tích Hợp Theo Nền Tảng

### 4.1 Kiểm tra nền tảng

Kiểm tra nền tảng khi chạy bằng cách kiểm tra các đối tượng SDK:

- **iOS**: Kiểm tra `window.webkit?.messageHandlers?.miniappWebviewToSdk`
- **Android**: Kiểm tra `window.AndroidWebview?.miniappWebviewToSdk`
- **Flutter**: Kiểm tra `window.flutter_inappwebview?.callHandler`
- **Web**: Kiểm tra `window.parent !== window`
- **React Native**: Mặc định nếu không phải các trường hợp trên

### 4.2 iOS Integration

**Thiết lập ứng dụng Native:**
- iOS sử dụng `WKWebView` với `WKScriptMessageHandler`
- Đăng ký handler: `miniappWebviewToSdk`

**WebView Implementation:**
- **Gửi message**: Sử dụng `window.webkit.messageHandlers.miniappWebviewToSdk.postMessage(JSON.stringify(message))`
- **Nhận message**: Định nghĩa hàm `window.miniappSdkToWebview = function(rawMsg) { ... }`

### 4.3 Android Integration

**Thiết lập ứng dụng Native:**
- Android sử dụng `WebView` với `addJavascriptInterface`
- Đăng ký interface: `AndroidWebview`

**WebView Implementation:**
- **Gửi message**: Sử dụng `window.AndroidWebview.miniappWebviewToSdk(JSON.stringify(message))`
- **Nhận message**: Định nghĩa hàm `window.miniappSdkToWebview = function(rawMsg) { ... }`

### 4.4 React Native Integration

**Thiết lập ứng dụng Native:**
- Sử dụng package `react-native-webview`
- Cài đặt: `npm install react-native-webview-invoke`

**WebView Implementation:**
- Import: `import invoke from 'react-native-webview-invoke/browser'`
- **Gửi message**: Sử dụng `invoke.bind('miniappWebviewToSdk')`
- **Nhận message**: Sử dụng `invoke.define('miniappSdkToWebview', callback)`


---

## 5. Quy Trình Khởi Tạo

### 5.1 Trình Tự Khởi Động

```
1. Phát hiện Nền tảng
   ↓
2. Thiết lập Message Handlers
   ↓
3. Gửi INIT Event (chỉ cho chế độ MOCK)
   ↓
4. Đợi INIT Response (từ Native)
   ↓
5. Trích xuất Thông tin Thiết bị & Nghiệp vụ
   ↓
6. Ứng dụng Sẵn sàng
```

### 5.2 Sự Kiện INIT

**Mục đích:** Nhận thông tin thiết bị và ngữ cảnh nghiệp vụ từ ứng dụng native.

**Request:** (Chỉ cho chế độ MOCK - ứng dụng native tự động gửi trong production)
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "INIT",
  "data": null
}
```

**Response:**
```json
{
  "event": "INIT",
  "sender": "MINIAPP_SDK",
  "data": {
    "internal": {
      "session": {
        "auth": {
          "token": "...",
          "refreshToken": "..."
        },
        "accInfo": {
          "userId": "...",
          "msisdn": "..."
        }
      },
      "deviceInfo": {
        "imei": "B1F798C6-3752-473B-B204-EED068EFD560",
        "platform": {
          "os": "ios",
          "osVersion": "16.0"
        }
      }
    },
    "external": {
      "generalInfo": {
        "msisdn": "0982014819",
        "billCode": "BILL12345",
        "masterMerchantCode": "PARTNER_MASTER",
        "merchantCode": "PARTNER_SERVICE",
        "totalAmount": 500000,
        "orderId": "ORDER_123",
        "sign": "signature_hash",
        "extraData": "{...}"
      },
      "serviceInfo": {
        // Cấu hình dịch vụ riêng của đối tác
      }
    }
  },
  "eventStatus": {
    "errorCode": "SDK000",
    "errorMessageVN": null,
    "errorMessageEN": null
  }
}
```

### 5.3 Mô Hình Dữ Liệu

```typescript
interface SdkDeviceInfo {
  imei: string;                    // Định danh thiết bị
  platform: {
    os: 'ios' | 'android';        // Hệ điều hành
    osVersion: string;             // Phiên bản OS
  };
}

interface SdkBusinessInfo {
  generalInfo: {
    msisdn: string;                // Số điện thoại người dùng
    billCode?: string;             // Mã hóa đơn/Mã học sinh/Mã dịch vụ
    partnerMerchantCode?: string;  // Mã merchant của đối tác
    masterMerchantCode?: string;   // Mã master merchant
    merchantCode?: string;         // Mã merchant dịch vụ
    totalAmount: number;           // Tổng số tiền giao dịch
    orderId: string;               // Mã đơn hàng của đối tác
    sign?: string;                 // Chữ ký bảo mật
    extraData?: string;            // Chuỗi JSON với dữ liệu bổ sung
  };
  serviceInfo: any;                // Cấu hình riêng của đối tác
}

interface SdkInputModel {
  internal: {
    session: {
      auth: {
        token: string;
        refreshToken: string;
        imei: string;
      };
      accInfo: {
        userId: string;
        msisdn: string;
        // ... các trường tài khoản khác
      };
    };
    deviceInfo: SdkDeviceInfo;
  };
  external: SdkBusinessInfo;
}
```

---

## 6. Tài Liệu Tham Khảo Phương Thức SDK 

### 6.1 Quản Lý Phiên Làm Việc

#### 6.1.1 Lưu Phiên (Đăng nhập)
**Event:** `LOGIN_SUCCESS`
**Mô tả:** Lưu phiên người dùng sau khi xác thực thành công.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "LOGIN_SUCCESS",
  "data": {
    "auth": {
      "token": "access_token",
      "refreshToken": "refresh_token",
      "imei": "device_id"
    },
    "accInfo": {
      "userId": "12345",
      "msisdn": "0982014819"
    }
  }
}
```

#### 6.1.2 Xóa Phiên (Đăng xuất)
**Event:** `CLEAR_SESSION`
**Mô tả:** Xóa phiên làm việc hiện tại.

#### 6.1.3 Phiên Hết Hạn
**Event:** `EXPIRED_SESSION`
**Mô tả:** Thông báo cho ứng dụng native rằng phiên đã hết hạn.

#### 6.1.4 Phiên Ẩn Danh
**Event:** `LOGIN_ANONYMOUS`
**Mô tả:** Tạo phiên tạm thời cho người dùng khách.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "LOGIN_ANONYMOUS",
  "data": {
    "partnerLink": "https://partner.com/service"
  }
}
```

### 6.2 Điều Hướng & Vòng Đời

#### 6.2.1 Thoát Miniapp
**Event:** `EXIT`
**Mô tả:** Đóng miniapp và tùy chọn điều hướng.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "EXIT",
  "data": {
    "response": {
      // Dữ liệu tùy chọn để truyền lại
    },
    "navigationAction": "STAY_CURRENT" | "RETURN_HOME" | "OPEN_QR_SCAN"
  }
}
```

**Hành động điều hướng:**
- `STAY_CURRENT` - Ở lại màn hình hiện tại
- `RETURN_HOME` - Quay về trang chủ ứng dụng
- `OPEN_QR_SCAN` - Mở máy quét QR

#### 6.2.2 Chuyển Tab
**Event:** `NAVIGATE_TAB`
**Mô tả:** Chuyển đến tab cụ thể trong ứng dụng native.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "NAVIGATE_TAB",
  "data": {
    "tabIndex": 0,
    "params": {}
  }
}
```

#### 6.2.3 Mở Ứng Dụng/Trình Duyệt Ngoài
**Event:** `APP_OPEN_STORE`
**Mô tả:** Mở ứng dụng bên ngoài hoặc URL trong trình duyệt.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "APP_OPEN_STORE",
  "data": {
    "package": "com.example.app",
    "appId": "id123456789",
    "fallbackUrlAndroid": "https://...",
    "fallbackUrliOS": "https://..."
  }
}
```

#### 6.2.4 Mở WebView
**Event:** `APP_OPEN_WEBVIEW`
**Mô tả:** Mở URL khác trong WebView native.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "APP_OPEN_WEBVIEW",
  "data": {
    "url": "https://example.com/page",
    "serviceName": "ServiceName",
    "isPaymentConfirm": false
  }
}
```

### 6.3 Bảo Mật & Mã Hóa

#### 6.3.1 Trao Đổi Khóa Mã Hóa
**Event:** `EXCHANGE_KEY`
**Mô tả:** Khởi tạo kênh giao tiếp bảo mật.

#### 6.3.2 Mã Hóa Dữ Liệu
**Event:** `ENCRYPT_DATA`
**Mô tả:** Mã hóa dữ liệu nhạy cảm sử dụng mã hóa native.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "ENCRYPT_DATA",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Response:**
```json
{
  "sender": "MINIAPP_SDK",
  "event": "ENCRYPT_DATA",
  "data": {
    "encrypted": "base64_encrypted_string",
    "signature": "signature_hash",
    "token": "encryption_token"
  },
  "eventStatus": {
    "errorCode": "SDK000",
    "errorMessageVN": null,
    "errorMessageEN": null
  }
}
```

#### 6.3.3 Giải Mã Dữ Liệu
**Event:** `DECRYPT_DATA`
**Mô tả:** Giải mã dữ liệu đã được mã hóa.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "DECRYPT_DATA",
  "data": {
    "encrypted": "base64_encrypted_string"
  }
}
```

### 6.4 Tích Hợp Thanh Toán

#### 6.4.1 Yêu Cầu Thanh Toán
**Event:** `PAYMENT_REQUEST`
**Mô tả:** Khởi tạo luồng thanh toán thông qua cổng thanh toán native.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "PAYMENT_REQUEST",
  "data": {
    "amount": 100000,
    "orderId": "ORDER_123",
    "description": "Thanh toán cho dịch vụ",
    "merchantCode": "MERCHANT_001",
    "paymentMethod": "WALLET"
  }
}
```

#### 6.4.2 Callback Thanh Toán
**Mô tả:** Lắng nghe các sự kiện trạng thái thanh toán.

**Sự kiện thành công:**
```json
{
  "sender": "MINIAPP_SDK",
  "event": "EVENT_PAYMENT_SUCCESS",
  "data": {
    "orderId": "ORDER_123",
    "transactionId": "TXN_456",
    "amount": 100000
  }
}
```

**Sự kiện thất bại:**
```json
{
  "sender": "MINIAPP_SDK",
  "event": "EVENT_PAYMENT_FAIL",
  "data": {
    "orderId": "ORDER_123",
    "errorCode": "PAYMENT_001",
    "errorMessage": "Số dư không đủ"
  }
}
```

#### 6.4.3 Mở Thanh Toán Napas
**Event:** `OPEN_NAPAS`
**Mô tả:** Mở cổng thanh toán Napas.

### 6.5 Tính Năng Thiết Bị

#### 6.5.1 Gọi Điện Thoại
**Event:** `OPEN_PHONE_CALL`
**Mô tả:** Khởi tạo cuộc gọi điện thoại.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "OPEN_PHONE_CALL",
  "data": "0982014819"
}
```

#### 6.5.2 Clipboard
**Event:** `APP_WRITE_CLIPBOARD`
**Mô tả:** Ghi văn bản vào clipboard.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "APP_WRITE_CLIPBOARD",
  "data": "Văn bản cần copy"
}
```

#### 6.5.3 Chia Sẻ Nội Dung
**Event:** `SHARE_BILL`
**Mô tả:** Chia sẻ nội dung thông qua chia sẻ native.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "SHARE_BILL",
  "data": "base64_image_string"
}
```

#### 6.5.4 Cấu Hình Thiết Bị
**Event:** `DEVICE_CONFIG`
**Mô tả:** Yêu cầu cấu hình/cài đặt thiết bị.

### 6.6 Truy Cập Danh Bạ

#### 6.6.1 Tìm Kiếm Danh Bạ
**Event:** `CONTACTS`
**Mô tả:** Truy cập danh bạ thiết bị.

**Dữ liệu gửi:**
```json
{
  "sender": "MINIAPP_WEBVIEW",
  "event": "CONTACTS",
  "data": {
    "searchQuery": "John",
    "limit": 20
  }
}
```

**Response:**
```json
{
  "sender": "MINIAPP_SDK",
  "event": "CONTACTS",
  "data": {
    "contacts": [
      {
        "name": "John Doe",
        "phoneNumber": "0123456789",
        "email": "john@example.com"
      }
    ]
  }
}
```

#### 6.6.2 Mở Trình Chọn Danh Bạ
**Event:** `OPEN_ICON_CONTACT`
**Mô tả:** Mở UI chọn danh bạ native.

**Lắng nghe:** Sự kiện `CALLBACK_CONTACT` với danh bạ được chọn.


## 7. Xử Lý Lỗi

### 7.1 Mã Lỗi

| Mã | Mô Tả | Giải Quyết |
|------|-------------|-----------|
| SDK000 | Thành công | Không cần hành động |
| SDK001 | Định dạng request không hợp lệ | Kiểm tra cấu trúc message |
| SDK002 | Thiếu tham số bắt buộc | Xác minh dữ liệu payload |
| SDK003 | Xác thực thất bại | Làm mới phiên |
| SDK004 | Quyền bị từ chối | Yêu cầu quyền người dùng |
| SDK005 | Hết thời gian chờ | Thử lại với exponential backoff |
| SDK006 | Lỗi mạng | Kiểm tra kết nối |
| SDK999 | Lỗi không xác định | Ghi log và liên hệ hỗ trợ |

### 7.2 Cấu Trúc Response Lỗi

```json
{
  "sender": "MINIAPP_SDK",
  "event": "EVENT_NAME",
  "eventStatus": {
    "errorCode": "SDK003",
    "errorMessageVN": "Xác thực thất bại",
    "errorMessageEN": "Authentication failed"
  },
  "data": null
}
```
---