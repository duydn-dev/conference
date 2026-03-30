export interface SdkContactRequest {
  filter: {
    contactName: string;
  }
  pager: {
    limitRow: number;
    pageNumber: number;
  }
}

export interface SdkContactInfo {
  contactName: string;
  contactNumber: string;
  contactAvt: string;
}

export interface SdkContactResponse {
  contactList: SdkContactInfo[];
  countContacts: number;
}
